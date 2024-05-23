import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Dialog } from '@capacitor/dialog';
import { IUser } from 'src/app/interfaces/authentication/IUser';
import { IHomeOption } from 'src/app/interfaces/home/IHomeOption';
import { AuthenticationService, PROFILE_KEY } from 'src/app/services/authentication/authentication.service';
import { PRODUCTS_KEY, ProductService } from 'src/app/services/product/product.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

const INTERVAL_REFRESH = 180000;

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {
    public availableOptions: IHomeOption[] = [
        { name: "Home.Options.Pickup", icon: "car", router: '/packaging' },
        { name: "Home.Options.BagsHistory", icon: "cube", router: '/bag-history' },
        { name: "Home.Options.VoucherHistory", icon: "cash", router: '/voucher-history' },
        { name: "Home.Options.BagsSeal", icon: "pricetag", router: '/bags-seal' },
        { name: "Home.Options.Settings", icon: "cog", router: '/settings' },
    ]

    public currentUser: IUser | null = null;
    public isLogged: boolean = false;

    public currentRefreshInterval: NodeJS.Timeout | null = null;

    public loggedSubscription: Subscription | null = null;
    public userSubscription: Subscription | null = null;
    public productsSubscription: Subscription | null = null;

    constructor(private router: Router,
        private authService: AuthenticationService,
        private storageService: StorageService,
        private productService: ProductService,
        private cdr: ChangeDetectorRef,
        private translateService: TranslateService) {
        this.getUser();
    }

    ionViewDidEnter() {
        this.checkLogged();
        this.createRefreshInterval();
    }

    ionViewDidLeave() {
        this.isLogged = false;
        this.clearSubscriptions();
        this.clearRefreshInterval();
    }

    clearSubscriptions() {
        if(this.loggedSubscription) {
            this.loggedSubscription.unsubscribe();
            this.loggedSubscription = null;
        }
        if(this.userSubscription) {
            this.userSubscription.unsubscribe();
            this.userSubscription = null;
        }
        if(this.productsSubscription) {
            this.productsSubscription.unsubscribe();
            this.productsSubscription = null;
        }

    }

    createRefreshInterval() {
        if(this.currentRefreshInterval) return;

        this.currentRefreshInterval = setInterval(() => {
            this.isLogged = false;
            this.checkLogged();
        }, INTERVAL_REFRESH);
    }

    clearRefreshInterval() {
        if(!this.currentRefreshInterval) return;

        clearInterval(this.currentRefreshInterval);
        this.currentRefreshInterval = null;
    }

    checkLogged() {
        this.loggedSubscription = this.authService.isLogged().subscribe({
            next: (isLogged) => {
                if (isLogged && !this.isLogged) {
                    this.isLogged = true;
                    this.cdr.detectChanges();
                    this.authService.doAuth();
                }
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    goToRoute(route: string | null) {
        if(!route) return;

        if(route === '/bags-seal' && this.canScan()) {
            this.askSeal(route);
        } else {
            this.router.navigateByUrl(route, { replaceUrl: true });
        }
    }

    async askSeal(route: string) {
        const { value } = await Dialog.confirm({
            title: this.translateService.instant('BagsSeal.WarningQuantityDialog.Title'),
            message: this.translateService.instant('BagsSeal.WarningQuantityDialog.Subtitle'),
            okButtonTitle: this.translateService.instant('BagsSeal.WarningQuantityDialog.Confirm'),
            cancelButtonTitle: this.translateService.instant('BagsSeal.WarningQuantityDialog.Cancel'),
        });

        if (!value) return;

        this.router.navigateByUrl(route, { replaceUrl: true });
    }

    getUser() {
        this.userSubscription = this.authService.currentUser.subscribe({
            next: (res) => {
                if (res) {
                    this.currentUser = res;
                    this.getProducts();
                }
            },
            error: (err) => {
                console.log(err);
            }
        })


    }

    getProducts() {
        this.productsSubscription = this.productService.getProducts().subscribe({
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
