import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BagsHistoryPageRoutingModule } from './bags-history-routing.module';

import { BagsHistoryPage } from './bags-history.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        BagsHistoryPageRoutingModule,
        TranslateModule
    ],
    declarations: [BagsHistoryPage]
})
export class BagsHistoryPageModule { }
