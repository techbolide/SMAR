import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IBag } from 'src/app/interfaces/bag/IBag';
import { BagService } from 'src/app/services/bag/bag.service';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
    selector: 'app-packaging',
    templateUrl: './packaging.page.html',
    styleUrls: ['./packaging.page.scss'],
})
export class PackagingPage {
    public bags: IBag[] | null = null;
    public selectedBagsCodes: string[] = [];
    public loadingCall: boolean = false;

    constructor(private bagService: BagService,
        private translateService: TranslateService,
        private toastService: ToastService,
        private cdr: ChangeDetectorRef
    ) { }

    ionViewDidEnter() {
        this.getBags();
    }

    ionViewDidLeave() {
        this.bags = null;
    }

    getBags() {
        this.bags = null;
        setTimeout(() => {
            this.bagService.getNewBags().subscribe({
                next: (res) => {
                    this.bags = [...res];
                    this.loadingCall = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.bags = [];
                    this.loadingCall = false;
                    this.cdr.detectChanges();
                }
            })
        }, 1000);
    }

    selectBag(code: string) {
        if(this.loadingCall) return;

        const findCode = this.selectedBagsCodes.find(x=> x === code);
        if(!findCode) {
            this.selectedBagsCodes.push(code);
            return;
        }

        this.selectedBagsCodes = this.selectedBagsCodes.filter(x=> x !== findCode);
    }

    getFormattedType(category: number) {
        switch (category) {
            case 2: return 'can';
            case 3: return 'glass';
            default: return 'plastic-bottle';
        }
    }

    callPickup() {
        if(this.loadingCall) return;

        if(this.selectedBagsCodes.length < 3) {
            this.toastService.showToast(this.translateService.instant('Packaging.Minimum'), 2000, 'danger', 'bottom');
            return;
        }

        this.loadingCall = true;
        setTimeout(() => {

            this.bagService.callPickup(this.selectedBagsCodes).subscribe({
                next: (res) => {
                    this.toastService.showToast(this.translateService.instant('Packaging.Success'), 2000, 'success', 'bottom');
                    setTimeout(() => { this.getBags(); }, 250);
                },
                error: (err) => {
                    console.log(err);
                    this.loadingCall = false;
                    this.cdr.detectChanges();
                }
            });
        }, 750);
    }

    codeInArray(code: string) {
        const findCode = this.selectedBagsCodes.find(x=> x === code);
        return findCode !== null && findCode !== undefined;
    }
}
