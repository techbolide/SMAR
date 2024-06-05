import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { IUser } from 'src/app/interfaces/authentication/IUser';
import { ISealBag } from 'src/app/interfaces/bag/IBag';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BagService } from 'src/app/services/bag/bag.service';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
    selector: 'app-bags-seal',
    templateUrl: './bags-seal.page.html',
    styleUrls: ['./bags-seal.page.scss'],
})
export class BagsSealPage {
    public selectedCategory: string | null = null;

    public plasticQuantity: number = 0;
    public aluminiumQuantity: number = 0;
    public glassQuantity: number = 0;
    public loadingSeal: boolean = false;
    public userSubscription: Subscription | null = null;
    public currentUser: IUser | null = null;

    constructor(private bagService: BagService,
        private toastService: ToastService,
        private router: Router,
        private translateService: TranslateService,
        private authService: AuthenticationService) { }

    ionViewDidEnter() {
        this.getUser();
    }

    ionViewDidLeave() {
        this.clearSubscriptions();
    }

    clearSubscriptions() {
        if(this.userSubscription) {
            this.userSubscription.unsubscribe();
            this.userSubscription = null;
        }
    }

    resetForm() {
        this.plasticQuantity = 0;
        this.aluminiumQuantity = 0;
        this.glassQuantity = 0;
    }

    hasValidQuantity() {
        return this.plasticQuantity > 0 || this.aluminiumQuantity > 0 || this.glassQuantity > 0;
    }

    getUser() {
        this.userSubscription = this.authService.currentUser.subscribe({
            next: (res) => {
                if (res) this.currentUser = res;
            },
            error: (err) => {
                this.currentUser = null;
                console.log(err);
            }
        })
    }

    sealBag() {
        if(!this.hasValidQuantity || this.loadingSeal || !this.selectedCategory || !this.currentUser) return;


        const selectedCategory = parseInt(this.selectedCategory, 10);
        if((selectedCategory === 1 && this.plasticQuantity > this.currentUser.PlasticCount) || (selectedCategory === 2 && this.aluminiumQuantity > this.currentUser.AluminiumCount) || (selectedCategory === 3 && this.glassQuantity > this.currentUser.GlassCount))
        {
            this.toastService.showToast(this.translateService.instant('Toast.SealNotEnoughQuantity'), 2000, 'danger', 'bottom');
            return;
        }

        this.loadingSeal = true;
        const model: ISealBag = {
            Id: -1,
            SealCode: '571312312',
            PlasticCount: this.plasticQuantity,
            AluminiumCount: this.aluminiumQuantity,
            GlassCount: this.glassQuantity,
            ProductCategoryId: selectedCategory
        }

        setTimeout(() => {

            this.bagService.sealBag(model).subscribe({
                next: (res) => {
                    this.toastService.showToast(this.translateService.instant('Toast.BagSealed'), 2000, 'success', 'bottom');
                    this.resetForm();

                    setTimeout(() => {
                        this.router.navigateByUrl('/bag-history', { replaceUrl: true });
                        this.loadingSeal = false;
                    }, 500);
                },
                error: (err) => {
                    console.log(err);
                    this.loadingSeal = false;
                }
            });
        }, 750);

    }

}
