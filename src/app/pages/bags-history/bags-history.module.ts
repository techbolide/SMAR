import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BagsHistoryPageRoutingModule } from './bags-history-routing.module';

import { BagsHistoryPage } from './bags-history.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        BagsHistoryPageRoutingModule
    ],
    declarations: [BagsHistoryPage]
})
export class BagsHistoryPageModule { }
