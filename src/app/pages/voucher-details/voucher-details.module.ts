import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VoucherDetailsPageRoutingModule } from './voucher-details-routing.module';

import { VoucherDetailsPage } from './voucher-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VoucherDetailsPageRoutingModule
  ],
  declarations: [VoucherDetailsPage]
})
export class VoucherDetailsPageModule {}
