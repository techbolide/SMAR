import { ChangeDetectorRef, Component } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DEBUG_STORAGE, IDebugStorage } from 'src/app/app.component';
import { LanguageService } from 'src/app/services/language/language.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
    public loadingSettings: boolean = true;
    public currentLanguage: string | null = null;
    public currentSettings: IDebugStorage | null = null;
    public currentVersion: string | null = null;
    public currentVersionCode: string | null = null;

    constructor(private languageService: LanguageService,
        private cdr: ChangeDetectorRef,
        private storageService: StorageService,
        private translateService: TranslateService,
        private toastService: ToastService,
        private actionSheetCtrl: ActionSheetController
    ) { }

    ionViewDidEnter() {
        this.getLanguage();
    }

    ionViewDidLeave() {
        this.currentLanguage = null;
        this.currentSettings = null;
    }

    getLanguage() {
        this.languageService.getLanguage().subscribe({
            next: (res) => {
                this.currentLanguage = res;
                this.getSettings();
            },
            error: (err) => {
                console.log(err);
                this.loadingSettings = false;
                this.cdr.detectChanges();
            }
        })
    }

    async getSettings() {
        const storageDataParsed = await this.storageService.getDebugStorage();
        this.currentSettings = storageDataParsed;

        await this.getApplicationVersion();

        setTimeout(() => {
            this.loadingSettings = false;
            this.cdr.detectChanges();
        }, 200);
    }

    async getApplicationVersion() {
        if(Capacitor.getPlatform() === 'web') return;

        const applicationInfo = await App.getInfo();
        this.currentVersion = applicationInfo.version;
        this.currentVersionCode = applicationInfo.build;
    }

    getFormattedAppVersion() {
        if(!this.currentVersion || !this.currentVersionCode) return 'N/A';

        return `v${this.currentVersion}.${this.currentVersionCode}`;
    }

    async notifications(event: any) {
        if (!this.currentSettings) return;

        this.currentSettings.AllowNotifications = event.detail.checked;
        if (this.currentSettings.AllowNotifications) this.toastService.showToast(this.translateService.instant('Settings.Notifications.Enable'), 1000, 'success', 'bottom');
        else this.toastService.showToast(this.translateService.instant('Settings.Notifications.Disable'), 1000, 'danger', 'bottom');

        await this.storageService.setStorageKey(DEBUG_STORAGE, JSON.stringify(this.currentSettings));

    }

    async saveDetails() {
        this.toastService.showToast(this.translateService.instant('Settings.SaveSuccess'), 1500, 'success', 'bottom');
        await this.storageService.setStorageKey(DEBUG_STORAGE, JSON.stringify(this.currentSettings));
    }

    async chooseLanguage() {
        const buttons = await this.getLanguageButtons();

        const actionSheet = await this.actionSheetCtrl.create({
            mode: 'ios',
            buttons: [
                ...buttons,
                {
                    text: this.translateService.instant('Settings.Cancel'),
                    role: 'cancel',
                    data: {
                        action: 'cancel',
                    },
                },
            ],
        });
        await actionSheet.present();
    }

    private async getLanguageButtons() {
        const availableLanguages = this.languageService.availableLanguages;
        const buttons = availableLanguages.map(lang => ({
            text: this.languageService.getLocalizedLanguageName(lang),
            data: {
                action: lang,
            },
            handler: () => {
                this.changeLanguage(lang);
            }
        }));

        return buttons;
    }

    async changeLanguage(language: string) {
        if(this.currentLanguage === language) {
            this.toastService.showToast(this.translateService.instant('Settings.Language.Same'), 1000, 'danger', 'bottom');
            return;
        }
        await this.languageService.setLanguage(language);
        setTimeout(() => {
            this.toastService.showToast(this.translateService.instant('Settings.Language.Success'), 1500, 'success', 'bottom');
        }, 250);
    }
}
