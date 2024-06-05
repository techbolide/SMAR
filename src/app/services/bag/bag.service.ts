import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IBag, IPickup, ISealBag } from 'src/app/interfaces/bag/IBag';
import { IPaginated } from 'src/app/interfaces/voucher/IVoucher';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BagService {
    public listApiLink: string = 'GetBags';
    public newListApiLink: string = 'GetNewBags';
    public sealApiLink: string = 'SealBag';
    public callPickupApiLink: string = 'CallPickup';
    constructor(private http: HttpClient) { }

    getBags(model: IPaginated) {
        return this.http.post<IBag[]>(environment.apiUrl + this.listApiLink, model);
    }

    callPickup(model: string[]) {
        return this.http.post<IPickup>(environment.apiUrl + this.callPickupApiLink, model);
    }

    getNewBags() {
        return this.http.get<IBag[]>(environment.apiUrl + this.newListApiLink);
    }

    sealBag(model: ISealBag) {
        return this.http.post<IBag>(environment.apiUrl + this.sealApiLink, model);
    }
}
