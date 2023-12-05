import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { NgxAnimatedCounterModule } from '@bugsplat/ngx-animated-counter';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        HomePageRoutingModule,
        NgxAnimatedCounterModule
    ],
    declarations: [HomePage]
})
export class HomePageModule { }
