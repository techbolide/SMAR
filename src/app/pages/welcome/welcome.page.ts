import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { TranslateService } from '@ngx-translate/core';
import { ONBOARIDNG_KEY } from 'src/app/guards/welcome/welcome.guard';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { Diagnostic } from '@awesome-cordova-plugins/diagnostic/ngx';

@Component({
    selector: 'app-welcome',
    templateUrl: './welcome.page.html',
    styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage {
    public loadingNextStep: boolean = false;
    constructor(private storageService: StorageService,
        private router: Router,
        private toastService: ToastService,
        private translateService: TranslateService,
        private androidPermissions: AndroidPermissions,
        private diagnostic: Diagnostic
    ) { }

    checkPermission() {
        if (this.loadingNextStep) return;

        this.loadingNextStep = true;

        setTimeout(() => {
            this.checkBluetoothOpened();
            this.loadingNextStep = false;
        }, 750);
    }

    checkBluetoothOpened() {
        if (Capacitor.getPlatform() === 'web') {
            this.goToHome();
            return;
        }

        this.diagnostic.isBluetoothEnabled().then((status) => {
            if (status) this.checkBluetoothPermission();
            else this.toastService.showToast(this.translateService.instant('Toast.BluetoothClosed'), 2000, 'danger', 'top');
        });
    }

    async goToHome() {
        await this.storageService.setStorageKey(ONBOARIDNG_KEY, 'true');
        this.router.navigateByUrl('/login', { replaceUrl: true });
        this.toastService.showToast(this.translateService.instant('Toast.PermissionSuccess'), 2000, 'success', 'top');
    }

    checkBluetoothPermission() {
        this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.BLUETOOTH).then(
            (result) => {
                if (result.hasPermission) this.checkBluetoothScanPermission();
                else this.requestBluetoothPermission();
            },
            (err) => {
                console.log(err);
                this.requestBluetoothPermission();
            }
        );
    }

    requestBluetoothPermission() {
        this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.BLUETOOTH).then(
            (result) => {
                if (result.hasPermission) this.checkBluetoothScanPermission();
                else this.toastService.showToast(this.translateService.instant('Toast.PermissionError'), 2000, 'danger', 'top');
            },
            (err) => {
                console.log(err);
                this.toastService.showToast(this.translateService.instant('Toast.PermissionError'), 2000, 'danger', 'top');
            }
        )
    }

    checkBluetoothScanPermission() {
        this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.BLUETOOTH_SCAN).then(
            (result) => {
                if (result.hasPermission) this.checkBluetoothConnectPermission();
                else this.requestBluetoothScanPermission();
            },
            (err) => {
                console.log(err);
                this.requestBluetoothScanPermission();
            }
        );
    }

    requestBluetoothScanPermission() {
        this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.BLUETOOTH_SCAN).then(
            (result) => {
                if (result.hasPermission) this.checkBluetoothConnectPermission();
                else this.toastService.showToast(this.translateService.instant('Toast.PermissionError'), 2000, 'danger', 'top');
            },
            (err) => {
                console.log(err);
                this.toastService.showToast(this.translateService.instant('Toast.PermissionError'), 2000, 'danger', 'top');
            }
        )
    }

    checkBluetoothConnectPermission() {
        this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.BLUETOOTH_CONNECT).then(
            (result) => {
                if (result.hasPermission) this.goToHome();
                else this.requestBluetoothConnectPermission();
            },
            (err) => {
                console.log(err);
                this.requestBluetoothConnectPermission();
            }
        );
    }

    requestBluetoothConnectPermission() {
        this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.BLUETOOTH_CONNECT).then(
            (result) => {
                if (result.hasPermission) this.goToHome();
                else this.toastService.showToast(this.translateService.instant('Toast.PermissionError'), 2000, 'danger', 'top');
            },
            (err) => {
                console.log(err);
                this.toastService.showToast(this.translateService.instant('Toast.PermissionError'), 2000, 'danger', 'top');
            }
        )
    }
}
