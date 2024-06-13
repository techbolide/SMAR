import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { StorageService } from '../storage/storage.service';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { ILanguageNames } from 'src/app/interfaces/language/ILanguageNames';

export const LANGUAGE_KEY = 'smar_language';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    public availableLanguages: string[] = ['ro', 'en', 'pl'];
    public currentLanguage: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
    public currentLocale: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

    private languageNames: ILanguageNames = {
        ro: 'Română',
        en: 'English',
        pl: 'Polski'
    };


    constructor(public translate: TranslateService, private storageService: StorageService, private http: HttpClient) { }

    async initialize() {
        this.translate.addLangs(this.availableLanguages);

        const language = await this.storageService.getStorageKey(LANGUAGE_KEY);
        // const languageToUse = language && language.value !== null ? language.value : this.translate.getBrowserLang();
        const languageToUse = language && language.value !== null ? language.value : 'pl';
        const fileURL = `./assets/i18n/${languageToUse}.json`;
        try {
            this.fileExists(fileURL).subscribe(exists => {
                if (exists) this.setLanguage(languageToUse);
                else {
                    console.log('Language file does not exist!');
                    this.setLanguage('en');
                }
            });
        } catch (e) {
            this.setLanguage('en');
            console.log(e);
        }
    }

    async setLanguage(language: string | undefined) {
        if (!language) return;

        this.currentLanguage.next(language);
        this.currentLocale.next(language);
        this.translate.setDefaultLang(language);
        this.translate.use(language);
        await this.storageService.setStorageKey(LANGUAGE_KEY, language);
    }

    fileExists(url: string): Observable<boolean> {
        return this.http.get(url).pipe(map(() => true), catchError(() => of(false)));
    }

    getLanguage() {
        return this.currentLanguage;
    }

    getLocalizedLanguageName(langCode: string): string {
        return this.languageNames[langCode] || langCode;
    }
}
