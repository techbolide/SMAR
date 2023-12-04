import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import EscPosEncoder from '@mineminemine/esc-pos-encoder-ionic';
import { DEBUG_STORAGE, IDebugStorage } from 'src/app/app.component';
import { IUser } from 'src/app/interfaces/authentication/IUser';
import { IVoucherActive, IVoucherGetByScan, IVoucherQR, IVoucherReceived } from 'src/app/interfaces/scan/IVoucher';
import { PROFILE_KEY } from 'src/app/services/authentication/authentication.service';
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
        private bluetoothSerial: BluetoothSerial,
        private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.getParams();
    }

    getParams() {
        this.route.params.subscribe((params) => {
            this.getVoucher(params['id']);
        });
    }

    async getProfileData() {
        const profileData = await this.storageService.getStorageKey(PROFILE_KEY);
        if (profileData && profileData.value !== null) {
            const profileDataParsed = JSON.parse(profileData.value) as IUser;
            return profileDataParsed;
        }

        return null;
    }

    async getVoucher(code: string) {
        const profileDataParsed = await this.getProfileData();
        if (!profileDataParsed) return;

        const sentModel: IVoucherGetByScan = {
            Code: code,
            EmployeeCode: profileDataParsed.EmployeeCode,
            OfficeCode: profileDataParsed.OfficeCode
        }

        this.voucherService.getByScan(sentModel).subscribe({
            next: (res) => {
                this.currentVoucher = res;
                console.log(res);
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    async getStorageData() {
        const storageData = await this.storageService.getStorageKey(DEBUG_STORAGE);
        if(storageData && storageData.value !== null) {
            const storageDataParsed = JSON.parse(storageData.value) as IDebugStorage;
            return storageDataParsed;
        }

        return null;
    }

    reprint() {
        if(!this.currentVoucher || this.processPrinting) return;

        this.processPrinting = true;
        setTimeout(() => {
            if(this.currentVoucher!.State === 1) this.tryPrint();
            else this.tryPrintTicket();
        }, 750);
    }

    async tryPrint() {
        const storageDataParsed = await this.getStorageData();
        const profileDataParsed = await this.getProfileData();
        if (!storageDataParsed || !profileDataParsed) {
            this.processPrinting = false;
            this.toastService.showToast("Nu puteți printa acest bon deoarece a intervenit o eroare!", 2000, 'danger', 'bottom');
            return;
        }

        this.bluetoothSerial.connect(storageDataParsed.PrinterIdentifier).subscribe({
            next: async (res) => {
                if(!this.currentVoucher) {
                    this.processPrinting = false;
                    return;
                }

                const encoder = new EscPosEncoder();

                const qrCodeInfo: IVoucherQR = {
                    code: this.currentVoucher.Code,
                    date: this.currentVoucher.GeneratedDate.substring(0, 10),
                    hour: this.currentVoucher.GeneratedTime.substring(0, 8),
                    expire: this.currentVoucher.ExpirationDate.substring(0, 10),
                    employeeCode: profileDataParsed.EmployeeCode,
                    officeCode: profileDataParsed.OfficeCode,
                    value: this.currentVoucher.Value,
                    plasticCount: this.currentVoucher.PlasticCount,
                    aluminiumCount: this.currentVoucher.AluminiumCount,
                    glassCount: this.currentVoucher.GlassCount
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
                            [ `Data: ${qrCodeInfo.date}`, `Ora: ${qrCodeInfo.hour}` ],
                            [ '', '' ],
                            [ 'Plastic', `x${qrCodeInfo.plasticCount}` ],
                            [ 'Aluminiu', `x${qrCodeInfo.aluminiumCount}` ],
                            [ 'Sticla', `x${qrCodeInfo.glassCount}` ],
                        ]
                    )
                    .align('center')
                    .bold(true)
                    .line(`LEI ${qrCodeInfo.value.toFixed(2)}`)
                    .bold(false)
                    .line(`Expira la: ${qrCodeInfo.expire}`)
                    .qrcode(JSON.stringify(qrCodeInfo))
                    .encode();

                await this.bluetoothSerial.write(resultPrint);
                this.toastService.showToast("Bon reprintat cu succes!", 2000, 'success', 'bottom');
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

    async tryPrintTicket() {
        const storageDataParsed = await this.getStorageData();
        const profileDataParsed = await this.getProfileData();
        if (!storageDataParsed || !profileDataParsed) {
            this.processPrinting = false;
            this.toastService.showToast("Nu puteți printa acest bon deoarece a intervenit o eroare!", 2000, 'danger', 'bottom');
            return;
        }

        this.bluetoothSerial.connect(storageDataParsed.PrinterIdentifier).subscribe({
            next: async (res) => {
                if(!this.currentVoucher) {
                    this.processPrinting = false;
                    return;
                }

                const encoder = new EscPosEncoder();

                const qrCodeInfo: IVoucherQR = {
                    code: this.currentVoucher.Code,
                    date: this.currentVoucher.GeneratedDate.substring(0, 10),
                    hour: this.currentVoucher.GeneratedTime.substring(0, 8),
                    expire: this.currentVoucher.ExpirationDate.substring(0, 10),
                    employeeCode: profileDataParsed.EmployeeCode,
                    officeCode: profileDataParsed.OfficeCode,
                    value: this.currentVoucher.Value,
                    plasticCount: this.currentVoucher.PlasticCount,
                    aluminiumCount: this.currentVoucher.AluminiumCount,
                    glassCount: this.currentVoucher.GlassCount
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
                            [ `Data: ${qrCodeInfo.date}`, `Ora: ${qrCodeInfo.hour}` ],
                            [ '', '' ],
                            [ 'Plastic', `x${qrCodeInfo.plasticCount}` ],
                            [ 'Aluminiu', `x${qrCodeInfo.aluminiumCount}` ],
                            [ 'Sticla', `x${qrCodeInfo.glassCount}` ],
                        ]
                    )
                    .align('center')
                    .bold(true)
                    .line(`LEI ${qrCodeInfo.value.toFixed(2)}`)
                    .bold(false)
                    .encode();

                await this.bluetoothSerial.write(resultPrint);
                this.toastService.showToast("Bon reprintat cu succes!", 2000, 'success', 'bottom');
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
}
