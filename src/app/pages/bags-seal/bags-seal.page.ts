import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ISealBag } from 'src/app/interfaces/bag/IBag';
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
    constructor(private bagService: BagService, private toastService: ToastService, private router: Router) { }

    resetForm() {
        this.plasticQuantity = 0;
        this.aluminiumQuantity = 0;
        this.glassQuantity = 0;
    }

    hasValidQuantity() {
        return this.plasticQuantity > 0 || this.aluminiumQuantity > 0 || this.glassQuantity > 0;
    }

    sealBag() {
        if(!this.hasValidQuantity || this.loadingSeal || !this.selectedCategory) return;

        this.loadingSeal = true;
        const model: ISealBag = {
            Id: -1,
            SealCode: '571312312',
            PlasticCount: this.plasticQuantity,
            AluminiumCount: this.aluminiumQuantity,
            GlassCount: this.glassQuantity,
            ProductCategoryId: parseInt(this.selectedCategory, 10)
        }

        setTimeout(() => {

            this.bagService.sealBag(model).subscribe({
                next: (res) => {
                    this.toastService.showToast("Sacul a fost sigilat cu succes!", 2000, 'success', 'bottom');
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
