import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IVoucherItem, IVoucherItemContentType, IVoucherItemType } from 'src/app/interfaces/scan/IVoucher';

@Injectable({
    providedIn: 'root'
})
export class EanService {

    constructor(private http: HttpClient) { }

    validateEAN(code: string) {
        const newItem: IVoucherItem = {
            type: IVoucherItemType.Plastic,
            name: IVoucherItemContentType.Apa_minerala,
            quantity: 500,
            readDate: new Date(),
            eanCode: code
        }
        return newItem;
    }
}
