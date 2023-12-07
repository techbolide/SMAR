import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IBag, ISealBag } from 'src/app/interfaces/bag/IBag';
import { IPaginated } from 'src/app/interfaces/voucher/IVoucher';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BagService {
    public listApiLink: string = 'GetBags';
    public sealApiLink: string = 'SealBag';
    constructor(private http: HttpClient) { }

    getBags(model: IPaginated) {
        return this.http.post<IBag[]>(environment.apiUrl + this.listApiLink, model);
    }

    sealBag(model: ISealBag) {
        return this.http.post<IBag>(environment.apiUrl + this.sealApiLink, model);
    }
}
