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
        { name: "Ridicare ambalaje", icon: "car", router: null },
        { name: "Istoric saci", icon: "cube", router: null },
        { name: "Istoric vouchere", icon: "cash", router: '/voucher-history' },
        { name: "Sigilare saci", icon: "pricetag", router: null },
        { name: "Setări", icon: "cog", router: null},
    ]

    public maximumThresholdForPlastic = 80;
    public maximumThresholdForCan = 250;
    public maximumThresholdForGlass = 100;

    public currentThresholdForPlastic = 52;
    public currentThresholdForCan = 249;
    public currentThresholdForGlass = 99;
    constructor(private router: Router) { }

    goToScan() {
        this.router.navigateByUrl("/scan", { replaceUrl: true });
    }

    getColorForThreshold(type: string) {
        if(type === 'plastic') {
            if(this.currentThresholdForPlastic === this.maximumThresholdForPlastic) return 'orange';
            else if(this.currentThresholdForPlastic > this.maximumThresholdForPlastic) return 'red';
        } else if(type === 'can') {
            if(this.currentThresholdForCan === this.maximumThresholdForCan) return 'orange';
            else if(this.currentThresholdForCan > this.maximumThresholdForCan) return 'red';
        } else if(type === 'glass') {
            if(this.currentThresholdForGlass === this.maximumThresholdForGlass) return 'orange';
            else if(this.currentThresholdForGlass > this.maximumThresholdForGlass) return 'red';
        }

        return 'black';
    }

    canScan() {
        return this.currentThresholdForPlastic < this.maximumThresholdForPlastic && this.currentThresholdForCan < this.maximumThresholdForCan && this.currentThresholdForGlass < this.maximumThresholdForGlass;
    }

}
