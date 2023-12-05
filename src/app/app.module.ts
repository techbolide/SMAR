import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { DatePipe } from '@angular/common';
import { AuthenticationInterceptor } from './interceptors/authentication/authentication.interceptor';
import { NgxAnimatedCounterModule } from '@bugsplat/ngx-animated-counter'

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        HttpClientModule,
        NgxAnimatedCounterModule
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        { provide: HTTP_INTERCEPTORS, useClass: AuthenticationInterceptor, multi: true },
        BluetoothSerial,
        DatePipe
    ],
    bootstrap: [AppComponent],
})
export class AppModule { }
