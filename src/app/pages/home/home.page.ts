import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgxAnimatedCounterParams } from '@bugsplat/ngx-animated-counter';
import { IUser } from 'src/app/interfaces/authentication/IUser';
import { IHomeOption } from 'src/app/interfaces/home/IHomeOption';
import { AuthenticationService, PROFILE_KEY } from 'src/app/services/authentication/authentication.service';
import { PRODUCTS_KEY, ProductService } from 'src/app/services/product/product.service';
import { StorageService } from 'src/app/services/storage/storage.service';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {
    public availableOptions: IHomeOption[] = [
        { name: "Ridicare ambalaje", icon: "car", router: null },
        { name: "Istoric saci", icon: "cube", router: '/bag-history' },
        { name: "Istoric vouchere", icon: "cash", router: '/voucher-history' },
        { name: "Sigilare saci", icon: "pricetag", router: null },
        { name: "Setări", icon: "cog", router: null },
    ]

    public currentUser: IUser | null = null;
    public isLogged: boolean = false;
    public paramsForPlastic: NgxAnimatedCounterParams = { start: 0, end: 0, interval: 30, increment: 1 };
    public paramsForAluminium: NgxAnimatedCounterParams = { start: 0, end: 0, interval: 30, increment: 1 };
    public paramsForGlass: NgxAnimatedCounterParams = { start: 0, end: 0, interval: 30, increment: 1 };

    public oldValueForPlastic: number = 0;

    constructor(private router: Router, private authService: AuthenticationService, private storageService: StorageService, private productService: ProductService) {
        this.getUser();
    }

    ionViewDidEnter() {
        this.checkLogged();
    }

    ionViewDidLeave() {
        this.isLogged = false;
    }

    checkLogged() {
        this.authService.isLogged().subscribe({
            next: (isLogged) => {
                if (isLogged && !this.isLogged) {
                    this.isLogged = true;
                    this.authService.doAuth();
                }
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    getUser() {
        this.authService.currentUser.subscribe({
            next: (res) => {
                if (res) {
                    this.currentUser = res;
                    this.oldValueForPlastic = this.currentUser.PlasticCount;
                    this.calculateParams();
                    this.getProducts();
                }
            },
            error: (err) => {
                console.log(err);
            }
        })


    }

    calculateParams() {
        if(!this.currentUser) return;

        this.paramsForPlastic.end = this.currentUser.PlasticCount;
        if(this.paramsForPlastic.end < 20) this.paramsForPlastic.interval = 60;
        else if(this.paramsForPlastic.end < 40) this.paramsForPlastic.interval = 40;
        else if(this.paramsForPlastic.end < 60) this.paramsForPlastic.interval = 30;
        else this.paramsForPlastic.interval = 20;


        this.paramsForAluminium.end = this.currentUser.AluminiumCount;
        if(this.paramsForAluminium.end < 20) this.paramsForAluminium.interval = 60;
        else if(this.paramsForAluminium.end < 40) this.paramsForAluminium.interval = 40;
        else if(this.paramsForAluminium.end < 60) this.paramsForAluminium.interval = 30;
        else this.paramsForAluminium.interval = 20;

        this.paramsForGlass.end = this.currentUser.GlassCount;
        if(this.paramsForGlass.end < 20) this.paramsForGlass.interval = 60;
        else if(this.paramsForGlass.end < 40) this.paramsForGlass.interval = 40;
        else if(this.paramsForGlass.end < 60) this.paramsForGlass.interval = 30;
        else this.paramsForGlass.interval = 20;
    }

    getProducts() {
        this.productService.getProducts().subscribe({
            next: (items) => {
                this.storageService.setStorageKey(PRODUCTS_KEY, JSON.stringify(items));
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    goToScan() {
        this.router.navigateByUrl("/scan", { replaceUrl: true });
    }

    getColorForThreshold(type: string) {
        if (!this.currentUser) return 'black';

        if (type === 'plastic') {
            if (this.currentUser.PlasticCount === this.currentUser.PlasticThreshold) return 'orange';
            else if (this.currentUser.PlasticCount > this.currentUser.PlasticThreshold) return 'red';
        } else if (type === 'can') {
            if (this.currentUser.AluminiumCount === this.currentUser.AluminiumThreshold) return 'orange';
            else if (this.currentUser.AluminiumCount > this.currentUser.AluminiumThreshold) return 'red';
        } else if (type === 'glass') {
            if (this.currentUser.GlassCount === this.currentUser.GlassThreshold) return 'orange';
            else if (this.currentUser.GlassCount > this.currentUser.GlassThreshold) return 'red';
        }

        return 'black';
    }

    canScan() {
        if (!this.currentUser) return false;

        return this.currentUser.PlasticCount < this.currentUser.PlasticThreshold && this.currentUser.AluminiumCount < this.currentUser.AluminiumThreshold && this.currentUser.GlassCount < this.currentUser.GlassThreshold;
    }

    logout() {
        this.authService.logout();
    }

    getFormattedEmployeeName(employeeName: string) {
        const employeeNameSplitted = employeeName.split(' ');

        if (employeeNameSplitted.length > 1) {
            const firstName = employeeNameSplitted[0];
            const lastName = employeeNameSplitted[1].charAt(0).toLocaleUpperCase();

            return firstName + ' ' + lastName + '.';
        }

        return employeeName;
    }

}
