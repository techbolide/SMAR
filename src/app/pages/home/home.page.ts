import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
        { name: "Istoric saci", icon: "cube", router: null },
        { name: "Istoric vouchere", icon: "cash", router: '/voucher-history' },
        { name: "Sigilare saci", icon: "pricetag", router: null },
        { name: "Setări", icon: "cog", router: null},
    ]

    public currentUser: IUser | null = null;
    constructor(private router: Router, private authService: AuthenticationService, private storageService: StorageService, private productService: ProductService) {
        this.checkLogged();
    }

    checkLogged() {
        this.authService.isLogged().subscribe({
            next: (isLogged) => {
                if(isLogged)
                    this.getUser();
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    async getUser() {
        const profileData = await this.storageService.getStorageKey(PROFILE_KEY);
        if(profileData && profileData.value !== null) {
            const profileDataParsed = JSON.parse(profileData.value) as IUser;
            this.currentUser = profileDataParsed;

            if(this.currentUser) {
                this.getProducts();
            }
        }
    }

    getProducts() {
        console.log("GETTING PRODUCTS FROM SERVER....");
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
        if(!this.currentUser) return 'black';

        if(type === 'plastic') {
            if(this.currentUser.PlasticCount === this.currentUser.PlasticThreshold) return 'orange';
            else if(this.currentUser.PlasticCount > this.currentUser.PlasticThreshold) return 'red';
        } else if(type === 'can') {
            if(this.currentUser.AluminiumCount === this.currentUser.AluminiumThreshold) return 'orange';
            else if(this.currentUser.AluminiumCount > this.currentUser.AluminiumThreshold) return 'red';
        } else if(type === 'glass') {
            if(this.currentUser.GlassCount === this.currentUser.GlassThreshold) return 'orange';
            else if(this.currentUser.GlassCount > this.currentUser.GlassThreshold) return 'red';
        }

        return 'black';
    }

    canScan() {
        if(!this.currentUser) return false;

        return this.currentUser.PlasticCount < this.currentUser.PlasticThreshold && this.currentUser.AluminiumCount < this.currentUser.AluminiumThreshold && this.currentUser.GlassCount < this.currentUser.GlassThreshold;
    }

    logout() {
        this.authService.logout();
    }

    getFormattedEmployeeName(employeeName: string) {
        const employeeNameSplitted = employeeName.split(' ');

        if(employeeNameSplitted.length > 1) {
            const firstName = employeeNameSplitted[0];
            const lastName = employeeNameSplitted[1].charAt(0).toLocaleUpperCase();

            return firstName + ' ' + lastName + '.';
        }

        return employeeName;
    }

}
