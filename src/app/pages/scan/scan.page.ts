import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import { IVoucher, IVoucherActive, IVoucherInitialize, IVoucherItem, IVoucherQR, IVoucherReceived } from 'src/app/interfaces/voucher/IVoucher';
import { IVoucherItemType } from '../../interfaces/voucher/IVoucher';
import { EanService } from 'src/app/services/ean/ean.service';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import EscPosEncoder from '@mineminemine/esc-pos-encoder-ionic';
import { DatePipe } from '@angular/common';
import { StorageService } from 'src/app/services/storage/storage.service';
import { DEBUG_STORAGE, IDebugStorage } from 'src/app/app.component';
import { VoucherService } from 'src/app/services/voucher/voucher.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Router } from '@angular/router';
import { PROFILE_KEY } from 'src/app/services/authentication/authentication.service';
import { IUser } from 'src/app/interfaces/authentication/IUser';
import { IonModal } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from 'src/app/services/product/product.service';
import { IProduct } from 'src/app/interfaces/product/IProduct';
import { BlePrinterService } from 'src/app/services/ble-printer/ble-printer.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-scan',
    templateUrl: './scan.page.html',
    styleUrls: ['./scan.page.scss'],
})
export class ScanPage implements OnInit {
    @ViewChild('registerProductModal', { static: true }) registerProductModal!: IonModal;
    @ViewChild('voucherModal', { static: false }) voucherModal!: IonModal;
    public isSupported = false;
    public currentVoucher: IVoucher | null = null;
    public processPrinting: boolean = false;
    public registerProduct!: FormGroup;
    public registerProductImages: string[] = [];
    public tryRegisterNewProduct: boolean = false;

    constructor(private eanService: EanService,
        private voucherService: VoucherService,
        private toastService: ToastService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private formBuilder: FormBuilder,
        private productService: ProductService,
        private blePrinterService: BlePrinterService,
        private translateService: TranslateService
    ) { }

    ngOnInit() {
        this.initializeVoucher();
        this.checkSupported();
    }

    checkSupported() {
        if (Capacitor.getPlatform() === 'web') return;

        BarcodeScanner.isSupported().then((result) => {
            this.isSupported = result.supported;
        });
    }

    initializeVoucher() {
        setTimeout(() => {
            this.voucherService.initializeVoucher().subscribe({
                next: (res) => {
                    this.currentVoucher = {
                        code: res.Code,
                        expirationDate: res.ExpirationDate.substring(0, 10),
                        generatedDate: res.GeneratedDate.substring(0, 10),
                        generatedTime: res.GeneratedTime.substring(0, 8),
                        state: res.State,
                        items: []
                    }
                },
                error: (err) => {
                    console.log(err);
                    this.currentVoucher = null;
                }
            });
        }, 500);
    }

    async isGoogleBarcodeScannerModuleAvailable() {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        return available;
    }

    getFormattedType(type: IVoucherItemType) {

        if (type in IVoucherItemType) {
            const voucherType = IVoucherItemType[type];
            switch (voucherType.toLowerCase()) {
                case 'aluminiu': return 'can';
                case 'sticla': return 'glass';
                default: return 'plastic-bottle';
            }
        }

        return 'plastic-bottle';
    }


    async tryScanBarCode() {
        if (!this.currentVoucher) return;
        const granted = await this.requestPermissions();
        if (!granted) {
            this.toastService.showToast(this.translateService.instant('Toast.CameraPermission'), 2000, 'danger', 'bottom');
            return;
        }

        const moduleInstalled = await this.isGoogleBarcodeScannerModuleAvailable();
        if (!moduleInstalled) {
            this.addGoogleModuleListener();
            console.log("[SCANNER] Module not installed, installing...");
            await BarcodeScanner.installGoogleBarcodeScannerModule();
        } else {
            this.scanBarCode();
        }
    }

