import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VoucherDetailsPageRoutingModule } from './voucher-details-routing.module';

import { VoucherDetailsPage } from './voucher-details.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        VoucherDetailsPageRoutingModule,
        TranslateModule
    ],
    declarations: [VoucherDetailsPage]
})
export class VoucherDetailsPageModule { }
