import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BagsSealPageRoutingModule } from './bags-seal-routing.module';

import { BagsSealPage } from './bags-seal.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        BagsSealPageRoutingModule
    ],
    declarations: [BagsSealPage]
})
export class BagsSealPageModule { }
