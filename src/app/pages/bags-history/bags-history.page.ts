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

    getBagStateColor(state: number) {
        switch (state) {
            case 1: return 'dark';
            case 2: return 'warning';
            case 3: return 'success';
            case 4: return 'danger';
            default: return 'dark';
        }
    }

    getBagStateText(state: number) {
        switch (state) {
            case 1: return 'CREAT';
            case 2: return 'RIDICAT';
            case 3: return 'VALIDAT';
            case 4: return 'SUSPECT';
            default: return 'N/A';
        }
    }

}
