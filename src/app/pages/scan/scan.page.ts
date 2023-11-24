import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { AlertController } from '@ionic/angular';
import { IVoucher, IVoucherItem, IVoucherItemContentType } from 'src/app/interfaces/scan/IVoucher';
import { IVoucherItemType } from '../../interfaces/scan/IVoucher';
import { EanService } from 'src/app/services/ean/ean.service';

@Component({
    selector: 'app-scan',
    templateUrl: './scan.page.html',
    styleUrls: ['./scan.page.scss'],
})
export class ScanPage implements OnInit {
    public isSupported = false;
    public barcodes: Barcode[] = [];

    public currentVoucher: IVoucher | null = null;
    constructor(private alertController: AlertController, private eanService: EanService) { }

    ngOnInit() {
        this.initializeVoucher();
        this.checkSupported();
    }

    checkSupported() {
        if (Capacitor.getPlatform() === 'web') return;

        BarcodeScanner.isSupported().then((result) => {
            this.isSupported = result.supported;
        });
    }

    initializeVoucher() {
        this.currentVoucher = {
            code: 'R062832-0003-16571231',
            startDate: new Date(),
            employeeId: 1,
            officeId: 1,
            items: [
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
                // { type: IVoucherItemType.Plastic, name: IVoucherItemContentType.Apa_minerala, quantity: 500, readDate: new Date(), eanCode: '343434343' },
            ]
        };
    }

    async isGoogleBarcodeScannerModuleAvailable() {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        return available;
    }

    getFormattedName(name: IVoucherItemContentType) {
        if (name in IVoucherItemContentType)
            return IVoucherItemContentType[name].replace(/_/g, " ");
        return "Necunoscut";
    }

    getFormattedType(type: IVoucherItemType) {

        if (type in IVoucherItemType) {
            const voucherType = IVoucherItemType[type];
            switch (voucherType.toLowerCase()) {
                case 'doze': return 'can';
                case 'sticla': return 'glass';
                default: return 'plastic-bottle';
            }
        }

        return 'plastic-bottle';
    }

    async takePicture() {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: true,
            resultType: CameraResultType.Uri
        });
        var imageUrl = image.webPath;
        console.log(imageUrl);
    }

    async tryScanBarCode() {
        if (!this.currentVoucher) return;
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
            this.scanSingleBarCode(barcode);
        });
    }



    scanSingleBarCode(barcode: Barcode) {
        if (!this.currentVoucher) return;

        const itemReceived = this.eanService.validateEAN(barcode.displayValue);
        if (itemReceived.type === IVoucherItemType.Necunoscut) return;

        this.currentVoucher.items.push(itemReceived);
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

    getTotal() {
        if (!this.currentVoucher) return 0;

        return this.currentVoucher.items.length * 0.5;
    }

    getItemsCount(type: IVoucherItemType) {
        if (!this.currentVoucher) return 0;

        return this.currentVoucher.items.filter(x => x.type === type).length;
    }

}
