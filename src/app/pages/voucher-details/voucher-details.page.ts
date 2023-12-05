import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import EscPosEncoder from '@mineminemine/esc-pos-encoder-ionic';
import { DEBUG_STORAGE, IDebugStorage } from 'src/app/app.component';
import { IUser } from 'src/app/interfaces/authentication/IUser';
import { IVoucherActive, IVoucherGetByScan, IVoucherQR, IVoucherReceived } from 'src/app/interfaces/voucher/IVoucher';
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
    public currentVoucher: IVoucherReceived | null = null;
    public processPrinting: boolean = false;
    constructor(private route: ActivatedRoute,
        private voucherService: VoucherService,
        private storageService: StorageService,
        private toastService: ToastService,
        private blePrinterService: BlePrinterService) { }

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

    reprint() {
        if(!this.currentVoucher || this.processPrinting) return;

        this.processPrinting = true;
        setTimeout(() => {
            if(this.currentVoucher!.State === 1) this.tryPrint();
            else this.tryPrintTicket();
        }, 750);
    }

    async tryPrintTicket() {
        if(!this.currentVoucher) return;

        const formatTicket = await this.voucherService.formatTicket(this.currentVoucher);
        try {
            await this.blePrinterService.print(formatTicket);
            this.toastService.showToast("Bon reprintat cu succes!", 2000, 'success', 'bottom');
        } catch {
            this.toastService.showToast("A intervenit o eroare în legătura cu printerul, încercați mai tarziu!", 2000, 'danger', 'bottom');
        }
        this.processPrinting = false;
    }

    async tryPrint() {
        if(!this.currentVoucher) return;

        const formatVoucher = await this.voucherService.formatVoucher(this.currentVoucher);
        try {
            await this.blePrinterService.print(formatVoucher);
            this.toastService.showToast("Voucher reprintat cu succes!", 2000, 'success', 'bottom');
        } catch {
            this.toastService.showToast("A intervenit o eroare în legătura cu printerul, încercați mai tarziu!", 2000, 'danger', 'bottom');
        }
        this.processPrinting = false;

    }

    useVoucher() {
        if(!this.currentVoucher) return;

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
}
