import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IVoucherItem, IVoucherItemType } from 'src/app/interfaces/voucher/IVoucher';
import { StorageService } from '../storage/storage.service';
import { PRODUCTS_KEY } from '../product/product.service';
import { IProduct } from 'src/app/interfaces/product/IProduct';

@Injectable({
    providedIn: 'root'
})
export class EanService {

    constructor(private http: HttpClient, private storageService: StorageService) { }

    async validateEAN(code: string) {
        let findItem = undefined;
        const itemsFromStorage = await this.storageService.getStorageKey(PRODUCTS_KEY);
        if(itemsFromStorage && itemsFromStorage.value) {
            const itemsParsed = JSON.parse(itemsFromStorage.value) as IProduct[];
            findItem = itemsParsed.find(x=> x.EanCode === code);
        }
        return findItem;
    }
}
