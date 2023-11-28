import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IHomeOption } from 'src/app/interfaces/home/IHomeOption';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {
    public availableOptions: IHomeOption[] = [
        { name: "Ridicare ambalaje", icon: "car", primary: false, router: null },
        { name: "Istoric saci", icon: "cube", primary: false, router: null },
        { name: "Istoric vouchere", icon: "cash", primary: false, router: '/voucher-history' },
        { name: "Sigilare saci", icon: "pricetag", primary: false, router: null },
        { name: "Setări", icon: "cog", primary: false, router: null},
    ]
    constructor(private router: Router) { }

    goToScan() {
        this.router.navigateByUrl("/scan", { replaceUrl: true });
    }

}
