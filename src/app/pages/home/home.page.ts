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
        { name: "Ridicare ambalaje", icon: "car", primary: false },
        { name: "Gestiunea mea", icon: "cube", primary: false },
        { name: "Istoricul voucherelor", icon: "cash", primary: false },
        { name: "Închidere gestiune", icon: "pricetag", primary: false },
        { name: "Setări", icon: "cog", primary: false },
    ]
    constructor(private router: Router) { }

    goToScan() {
        this.router.navigateByUrl("/scan", { replaceUrl: true });
    }

}
