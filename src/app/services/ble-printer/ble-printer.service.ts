import { Injectable } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { Subscription } from 'rxjs';
import { StorageService } from '../storage/storage.service';
import { DEBUG_STORAGE, IDebugStorage } from 'src/app/app.component';

@Injectable({
    providedIn: 'root'
})
export class BlePrinterService {
    public bluetoothConection: Subscription | null = null;
    constructor(private bluetoothSerial: BluetoothSerial, private storageService: StorageService) { }

    async print(result: Uint8Array) {
        if(this.bluetoothConection != null) await this.bluetoothSerial.write(result).catch((r) => {
            this.bluetoothConection = null;
            throw(r);
        })
        else {
            const storageDataParsed = await this.storageService.getDebugStorage();
            if(!storageDataParsed) return;

            this.bluetoothConection = this.bluetoothSerial.connect(storageDataParsed.PrinterIdentifier).subscribe({
                next: async (res) => {
                    await this.bluetoothSerial.write(result);
                },
                error: (err) => {
                    this.bluetoothConection = null;
                    throw(err);
                }
            });
        }
    }
}
