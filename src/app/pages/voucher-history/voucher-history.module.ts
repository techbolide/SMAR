import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VoucherHistoryPageRoutingModule } from './voucher-history-routing.module';

import { VoucherHistoryPage } from './voucher-history.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        VoucherHistoryPageRoutingModule,
        TranslateModule
    ],
    declarations: [VoucherHistoryPage]
})
export class VoucherHistoryPageModule { }
