import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PackagingPageRoutingModule } from './packaging-routing.module';

import { PackagingPage } from './packaging.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PackagingPageRoutingModule,
        TranslateModule
    ],
    declarations: [PackagingPage]
})
export class PackagingPageModule { }
