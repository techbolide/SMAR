import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { DEBUG_STORAGE, IDebugStorage } from 'src/app/app.component';
import { PROFILE_KEY } from '../authentication/authentication.service';
import { IUser } from 'src/app/interfaces/authentication/IUser';

@Injectable({
    providedIn: 'root'
})

export class StorageService {

    constructor() { }

    async setStorageKey(key: string, value: string) {
        await Preferences.set({ key, value });
    }
    async getStorageKey(key: string) {
        return await Preferences.get({ key });
    }
    async removeStorageKey(key: string) {
        await Preferences.remove({ key });
    }

    async getDebugStorage() {
        const storageData = await this.getStorageKey(DEBUG_STORAGE);
        if (storageData && storageData.value !== null) {
            const storageDataParsed = JSON.parse(storageData.value) as IDebugStorage;
            return storageDataParsed;
        }

        return null;
    }

    async getProfileStorage() {
        const storageData = await this.getStorageKey(PROFILE_KEY);
        if (storageData && storageData.value !== null) {
            const storageDataParsed = JSON.parse(storageData.value) as IUser;
            return storageDataParsed;
        }

        return null;
    }
}
