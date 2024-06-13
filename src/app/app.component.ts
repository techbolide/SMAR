import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StorageService } from './services/storage/storage.service';
import { StatusBarService } from './services/status-bar/status-bar.service';
import { LanguageService } from './services/language/language.service';

export const DEBUG_STORAGE = 'smar-debug-storage';
export interface IDebugStorage {
    Header: string;
    Subheader: string;
    Footer: string;
    Subfooter: string;
    PrinterIdentifier: string;
    AllowNotifications: boolean;
}

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
})
export class AppComponent {
    constructor(private platform: Platform, private storageService: StorageService, private languageService: LanguageService, private statusBarService: StatusBarService) {
        this.initializeApplication();
    }

    initializeApplication() {
        console.log('Initializing Techbolide DRS...');
        this.platform.ready().then(() => {
            this.languageService.initialize();
            this.initializeStatusBar();
            this.debugStorage();
        });
    }

    initializeStatusBar() {
        setTimeout(() => {
            this.statusBarService.setDefaultStatusBar();
        }, 2500);
    }

    async debugStorage() {
        const storageDataParsed = await this.storageService.getDebugStorage();
        if(storageDataParsed) return;

        const debugStorage: IDebugStorage = {
            Header: 'Kaufland Polska Markety',
            Subheader: 'al. Armii Krajowej 47, 50-541 Wrocław, Poland',
            Footer: '',
            Subfooter: '',
            AllowNotifications: true,
            PrinterIdentifier: '57:4C:54:02:97:6E'
        }
        await this.storageService.setStorageKey(DEBUG_STORAGE, JSON.stringify(debugStorage));
    }
}
