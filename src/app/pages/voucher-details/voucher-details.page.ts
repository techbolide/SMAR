import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import EscPosEncoder from '@mineminemine/esc-pos-encoder-ionic';
import { TranslateService } from '@ngx-translate/core';
import { DEBUG_STORAGE, IDebugStorage } from 'src/app/app.component';
import { IUser } from 'src/app/interfaces/authentication/IUser';
import { IVoucherActive, IVoucherGetByScan, IVoucherItemType, IVoucherQR, IVoucherReceived, IVoucherReceivedByScan } from 'src/app/interfaces/voucher/IVoucher';
import { PROFILE_KEY } from 'src/app/services/authentication/authentication.service';
import { BlePrinterService } from 'src/app/services/ble-printer/ble-printer.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { VoucherService } from 'src/app/services/voucher/voucher.service';

@Component({
    selector: 'app-voucher-details',
    templateUrl: './voucher-details.page.html',
    styleUrls: ['./voucher-details.page.scss'],
})
export class VoucherDetailsPage implements OnInit {
    public currentVoucher: IVoucherReceivedByScan | null = null;
    public processPrinting: boolean = false;
    constructor(private route: ActivatedRoute,
        private voucherService: VoucherService,
        private storageService: StorageService,
        private toastService: ToastService,
        private blePrinterService: BlePrinterService,
        private translateService: TranslateService,
        private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.getParams();
    }

    getParams() {
        this.route.params.subscribe((params) => {
            this.getVoucher(params['id']);
        });
    }

    async getVoucher(code: string) {
        const sentModel: IVoucherGetByScan = { Code: code };

        this.voucherService.getByScan(sentModel).subscribe({
            next: (res) => {
                this.currentVoucher = res;
            },
            error: (err) => {
                console.log(err);
            }
        })
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

    reprint() {
        if (!this.currentVoucher || this.processPrinting) return;

        this.processPrinting = true;
        setTimeout(() => {
            if (this.currentVoucher!.State === 1) this.tryPrint();
            else this.tryPrintTicket();
        }, 750);
    }

    async tryPrintTicket() {
        if (!this.currentVoucher) return;

        try {
            const formatTicket = await this.voucherService.formatTicket(this.currentVoucher);
            await this.blePrinterService.print(formatTicket);
            this.toastService.showToast(this.translateService.instant('Toast.TicketPrint'), 2000, 'success', 'bottom');
        } catch {
            this.toastService.showToast(this.translateService.instant('Toast.PrinterError'), 2000, 'danger', 'bottom');
        }
        this.processPrinting = false;
        this.cdr.detectChanges();
    }

    async tryPrint() {
        if (!this.currentVoucher) return;

        try {
            const formatVoucher = await this.voucherService.formatVoucher(this.currentVoucher);
            await this.blePrinterService.print(formatVoucher);
            this.toastService.showToast(this.translateService.instant('Toast.VoucherReprint'), 2000, 'success', 'bottom');
        } catch {
            this.toastService.showToast(this.translateService.instant('Toast.PrinterError'), 2000, 'danger', 'bottom');
        }
        this.processPrinting = false;
        this.cdr.detectChanges();
    }

    useVoucher() {
        if (!this.currentVoucher) return;

        this.voucherService.useVoucher(this.currentVoucher).subscribe({
            next: (res) => {
                this.currentVoucher = res;
                this.tryPrintTicket();
            },
            error: (err) => {
                console.log(err);
            }
        })
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
