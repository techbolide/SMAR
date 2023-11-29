import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Camera, CameraResultType } from '@capacitor/camera';
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

@Component({
    selector: 'app-scan',
    templateUrl: './scan.page.html',
    styleUrls: ['./scan.page.scss'],
})
export class ScanPage implements OnInit {
    public isSupported = false;
    public currentVoucher: IVoucher | null = null;
    public processPrinting: boolean = false;

    constructor(private eanService: EanService,
        private bluetoothSerial: BluetoothSerial,
        private storageService: StorageService,
        private voucherService: VoucherService,
        private toastService: ToastService,
        private router: Router,
        private cdr: ChangeDetectorRef
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

    async initializeVoucher() {
        const storageDataParsed = await this.getStorageData();
        if(!storageDataParsed) return;

        const sentModel: IVoucherInitialize = {
            employeeCode: storageDataParsed.EmployeeCode,
            officeCode: storageDataParsed.OfficeCode
        }

        this.voucherService.initializeVoucher(sentModel).subscribe({
            next: (res) => {
                this.currentVoucher = {
                    code: res.Code,
                    expirationDate: res.ExpirationDate.substring(0, 10),
                    generatedDate: res.GeneratedDate.substring(0, 10),
                    generatedTime: res.GeneratedTime.substring(0, 8),
                    employeeCode: storageDataParsed.EmployeeCode,
                    officeCode: storageDataParsed.OfficeCode,
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



    scanSingleBarCode(barcode: Barcode) {
        if (!this.currentVoucher) return;

        const itemReceived = this.eanService.validateEAN(barcode.displayValue);
        if (itemReceived.type === IVoucherItemType.Necunoscut) return;

        this.currentVoucher.items.push(itemReceived);
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
        if(storageData && storageData.value !== null) {
            const storageDataParsed = JSON.parse(storageData.value) as IDebugStorage;
            return storageDataParsed;
        }

        return null;
    }

    async tryPrint() {
        if(!this.currentVoucher || this.processPrinting) return;

        if(this.getTotal() <= 0) {
            this.toastService.showToast("Nu puteți printa acest bon deoarece nu aveți ambalaje scanate!", 2000, 'danger', 'bottom');
            return;
        }

        const storageDataParsed = await this.getStorageData();
        if(!storageDataParsed) {
            this.toastService.showToast("Nu puteți printa acest bon deoarece a intervenit o eroare!", 2000, 'danger', 'bottom');
            return;
        }

        // validare server
        const modelSent: IVoucherActive = {
            Code: this.currentVoucher.code,
            PlasticCount: this.getItemsCount(1),
            AluminiumCount: this.getItemsCount(2),
            GlassCount: this.getItemsCount(3),
            Items: this.currentVoucher.items
        }
        this.processPrinting = true;

        this.voucherService.activateVoucher(modelSent).subscribe({
            next: (res) => {
                if(res.State !== 1) {
                    this.processPrinting = false;
                    this.cdr.detectChanges();
                    this.toastService.showToast("A intervenit o eroare, încercați mai tarziu!", 2000, 'danger', 'bottom');
                    return;
                }
                this.toastService.showToast("Bonul a fost activat cu succes!", 2000, 'success', 'bottom');
                setTimeout(() => {
                    this.bluetoothSerial.connect(storageDataParsed.PrinterIdentifier).subscribe({
                        next: async (res) => {
                            if(!this.currentVoucher) return;

                            const encoder = new EscPosEncoder();

                            const qrCodeInfo: IVoucherQR = {
                                code: this.currentVoucher.code,
                                date: this.currentVoucher.generatedDate,
                                hour: this.currentVoucher.generatedTime,
                                expire: this.currentVoucher.expirationDate,
                                employeeCode: this.currentVoucher.employeeCode,
                                officeCode: this.currentVoucher.officeCode,
                                value: this.getTotal(),
                                plasticCount: this.getItemsCount(1),
                                aluminiumCount: this.getItemsCount(2),
                                glassCount: this.getItemsCount(3)
                            }


                            /*  Header
                                Subheader
                                Info
                                Info totaluri
                                Info fiecare linie
                                QrCode
                                Footer
                            */
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
                                        [ `Data: ${this.currentVoucher.generatedDate}`, `Ora: ${this.currentVoucher.generatedTime}` ],
                                        [ '', '' ],
                                        [ 'Plastic', `x${this.getItemsCount(1)}` ],
                                        [ 'Aluminiu', `x${this.getItemsCount(2)}` ],
                                        [ 'Sticla', `x${this.getItemsCount(3)}` ],
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
                }, 500);
            },
            error: (err) => {
                console.log(err);
                this.toastService.showToast("A intervenit o eroare, încercați mai tarziu!", 2000, 'danger', 'bottom');
                this.processPrinting = false;
                this.cdr.detectChanges();
            }
        });
    }

    getItemsForVoucher() {
        if(!this.currentVoucher) return [];

        return this.currentVoucher.items.map(x=> [this.getFormattedName(x.name), x.eanCode]);
    }

    async tryGoBack() {
        const { value } = await Dialog.confirm({
            title: "Voucher",
            message: "Ai un bon activ, sunteți sigur că doriți ca acesta să fie anulat?",
            okButtonTitle: "Anulează",
            cancelButtonTitle: "Continuă scanarea",
        });

        if(!value) return;

        this.router.navigateByUrl('/home', { replaceUrl: true });
    }
}
