import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { IVoucherActive, IVoucherGetByScan, IVoucherGetHistory, IVoucherInitialize, IVoucherReceived } from 'src/app/interfaces/scan/IVoucher';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class VoucherService {
    public initializeApiLink: string = 'InitializeVoucher';
    public activateApiLink: string = 'ActivateVoucher';
    public listApiLink: string = 'GetVouchers';
    public getByScanApiLink: string = 'GetByScan';
    public useApiLink: string = 'UseVoucher';
    constructor(private http: HttpClient) { }

    initializeVoucher() {
        return this.http.get<IVoucherReceived>(environment.apiUrl + this.initializeApiLink);
    }

    activateVoucher(model: IVoucherActive) {
        return this.http.post<IVoucherReceived>(environment.apiUrl + this.activateApiLink, model);
    }

    getVouchers(model: IVoucherGetHistory) {
        return this.http.post<IVoucherReceived[]>(environment.apiUrl + this.listApiLink, model);
    }

    getByScan(model: IVoucherGetByScan) {
        return this.http.post<IVoucherReceived>(environment.apiUrl + this.getByScanApiLink, model);
    }

    useVoucher(model: IVoucherReceived) {
        return this.http.post<IVoucherReceived>(environment.apiUrl + this.useApiLink, model);
    }
}
