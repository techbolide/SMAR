import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PackagingPageRoutingModule } from './packaging-routing.module';

import { PackagingPage } from './packaging.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PackagingPageRoutingModule
    ],
    declarations: [PackagingPage]
})
export class PackagingPageModule { }
