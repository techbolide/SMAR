/* eslint-disable curly */
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';

@Injectable({
    providedIn: 'root'
})
export class StatusBarService {

    constructor() { }

    async setDefaultStatusBar() {
        const isWeb = Capacitor.getPlatform() === 'web';
        if (isWeb) return;

        const isAndroid = Capacitor.getPlatform() === 'android';
        const navigationBarColor = '#FFFFFF';
        const statusBarColor = '#9926F7';
        const style = Style.Dark;

        if (isAndroid) {
            await StatusBar.setBackgroundColor({ color: statusBarColor });
            await NavigationBar.setColor({ color: navigationBarColor, darkButtons: true });
        }

        await StatusBar.setStyle({ style });
        this.toggleStatusBar(true);
    }

    async toggleStatusBar(toggle: boolean) {
        if (toggle) await StatusBar.show();
        else await StatusBar.hide();
    }

    async toggleNavigationBar(toggle: boolean) {
        if (toggle) await NavigationBar.show();
        else await NavigationBar.hide();
    }
}
