import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { DEBUG_STORAGE, IDebugStorage } from 'src/app/app.component';
import { IVoucherGetHistory, IVoucherQR, IVoucherReceived } from 'src/app/interfaces/scan/IVoucher';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { VoucherService } from 'src/app/services/voucher/voucher.service';
import EscPosEncoder from '@mineminemine/esc-pos-encoder-ionic';


@Component({
    selector: 'app-voucher-history',
    templateUrl: './voucher-history.page.html',
    styleUrls: ['./voucher-history.page.scss'],
})
export class VoucherHistoryPage {
    public isSupported = false;
    public vouchers: IVoucherReceived[] | null = null;
    public isReprinting = false;
    constructor(private toastService: ToastService,
        private voucherService: VoucherService,
        private storageService: StorageService,
        private bluetoothSerial: BluetoothSerial,
        private cdr: ChangeDetectorRef) { }

    ionViewDidEnter() {
        this.getVouchers();
        this.checkSupported();
    }

    ionViewDidLeave() {
        this.vouchers = null;
    }

    async getVouchers() {
        const storageDataParsed = await this.getStorageData();
        if (!storageDataParsed) {
            this.vouchers = [];
            return;
        }

        const model: IVoucherGetHistory = {
            officeCode: storageDataParsed.OfficeCode,
            from: 0,
            take: 100
        }

        setTimeout(() => {
            this.voucherService.getVouchers(model).subscribe({
                next: (res) => {
                    this.vouchers = [...res];
                },
                error: (err) => {
                    this.vouchers = [];
                }
            })
        }, 1000);
    }

    async getStorageData() {
        const storageData = await this.storageService.getStorageKey(DEBUG_STORAGE);
        if (storageData && storageData.value !== null) {
            const storageDataParsed = JSON.parse(storageData.value) as IDebugStorage;
            return storageDataParsed;
        }

        return null;
    }

    reprint(voucher: IVoucherReceived) {
        if (this.isReprinting) return;

        this.isReprinting = true;
        setTimeout(() => {
            if (voucher.State === 1) this.tryPrint(voucher);
            else this.tryPrintTicket(voucher);
        }, 750);
    }

