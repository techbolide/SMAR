import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { DEBUG_STORAGE, IDebugStorage } from 'src/app/app.component';
import { IPaginated, IVoucherQR, IVoucherReceived } from 'src/app/interfaces/voucher/IVoucher';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { VoucherService } from 'src/app/services/voucher/voucher.service';
import EscPosEncoder from '@mineminemine/esc-pos-encoder-ionic';
import { Router } from '@angular/router';
import { PROFILE_KEY } from 'src/app/services/authentication/authentication.service';
import { IUser } from 'src/app/interfaces/authentication/IUser';
import { BlePrinterService } from 'src/app/services/ble-printer/ble-printer.service';
import { TranslateService } from '@ngx-translate/core';


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
        private router: Router,
        private blePrinterService: BlePrinterService,
        private translateService: TranslateService,
        private cdr: ChangeDetectorRef) { }

    ionViewDidEnter() {
        this.getVouchers();
        this.checkSupported();
    }

    ionViewDidLeave() {
        this.vouchers = null;
    }

    handleRefresh(event: any) {
        const model: IPaginated = { from: 0, take: 20 }
        this.vouchers = null;
        setTimeout(() => {
            this.voucherService.getVouchers(model).subscribe({
                next: (res) => {
                    this.vouchers = [...res];
                    event.target.complete();
                },
                error: (err) => {
                    this.vouchers = [];
                    event.target.complete();
                }
            });
        }, 2000);
    }

    getVouchers() {
        const model: IPaginated = { from: 0, take: 20 }

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

    reprint(voucher: IVoucherReceived) {
        if (this.isReprinting || (voucher.State !== 1 && voucher.State !== 2)) return;

        this.isReprinting = true;
        setTimeout(() => {
            if (voucher.State === 1) this.tryPrint(voucher);
            else this.tryPrintTicket(voucher);
        }, 750);
    }

    async tryPrintTicket(voucher: IVoucherReceived) {
        try {
            const formatTicket = await this.voucherService.formatTicket(voucher);
            await this.blePrinterService.print(formatTicket);
            this.toastService.showToast(this.translateService.instant('Toast.VoucherReprint'), 2000, 'success', 'bottom');
        } catch {
            this.toastService.showToast(this.translateService.instant('Toast.PrinterError'), 2000, 'danger', 'bottom');
        }
        this.isReprinting = false;
        this.cdr.detectChanges();
    }

    async tryPrint(voucher: IVoucherReceived) {
        try {
            const formatVoucher = await this.voucherService.formatVoucher(voucher);
            await this.blePrinterService.print(formatVoucher);
            this.toastService.showToast(this.translateService.instant('Toast.VoucherReprint'), 2000, 'success', 'bottom');
        } catch {
            this.toastService.showToast(this.translateService.instant('Toast.PrinterError'), 2000, 'danger', 'bottom');
        }
        this.isReprinting = false;
        this.cdr.detectChanges();
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
            this.goToDetails(barcode.displayValue);
        });
    }

    goToDetails(details: string) {
        try {
            const detailsParsed = JSON.parse(details) as IVoucherQR;
            if (!detailsParsed) return;

            this.router.navigate(['/voucher-history', detailsParsed.code]);

        } catch {

        }
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
            case 5: return 'secondary';
            case 10: return 'danger';
            default: return 'dark';
        }
    }

    getVoucherStateText(state: number) {
        switch (state) {
            case 1: return 'VoucherHistory.Types.Active';
            case 2: return 'VoucherHistory.Types.Used';
            case 3: return 'VoucherHistory.Types.Expired';
            case 4: return 'VoucherHistory.Types.Suspect';
            case 5: return 'VoucherHistory.Types.Cash';
            case 10: return 'VoucherHistory.Types.Invalid';
            default: return 'N/A';
        }
    }


}
