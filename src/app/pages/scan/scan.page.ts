import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import { IVoucher, IVoucherActive, IVoucherInitialize, IVoucherItem, IVoucherItemContentType, IVoucherQR, IVoucherReceived } from 'src/app/interfaces/scan/IVoucher';
import { IVoucherItemType } from '../../interfaces/scan/IVoucher';
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

@Component({
    selector: 'app-scan',
    templateUrl: './scan.page.html',
    styleUrls: ['./scan.page.scss'],
})
export class ScanPage implements OnInit {
    @ViewChild('registerProductModal') registerProductModal!: IonModal;
    public isSupported = false;
    public currentVoucher: IVoucher | null = null;
    public processPrinting: boolean = false;
    public registerProduct!: FormGroup;
    public registerProductImages: string[] = [];
    public tryRegisterNewProduct: boolean = false;

    constructor(private eanService: EanService,
        private bluetoothSerial: BluetoothSerial,
        private storageService: StorageService,
        private voucherService: VoucherService,
        private toastService: ToastService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private formBuilder: FormBuilder,
        private productService: ProductService
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
    }

    async isGoogleBarcodeScannerModuleAvailable() {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        return available;
    }

    getFormattedName(name: IVoucherItemContentType) {
        if (name in IVoucherItemContentType)
            return IVoucherItemContentType[name].replace(/_/g, " ");
        return "Necunoscut";
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
            this.toastService.showToast("Vă rugăm să acordați camerei permisiunea de a utiliza scanerul de coduri de bare.", 2000, 'danger', 'bottom');
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

    addItemInVoucher(itemReceived: IProduct) {
        if(!this.currentVoucher) return;

        const newVoucherItem: IVoucherItem = {
            type: itemReceived.Type,
            name: itemReceived.Name,
            quantity: itemReceived.Volume,
            readDate: new Date(),
            eanCode: itemReceived.EanCode
        };
        this.currentVoucher.items.push(newVoucherItem);
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

    async getStorageData() {
        const storageData = await this.storageService.getStorageKey(DEBUG_STORAGE);
        if (storageData && storageData.value !== null) {
            const storageDataParsed = JSON.parse(storageData.value) as IDebugStorage;
            return storageDataParsed;
        }

        return null;
    }

    async getProfileData() {
        const profileData = await this.storageService.getStorageKey(PROFILE_KEY);
        if (profileData && profileData.value !== null) {
            const profileDataParsed = JSON.parse(profileData.value) as IUser;
            return profileDataParsed;
        }

        return null;
    }

    tryPrint() {
        if (!this.currentVoucher || this.processPrinting) return;

        if (this.getTotal() <= 0) {
            this.toastService.showToast("Nu puteți printa acest bon deoarece nu aveți ambalaje scanate!", 2000, 'danger', 'bottom');
            return;
        }

        this.processPrinting = true;

        if(this.currentVoucher.state === 1) this.printVoucher();
        else {

            const modelSent: IVoucherActive = {
                Code: this.currentVoucher.code,
                PlasticCount: this.getItemsCount(1),
                AluminiumCount: this.getItemsCount(2),
                GlassCount: this.getItemsCount(3),
                Items: this.currentVoucher.items
            }

            this.voucherService.activateVoucher(modelSent).subscribe({
                next: (res) => {
                    if (!this.currentVoucher) {
                        this.processPrinting = false;
                        this.cdr.detectChanges();
                        return;
                    }

                    if (res.State === 1) {
                        this.currentVoucher.state = res.State;
                        this.toastService.showToast("Bonul a fost activat cu succes!", 2000, 'success', 'bottom');
                    }
                    this.printVoucher();
                },
                error: (err) => {
                    console.log(err);
                    this.toastService.showToast("A intervenit o eroare în activarea voucherului, încercați mai tarziu!", 2000, 'danger', 'bottom');
                    this.processPrinting = false;
                    this.cdr.detectChanges();
                }
            });
        }


    }

    async printVoucher() {
        if(!this.currentVoucher) return;

        const storageDataParsed = await this.getStorageData();
        const profileDataParsed = await this.getProfileData();
        if (!storageDataParsed || !profileDataParsed) {
            this.toastService.showToast("Nu puteți printa acest bon deoarece a intervenit o eroare!", 2000, 'danger', 'bottom');
            return;
        }

        this.bluetoothSerial.connect(storageDataParsed.PrinterIdentifier).subscribe({
            next: async (res) => {
                if(!this.currentVoucher) return;

                const encoder = new EscPosEncoder();

                const qrCodeInfo: IVoucherQR = {
                    code: this.currentVoucher.code,
                    date: this.currentVoucher.generatedDate,
                    hour: this.currentVoucher.generatedTime,
                    expire: this.currentVoucher.expirationDate,
                    employeeCode: profileDataParsed.EmployeeCode,
                    officeCode: profileDataParsed.OfficeCode,
                    value: this.getTotal(),
                    plasticCount: this.getItemsCount(1),
                    aluminiumCount: this.getItemsCount(2),
                    glassCount: this.getItemsCount(3)
                }

                const resultPrint = encoder.
                    initialize()
                    .align('center')
                    .line(storageDataParsed.Header)
                    .line(storageDataParsed.Subheader)
                    .newline()
                    .align('left')
                    .line(`Cod: ${qrCodeInfo.code}`)
                    .line(`Operator: ${qrCodeInfo.employeeCode}`)
                    .table(
                        [
                            { width: 16, align: 'left' },
                            { width: 16, align: 'right' }
                        ],
                        [
                            [`Data: ${this.currentVoucher.generatedDate}`, `Ora: ${this.currentVoucher.generatedTime}`],
                            ['', ''],
                            ['Plastic', `x${this.getItemsCount(1)}`],
                            ['Aluminiu', `x${this.getItemsCount(2)}`],
                            ['Sticla', `x${this.getItemsCount(3)}`],
                        ]
                    )
                    .align('center')
                    .bold(true)
                    .line(`LEI ${this.getTotal().toFixed(2)}`)
                    .bold(false)
                    .newline()
                    .table(
                        [
                            { width: 18, align: 'left' },
                            { width: 14, align: 'right' }
                        ],
                        this.getItemsForVoucher()
                    )
                    .line(`Expira la: ${this.currentVoucher.expirationDate}`)
                    .qrcode(JSON.stringify(qrCodeInfo))
                    .encode();

                await this.bluetoothSerial.write(resultPrint);
                this.router.navigateByUrl('/home', { replaceUrl: true });
                this.processPrinting = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toastService.showToast("A intervenit o eroare în legătura cu printerul, încercați mai tarziu!", 2000, 'danger', 'bottom');
                this.processPrinting = false;
                this.cdr.detectChanges();
            }
        });
    }

    getItemsForVoucher() {
        if (!this.currentVoucher) return [];

        return this.currentVoucher.items.map(x => [x.name, x.eanCode]);
    }

    async noProductFound(eanCode: string) {
        const { value } = await Dialog.confirm({
            title: "Ambalaj negăsit",
            message: "Ambalaj negăsit în baza de date! Doriți să îl înregistrați?",
            okButtonTitle: "Da",
            cancelButtonTitle: "Nu",
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

        if(this.tryRegisterNewProduct) return false;

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
                    this.toastService.showToast('Produsul a fost înregistrat cu succes!', 2000, 'success', 'top');
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
        if(!this.currentVoucher) return;

        if(this.currentVoucher.state === 1) {
            this.router.navigateByUrl('/home', { replaceUrl: true });
            return;
        }

        const { value } = await Dialog.confirm({
            title: "Voucher",
            message: "Ai un bon activ, sunteți sigur că doriți ca acesta să fie anulat?",
            okButtonTitle: "Anulează",
            cancelButtonTitle: "Continuă scanarea",
        });

        if (!value) return;

        this.router.navigateByUrl('/home', { replaceUrl: true });
    }
}
