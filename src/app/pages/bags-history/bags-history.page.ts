import { Component, OnInit } from '@angular/core';
import { IBag } from '../../interfaces/bag/IBag';
import { BagService } from 'src/app/services/bag/bag.service';
import { IPaginated } from 'src/app/interfaces/voucher/IVoucher';

@Component({
    selector: 'app-bags-history',
    templateUrl: './bags-history.page.html',
    styleUrls: ['./bags-history.page.scss'],
})
export class BagsHistoryPage {
    public bags: IBag[] | null = null;
    constructor(private bagService: BagService) { }

    ionViewDidEnter() {
        this.getBags();
    }

    ionViewDidLeave() {
        this.bags = null;
    }

    getBags() {
        const model: IPaginated = { from: 0, take: 20 }

        setTimeout(() => {
            this.bagService.getBags(model).subscribe({
                next: (res) => {
                    this.bags = [...res];
                },
                error: (err) => {
                    this.bags = [];
                }
            })
        }, 1000);
    }

    getFormattedType(category: number) {
        switch (category) {
            case 2: return 'can';
            case 3: return 'glass';
            default: return 'plastic-bottle';
        }
    }

    handleRefresh(event: any) {
        const model: IPaginated = { from: 0, take: 20 }
        this.bags = null;
        setTimeout(() => {
            this.bagService.getBags(model).subscribe({
                next: (res) => {
                    this.bags = [...res];
                    event.target.complete();
                },
                error: (err) => {
                    this.bags = [];
                    event.target.complete();
                }
            });
        }, 2000);
    }

    getBagStateColor(state: number) {
        switch (state) {
            case 1: return 'dark';
            case 2: return 'secondary';
            case 3: return 'warning';
            case 4: return 'success';
            case 5: return 'danger';
            default: return 'dark';
        }
    }

    getBagStateText(state: number) {
        switch (state) {
            case 1: return 'BagsHistory.Types.Created';
            case 2: return 'BagsHistory.Types.Requested';
            case 3: return 'BagsHistory.Types.Picked';
            case 4: return 'BagsHistory.Types.Validated';
            case 5: return 'BagsHistory.Types.Suspect';
            default: return 'N/A';
        }
    }

}
