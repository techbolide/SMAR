import { Injectable } from '@angular/core';
import { CanLoad, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { StorageService } from '../../services/storage/storage.service';

export const ONBOARIDNG_KEY = 'smar_onboarding';

@Injectable({
    providedIn: 'root'
})
export class WelcomeGuard implements CanLoad {

    constructor(private router: Router, private storageService: StorageService) { }

    async canLoad(): Promise<boolean> {
        const hasOnBoardingSeen = await this.storageService.getStorageKey(ONBOARIDNG_KEY);
        if (hasOnBoardingSeen && hasOnBoardingSeen.value === 'true') return true;
        this.router.navigateByUrl('/welcome', { replaceUrl: true });
        return false;
    }

}
