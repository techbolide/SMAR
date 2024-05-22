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
        console.log('Initializing Techbolide SGR...');
        this.platform.ready().then(() => {
            this.languageService.initialize();
            this.initializeStatusBar();
            this.debugStorage();
        });
    }

    initializeStatusBar() {
        setTimeout(() => {
            this.statusBarService.setDefaultStatusBar();
        }, 2100);
    }

    async debugStorage() {
        const debugStorage: IDebugStorage = {
            Header: 'Piata lui Andrei, nr. 9',
            Subheader: 'Str. Principala, nr 18, Tatarani, com. Romanesti',
            Footer: ' ',
            Subfooter: ' ',
            // PrinterIdentifier: '57:4C:54:02:CA:0C' -- stef
            PrinterIdentifier: '57:4C:54:02:97:6E' // -- vali
        }
        await this.storageService.setStorageKey(DEBUG_STORAGE, JSON.stringify(debugStorage));
    }
}
