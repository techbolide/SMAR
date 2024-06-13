import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import EscPosEncoder from '@mineminemine/esc-pos-encoder-ionic';
import { Subscription, catchError } from 'rxjs';
import { IDebugStorage } from 'src/app/app.component';
import { IUser } from 'src/app/interfaces/authentication/IUser';
import { IVoucherActive, IVoucherGetByScan, IPaginated, IVoucherInitialize, IVoucherReceived, IVoucherQR, IVoucher, IVoucherReceivedByScan } from 'src/app/interfaces/voucher/IVoucher';
import { environment } from 'src/environments/environment';
import { StorageService } from '../storage/storage.service';

@Injectable({
    providedIn: 'root'
})
export class VoucherService {
    public initializeApiLink: string = 'InitializeVoucher';
    public activateApiLink: string = 'ActivateVoucher';
    public listApiLink: string = 'GetVouchers';
    public getByScanApiLink: string = 'GetByScan';
    public useApiLink: string = 'UseVoucher';

    public bluetoothConection: Subscription | null = null;

    constructor(private http: HttpClient, private storageService: StorageService) { }

    initializeVoucher() {
        return this.http.get<IVoucherReceived>(environment.apiUrl + this.initializeApiLink);
    }

    activateVoucher(model: IVoucherActive) {
        return this.http.post<IVoucherReceived>(environment.apiUrl + this.activateApiLink, model);
    }

    getVouchers(model: IPaginated) {
        return this.http.post<IVoucherReceived[]>(environment.apiUrl + this.listApiLink, model);
    }

    getByScan(model: IVoucherGetByScan) {
        return this.http.post<IVoucherReceivedByScan>(environment.apiUrl + this.getByScanApiLink, model);
    }

    useVoucher(model: IVoucherReceivedByScan) {
        return this.http.post<IVoucherReceivedByScan>(environment.apiUrl + this.useApiLink, model);
    }

    async formatVoucher(voucher: IVoucherReceived | IVoucherReceivedByScan) {
        const storageDataParsed = await this.storageService.getDebugStorage();
        const profileDataParsed = await this.storageService.getProfileStorage();
        if (!storageDataParsed || !profileDataParsed)
            throw("Missing storage asset");


        const encoder = new EscPosEncoder();
        const qrCodeInfo: IVoucherQR = {
            code: voucher.Code,
            date: voucher.GeneratedDate.substring(0, 10),
            hour: voucher.GeneratedTime.substring(0, 8),
            expire: voucher.ExpirationDate.substring(0, 10),
            employeeCode: profileDataParsed.EmployeeCode,
            officeCode: profileDataParsed.OfficeCode,
            value: voucher.Value,
            plasticCount: voucher.PlasticCount,
            aluminiumCount: voucher.AluminiumCount,
            glassCount: voucher.GlassCount
        }

        const resultPrint = encoder.
            initialize()
            .align('center')
            .line(storageDataParsed.Header)
            .line(storageDataParsed.Subheader)
            .newline()
            .align('left')
            .line(`Kod: ${qrCodeInfo.code}`)
            .line(`Operator: ${qrCodeInfo.employeeCode}`)
            .table(
                [
                    { width: 16, align: 'left' },
                    { width: 16, align: 'right' }
                ],
                [
                    [`Data: ${voucher.GeneratedDate.substring(0, 10)}`, `Godz.: ${voucher.GeneratedTime.substring(0, 8)}`],
                    ['', ''],
                    ['Plastik', `x${voucher.PlasticCount}`],
                    ['Aluminiowy', `x${voucher.AluminiumCount}`],
                    ['Szkło', `x${voucher.GlassCount}`],
                ]
            )
            .align('center')
            .bold(true)
            .line(`PLN ${voucher.Value.toFixed(2)}`)
            .bold(false)
            .newline()
            .line(`Wygasa dnia: ${voucher.ExpirationDate.substring(0, 10)}`)
            .qrcode(JSON.stringify(qrCodeInfo))
            .encode();


        return resultPrint;
    }

    async formatTicket(voucher: IVoucherReceived | IVoucherReceivedByScan) {
        const storageDataParsed = await this.storageService.getDebugStorage();
        const profileDataParsed = await this.storageService.getProfileStorage();
        if (!storageDataParsed || !profileDataParsed)
            throw("Missing storage asset");


        const encoder = new EscPosEncoder();

        const qrCodeInfo: IVoucherQR = {
            code: voucher.Code,
            date: voucher.GeneratedDate.substring(0, 10),
            hour: voucher.GeneratedTime.substring(0, 8),
            expire: voucher.ExpirationDate.substring(0, 10),
            employeeCode: profileDataParsed.EmployeeCode,
            officeCode: profileDataParsed.OfficeCode,
            value: voucher.Value,
            plasticCount: voucher.PlasticCount,
            aluminiumCount: voucher.AluminiumCount,
            glassCount: voucher.GlassCount
        }

        const resultPrint = encoder.
            initialize()
            .align('center')
            .line(storageDataParsed.Header)
            .line(storageDataParsed.Subheader)
            .newline()
            .align('left')
            .line(`Kod: ${qrCodeInfo.code}`)
            .line(`Operator: ${qrCodeInfo.employeeCode}`)
            .table(
                [
                    { width: 16, align: 'left' },
                    { width: 16, align: 'right' }
                ],
                [
                    [`Data: ${qrCodeInfo.date}`, `Godz.: ${qrCodeInfo.hour}`],
                    ['', ''],
                    ['Plastik', `x${qrCodeInfo.plasticCount}`],
                    ['Aluminiowy', `x${qrCodeInfo.aluminiumCount}`],
                    ['Szkło', `x${qrCodeInfo.glassCount}`],
                ]
            )
            .align('center')
            .bold(true)
            .line(`PLN ${qrCodeInfo.value.toFixed(2)}`)
            .bold(false)
            .encode();


        return resultPrint;
    }
}
