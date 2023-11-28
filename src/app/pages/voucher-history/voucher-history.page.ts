import { Component, OnInit } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { AlertController } from '@ionic/angular';

@Component({
    selector: 'app-voucher-history',
    templateUrl: './voucher-history.page.html',
    styleUrls: ['./voucher-history.page.scss'],
})
export class VoucherHistoryPage implements OnInit {
    public isSupported = false;
    constructor(private alertController: AlertController) { }

    ngOnInit() {
        this.checkSupported();
    }

    checkSupported() {
        if (Capacitor.getPlatform() === 'web') return;

        BarcodeScanner.isSupported().then((result) => {
            this.isSupported = result.supported;
        });
    }

    async isGoogleBarcodeScannerModuleAvailable() {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        return available;
    }

    async tryScanBarCode() {
        const granted = await this.requestPermissions();
        if (!granted) {
            this.presentAlert();
            return;
        }

        const moduleInstalled = await this.isGoogleBarcodeScannerModuleAvailable();
        if (!moduleInstalled) {
            this.addGoogleModuleListener();
            console.log("[SCANNER] Module not installed, installing...");
            await BarcodeScanner.installGoogleBarcodeScannerModule();
        } else {
            this.scanBarCode();
        }
    }

    addGoogleModuleListener() {
        BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', (event: any) => {
            const { status, progress } = event;

            if (status === 'done') {
                console.log('[SCANNER] Module installation completed');
                this.scanBarCode();
            } else if (status === 'error') {
                console.error('[SCANNER] Module installation error:', event.error);
            }
        });
    }

    async scanBarCode() {
        const { barcodes } = await BarcodeScanner.scan();
        barcodes.forEach(barcode => {
            console.log(barcode);
        });
    }


    async requestPermissions(): Promise<boolean> {
        const { camera } = await BarcodeScanner.requestPermissions();
        return camera === 'granted' || camera === 'limited';
    }

    async presentAlert(): Promise<void> {
        const alert = await this.alertController.create({
            header: 'Permisiune respinsă',
            message: 'Vă rugăm să acordați camerei permisiunea de a utiliza scanerul de coduri de bare.',
            buttons: ['Okay'],
        });
        await alert.present();
    }


}
