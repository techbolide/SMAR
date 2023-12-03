import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IProduct } from 'src/app/interfaces/product/IProduct';
import { environment } from 'src/environments/environment';

export const PRODUCTS_KEY = 'smar_products';


@Injectable({
    providedIn: 'root'
})
export class ProductService {
    public listApiLink: string = 'GetProducts';
    public registerProductApiLink: string = 'RegisterProduct';
    constructor(private http: HttpClient) { }

    getProducts() {
        return this.http.get<IProduct[]>(environment.apiUrl + this.listApiLink);
    }

    registerProduct(formData: FormData) {
        return this.http.post<IProduct>(environment.apiUrl + this.registerProductApiLink, formData);
    }
}