    addGoogleModuleListener() {
        BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', (event: any) => {
            const { status, progress } = event;

            if (status === 'done') {
                console.log('[SCANNER] Module installation completed');
                this.scanBarCode();
            } else if (status === 'error') {
                console.error('[SCANNER] Module installation error:', event.error);
            }
        });
    }

    async scanBarCode() {
        const { barcodes } = await BarcodeScanner.scan();
        barcodes.forEach(barcode => {
            this.scanSingleBarCode(barcode);
        });
    }


    async scanSingleBarCode(barcode: Barcode) {
        if (!this.currentVoucher) return;

        const itemReceived = await this.eanService.validateEAN(barcode.displayValue);
        if (!itemReceived) {
            this.noProductFound(barcode.displayValue);
            return;
        }

        this.addItemInVoucher(itemReceived);
    }

    generateRandomString(): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';

        for (let i = 0; i < 3; i++) {
            const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
            result += randomChar + randomChar;
        }

        return result;
    }

    checkIfUniqueIdExists() {
        if (!this.currentVoucher) return;

        let generatedID = this.generateRandomString();
        let findItem = this.currentVoucher.items.find((x) => x.uniqueID === generatedID);
        while (findItem) {
            generatedID = this.generateRandomString();
            findItem = this.currentVoucher.items.find((x) => x.uniqueID === generatedID);
        }

        return generatedID;
    }

    addItemInVoucher(itemReceived: IProduct) {
        if (!this.currentVoucher) return;

        const generatedID = this.checkIfUniqueIdExists();
        if(!generatedID) return;

        const newVoucherItem: IVoucherItem = {
            uniqueID: generatedID,
            type: itemReceived.Type,
            name: itemReceived.Name,
            quantity: itemReceived.Volume,
            readDate: new Date(),
            eanCode: itemReceived.EanCode
        };
        this.currentVoucher.items.push(newVoucherItem);
        this.currentVoucher.items.sort((a, b) => b.readDate.getTime() - a.readDate.getTime());
        this.toastService.showToast(this.translateService.instant('Toast.ProductRegistered'), 2000, 'success', 'top');
    }

    async tryDeleteItemFromVoucher(uniqueID: string) {
        if (!this.currentVoucher) return;

        const { value } = await Dialog.confirm({
            title: this.translateService.instant('NewVoucher.DeleteItemDialog.Title'),
            message: this.translateService.instant('NewVoucher.DeleteItemDialog.Subtitle'),
            okButtonTitle: this.translateService.instant('NewVoucher.DeleteItemDialog.Confirm'),
            cancelButtonTitle: this.translateService.instant('NewVoucher.DeleteItemDialog.Cancel'),
        });

        if (!value) return;

        this.deleteItemFromVoucher(uniqueID);
    }

    deleteItemFromVoucher(uniqueID: string) {
        if (!this.currentVoucher) return;

        const findItem = this.currentVoucher.items.find((x) => x.uniqueID === uniqueID);
        if(!findItem) return;

        this.currentVoucher.items = this.currentVoucher.items.filter(x=> x.uniqueID !== findItem.uniqueID);
        this.toastService.showToast(this.translateService.instant('Toast.ProductDeleted'), 2000, 'success', 'top');
    }

    async requestPermissions() {
        const { camera } = await BarcodeScanner.requestPermissions();
        return camera === 'granted' || camera === 'limited';
    }

    getTotal() {
        if (!this.currentVoucher) return 0;

        return this.currentVoucher.items.length * 0.5;
    }

    getItemsCount(type: IVoucherItemType) {
        if (!this.currentVoucher) return 0;

        return this.currentVoucher.items.filter(x => x.type === type).length;
    }

    tryPrint(type: string) {
        if (!this.currentVoucher) return;

        this.voucherModal.dismiss();
        this.processPrinting = true;


        if (this.currentVoucher.state === 1) {
            this.printVoucher();
            return;
        }

        if(this.currentVoucher.state === 5 && type === 'cash') {
            this.router.navigateByUrl('/home', { replaceUrl: true });
            return;
        }

        const modelSent: IVoucherActive = {
            Code: this.currentVoucher.code,
            PlasticCount: this.getItemsCount(1),
            AluminiumCount: this.getItemsCount(2),
            GlassCount: this.getItemsCount(3),
            Items: this.currentVoucher.items,
            Type: type
        }

        this.voucherService.activateVoucher(modelSent).subscribe({
            next: (res) => {
                if (!this.currentVoucher) {
                    this.processPrinting = false;
                    this.cdr.detectChanges();
                    return;
                }

                this.currentVoucher.state = res.State;
                this.toastService.showToast(this.translateService.instant('Toast.VoucherActivate'), 1000, 'success', 'bottom');

                if(this.currentVoucher.state === 1) setTimeout(() => { this.printVoucher(); }, 1000);
                else if(this.currentVoucher.state === 5) setTimeout(() => { this.router.navigateByUrl('/home', { replaceUrl: true }); }, 1000);
            },
            error: (err) => {
                console.log(err);
                this.toastService.showToast(this.translateService.instant('Toast.VoucherActivateError'), 2000, 'danger', 'bottom');
                this.processPrinting = false;
                this.cdr.detectChanges();
            }
        });
    }

    openVoucherModal() {
        if(this.processPrinting)
            return;

        if (this.getTotal() <= 0) {
            this.toastService.showToast(this.translateService.instant('Toast.CantScanWithoutProducts'), 2000, 'danger', 'bottom');
            return;
        }

        this.voucherModal.present();
    }

    async printVoucher() {
        if (!this.currentVoucher) return;

        const voucherReceived: IVoucherReceived = {
            Code: this.currentVoucher.code,
            ExpirationDate: this.currentVoucher.expirationDate,
            GeneratedDate: this.currentVoucher.generatedDate,
            GeneratedTime: this.currentVoucher.generatedTime,
            InsertBy: '',
            InsertDate: '',
            State: this.currentVoucher.state,
            PlasticCount: this.getItemsCount(1),
            AluminiumCount: this.getItemsCount(2),
            GlassCount: this.getItemsCount(3),
            Value: this.getTotal(),
            Message: ''
        };

        const formatVoucher = await this.voucherService.formatVoucher(voucherReceived);
        try {
            await this.blePrinterService.print(formatVoucher);
            this.toastService.showToast(this.translateService.instant('Toast.VoucherPrint'), 2000, 'success', 'bottom');
            setTimeout(() => {
                this.router.navigateByUrl('/home', { replaceUrl: true });
            }, 500);
        } catch {
            this.toastService.showToast(this.translateService.instant('Toast.PrinterError'), 2000, 'danger', 'bottom');
        }
        this.processPrinting = false;
        this.cdr.detectChanges();
    }

    getItemsForVoucher() {
        if (!this.currentVoucher) return [];

        return this.currentVoucher.items.map(x => [x.name, x.eanCode]);
    }

    async noProductFound(eanCode: string) {
        const { value } = await Dialog.confirm({
            title: this.translateService.instant('NewVoucher.NoProductFoundDialog.Title'),
            message: this.translateService.instant('NewVoucher.NoProductFoundDialog.Subtitle'),
            okButtonTitle: this.translateService.instant('NewVoucher.NoProductFoundDialog.Confirm'),
            cancelButtonTitle: this.translateService.instant('NewVoucher.NoProductFoundDialog.Cancel'),
        });

        if (!value) return;

        this.registerProductModal.present();
        this.initializeRegisterProductValidators(eanCode);
    }

    initializeRegisterProductValidators(eanCode: string = '') {
        this.registerProductImages = ['', '', ''];
        this.registerProduct = this.formBuilder.group({
            eanCode: [eanCode, [Validators.required]],
            name: ['', [Validators.required]],
            volume: ['', [Validators.required]],
            productCategoryId: ['1', [Validators.required]],
        });
    }

    canRegisterNewProduct() {
        if (!this.registerProduct.valid) return false;

        if (!this.registerProductImages.every(image => image.length > 0)) return false;

        if (this.tryRegisterNewProduct) return false;

        return true;
    }

    async registerNewProduct() {
        if (!this.canRegisterNewProduct()) return;

        this.tryRegisterNewProduct = true;
        const formValues = this.registerProduct.value;
        const formData = new FormData();
        for (let i = 1; i <= 3; i++) {
            if (this.registerProductImages[i - 1].length <= 0) {
                formData.append(`Image${i}`, '');
                continue;
            }

            const response = await fetch(this.registerProductImages[i - 1]);
            const blob = await response.blob();
            formData.append(`Image${i}`, blob, `image${i}-product.jpg`);
        }

        formData.append('Name', formValues.name);
        formData.append('Code', formValues.eanCode);
        formData.append('Volume', formValues.volume);
        formData.append('ProductCategoryId', formValues.productCategoryId);

        this.uploadNewProduct(formData);
    }

    uploadNewProduct(formData: FormData) {
        this.productService.registerProduct(formData).subscribe({
            next: async (itemReceived) => {
                await this.registerProductModal.dismiss();
                this.initializeRegisterProductValidators();
                setTimeout(() => {
                    this.addItemInVoucher(itemReceived);
                    this.tryRegisterNewProduct = false;
                }, 500);
            },
            error: (err) => {
                this.tryRegisterNewProduct = false;
                console.log(err);
            }
        })
    }

    markAction(index: number) {
        if (this.registerProductImages[index].length > 0) this.registerProductImages[index] = '';
        else this.takePicture(index);
    }

    async takePicture(index: number) {
        const pictureTaken = await Camera.getPhoto({
            quality: 90,
            source: CameraSource.Camera,
            allowEditing: false,
            resultType: CameraResultType.Uri
        });
        const base64Data = await this.readAsBase64(pictureTaken);
        if (!base64Data) return;

        this.registerProductImages[index] = base64Data;
    }

    async readAsBase64(photo: Photo) {
        if (!photo.webPath) return null;

        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        return await this.convertBlobToBase64(blob) as string;
    }

    convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.readAsDataURL(blob);
    });


    async tryGoBack() {
        if (!this.currentVoucher) return;

        if (this.currentVoucher.state === 1 || this.currentVoucher.state === 5) {
            this.router.navigateByUrl('/home', { replaceUrl: true });
            return;
        }

        const { value } = await Dialog.confirm({
            title: this.translateService.instant('NewVoucher.ActiveVoucherDialog.Title'),
            message: this.translateService.instant('NewVoucher.ActiveVoucherDialog.Subtitle'),
            okButtonTitle: this.translateService.instant('NewVoucher.ActiveVoucherDialog.Confirm'),
            cancelButtonTitle: this.translateService.instant('NewVoucher.ActiveVoucherDialog.Cancel'),
        });

        if (!value) return;

        this.router.navigateByUrl('/home', { replaceUrl: true });
    }
}
