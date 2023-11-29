import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StorageService } from './services/storage/storage.service';

export const DEBUG_STORAGE = 'smar-debug-storage';
export interface IDebugStorage {
    EmployeeCode: string;
    OfficeCode: string;
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
    constructor(private platform: Platform, private storageService: StorageService) {
        this.initializeApplication();
    }

    initializeApplication() {
        console.log('Initializing Techbolide SMAR...');
        this.platform.ready().then(() => {
            this.debugStorage();
        });
    }

    async debugStorage() {
        const debugStorage: IDebugStorage = {
            EmployeeCode: 'R0628320002',
            OfficeCode: 'R062832',
            Header: 'Piata lui Andrei, nr. 9',
            Subheader: 'Str. Principala, nr 18, Tatarani, com. Romanesti',
            Footer: ' ',
            Subfooter: ' ',
            PrinterIdentifier: '57:4C:54:02:CA:0C'
        }
        await this.storageService.setStorageKey(DEBUG_STORAGE, JSON.stringify(debugStorage));
    }
}