    async tryPrintTicket(voucher: IVoucherReceived) {
        const storageDataParsed = await this.getStorageData();
        if (!storageDataParsed) {
            this.toastService.showToast("Nu puteți printa acest bon deoarece a intervenit o eroare!", 2000, 'danger', 'bottom');
            this.isReprinting = false;
            return;
        }

        this.bluetoothSerial.connect(storageDataParsed.PrinterIdentifier).subscribe({
            next: async (res) => {
                const encoder = new EscPosEncoder();

                const qrCodeInfo: IVoucherQR = {
                    code: voucher.Code,
                    date: voucher.GeneratedDate.substring(0, 10),
                    hour: voucher.GeneratedTime.substring(0, 8),
                    expire: voucher.ExpirationDate.substring(0, 10),
                    employeeCode: storageDataParsed.EmployeeCode,
                    officeCode: storageDataParsed.OfficeCode,
                    value: voucher.Value,
                    plasticCount: voucher.PlasticCount,
                    aluminiumCount: voucher.AluminiumCount,
                    glassCount: voucher.GlassCount
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
                    .line(`Bon: ${qrCodeInfo.code}`)
                    .line(`Operator: ${qrCodeInfo.employeeCode}`)
                    .table(
                        [
                            { width: 16, align: 'left' },
                            { width: 16, align: 'right' }
                        ],
                        [
                            [`Data: ${qrCodeInfo.date}`, `Ora: ${qrCodeInfo.hour}`],
                            ['', ''],
                            ['Plastic', `x${qrCodeInfo.plasticCount}`],
                            ['Aluminiu', `x${qrCodeInfo.aluminiumCount}`],
                            ['Sticla', `x${qrCodeInfo.glassCount}`],
                        ]
                    )
                    .align('center')
                    .bold(true)
                    .line(`LEI ${qrCodeInfo.value.toFixed(2)}`)
                    .bold(false)
                    .encode();

                await this.bluetoothSerial.write(resultPrint);
                this.toastService.showToast("Bon reprintat cu succes!", 2000, 'success', 'bottom');
                this.isReprinting = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toastService.showToast("A intervenit o eroare în legătura cu printerul, încercați mai tarziu!", 2000, 'danger', 'bottom');
                this.isReprinting = false;
                this.cdr.detectChanges();
            }
        });
    }

    async tryPrint(voucher: IVoucherReceived) {
        const storageDataParsed = await this.getStorageData();
        if (!storageDataParsed) {
            this.toastService.showToast("Nu puteți printa acest bon deoarece a intervenit o eroare!", 2000, 'danger', 'bottom');
            this.isReprinting = false;
            return;
        }

        this.bluetoothSerial.connect(storageDataParsed.PrinterIdentifier).subscribe({
            next: async (res) => {
                const encoder = new EscPosEncoder();

                const qrCodeInfo: IVoucherQR = {
                    code: voucher.Code,
                    date: voucher.GeneratedDate.substring(0, 10),
                    hour: voucher.GeneratedTime.substring(0, 8),
                    expire: voucher.ExpirationDate.substring(0, 10),
                    employeeCode: storageDataParsed.EmployeeCode,
                    officeCode: storageDataParsed.OfficeCode,
                    value: voucher.Value,
                    plasticCount: voucher.PlasticCount,
                    aluminiumCount: voucher.AluminiumCount,
                    glassCount: voucher.GlassCount
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
                            [`Data: ${voucher.GeneratedDate.substring(0, 10)}`, `Ora: ${voucher.GeneratedTime.substring(0, 8)}`],
                            ['', ''],
                            ['Plastic', `x${voucher.PlasticCount}`],
                            ['Aluminiu', `x${voucher.AluminiumCount}`],
                            ['Sticla', `x${voucher.GlassCount}`],
                        ]
                    )
                    .align('center')
                    .bold(true)
                    .line(`LEI ${voucher.Value.toFixed(2)}`)
                    .bold(false)
                    .line(`Expira la: ${voucher.ExpirationDate.substring(0, 10)}`)
                    .qrcode(JSON.stringify(qrCodeInfo))
                    .encode();


                await this.bluetoothSerial.write(resultPrint);
                this.toastService.showToast("Bon reprintat cu succes!", 2000, 'success', 'bottom');
                this.isReprinting = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toastService.showToast("A intervenit o eroare în legătura cu printerul, încercați mai tarziu!", 2000, 'danger', 'bottom');
                this.isReprinting = false;
                this.cdr.detectChanges();
            }
        });
    }

    checkSupported() {
        if (Capacitor.getPlatform() === 'web') return;

        BarcodeScanner.isSupported().then((result) => {
            this.isSupported = result.supported;
        });
    }

    async isGoogleBarcodeScannerModuleAvailable() {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        return available;
    }

    async tryScanBarCode() {
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
            console.log(barcode);
        });
    }


    async requestPermissions(): Promise<boolean> {
        const { camera } = await BarcodeScanner.requestPermissions();
        return camera === 'granted' || camera === 'limited';
    }

    getVoucherStateColor(state: number) {
        switch (state) {
            case 1: return 'success';
            case 2: return 'warning';
            case 3: return 'danger';
            case 4: return 'danger';
            case 10: return 'danger';
            default: return 'dark';
        }
    }

    getVoucherStateText(state: number) {
        switch (state) {
            case 1: return 'ACTIV';
            case 2: return 'FOLOSIT';
            case 3: return 'EXPIRAT';
            case 4: return 'SUSPECT';
            case 10: return 'INVALID';
            default: return 'N/A';
        }
    }


}
