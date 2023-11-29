/* eslint-disable curly */
import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { IToast } from 'src/app/interfaces/toast/IToast';

@Injectable({
    providedIn: 'root'
})

export class ToastService {
    private toasts: IToast[] = [];
    private isShowingToast = false;

    constructor(private toastController: ToastController) { }

    async showToast(message: string, duration: number, color: string, position: 'top' | 'middle' | 'bottom') {
        const toastData: IToast = { message, duration, position, color };
        this.toasts.push(toastData);
        if (!this.isShowingToast) await this.showNextToast();
    }

    private async showNextToast() {
        const toastData = this.toasts.shift();
        if (!toastData) return;

        this.isShowingToast = true;
        const toast = await this.toastController.create({
            message: toastData.message,
            duration: toastData.duration,
            position: toastData.position,
            color: toastData.color,
            mode: 'ios'
        });
        await toast.present();
        await toast.onDidDismiss();
        this.isShowingToast = false;
        await this.showNextToast();
    }
}
