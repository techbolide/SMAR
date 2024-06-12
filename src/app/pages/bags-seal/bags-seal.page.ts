import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Dialog } from '@capacitor/dialog';
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
    public sealCode: string | null = null;
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

    async sealBag() {
        if(!this.hasValidQuantity || this.loadingSeal || !this.selectedCategory || !this.currentUser || !this.sealCode) return;

        const selectedCategory = parseInt(this.selectedCategory, 10);
        const quantity = selectedCategory === 1 ? this.plasticQuantity : (selectedCategory === 2 ? this.aluminiumQuantity : this.glassQuantity);

        const { value } = await Dialog.confirm({
            title: this.translateService.instant('BagsSeal.ConfirmSealingDialog.Title'),
            message: this.translateService.instant('BagsSeal.ConfirmSealingDialog.Subtitle', { sealCode: this.sealCode, quantity: quantity, material: this.getCategoryNameByType(selectedCategory) }),
            okButtonTitle: this.translateService.instant('BagsSeal.ConfirmSealingDialog.Confirm'),
            cancelButtonTitle: this.translateService.instant('BagsSeal.ConfirmSealingDialog.Cancel'),
        });

        if (!value) return;

        if((selectedCategory === 1 && this.plasticQuantity > this.currentUser.PlasticCount) || (selectedCategory === 2 && this.aluminiumQuantity > this.currentUser.AluminiumCount) || (selectedCategory === 3 && this.glassQuantity > this.currentUser.GlassCount))
        {
            this.toastService.showToast(this.translateService.instant('Toast.SealNotEnoughQuantity'), 2000, 'danger', 'bottom');
            return;
        }

        this.loadingSeal = true;
        const model: ISealBag = {
            Id: -1,
            SealCode: this.sealCode,
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

    async tryScanBarCode() {
        if(!this.hasValidQuantity || this.loadingSeal || !this.selectedCategory || !this.currentUser) return;

        const granted = await this.requestPermissions();
        if (!granted) {
            this.toastService.showToast(this.translateService.instant('Toast.CameraPermission'), 2000, 'danger', 'bottom');
            return;
        }

        const moduleInstalled = await this.isGoogleBarcodeScannerModuleAvailable();
        if (!moduleInstalled) {
            this.addGoogleModuleListener();
            console.log("[SCANNER] Module not installed, installing...");
            await BarcodeScanner.installGoogleBarcodeScannerModule();
        } else {
            this.scanBarCode();
        }
    }

    getCategoryNameByType(type: number) {
        switch(type) {
            case 1: return this.translateService.instant('Home.Plastic');
            case 2: return this.translateService.instant('Home.Aluminium');
            case 3: return this.translateService.instant('Home.Glass');
            default: return 'N/A';
        }
    }

    async requestPermissions() {
        const { camera } = await BarcodeScanner.requestPermissions();
        return camera === 'granted' || camera === 'limited';
    }

    async isGoogleBarcodeScannerModuleAvailable() {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        return available;
    }

    addGoogleModuleListener() {
        BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', (event: any) => {
            const { status, progress } = event;
            if (status === 'done') {
                console.log('[SCANNER] Module installation completed');
                this.scanBarCode();
            } else if (status === 'error') {
                console.error('[SCANNER] Module installation error:', event.error);
            }
        });
    }

    async scanBarCode() {
        const { barcodes } = await BarcodeScanner.scan();
        barcodes.forEach(barcode => {
            this.scanSingleBarCode(barcode);
        });
    }


    async scanSingleBarCode(barcode: Barcode) {
        if(!this.hasValidQuantity || this.loadingSeal || !this.selectedCategory || !this.currentUser) return;

        this.sealCode = barcode.displayValue;
        this.toastService.showToast(this.translateService.instant('Toast.CodeScanned'), 2000, 'success', 'bottom');
    }

}
