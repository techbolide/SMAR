import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.page.html',
    styleUrls: ['./reset-password.page.scss'],
})
export class ResetPasswordPage implements OnInit {
    public resetForm!: FormGroup;
    public isResetting: boolean = false;
    constructor(private router: Router,
        private formBuilder: FormBuilder,
        private authService: AuthenticationService,
        private toastService: ToastService,
        private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.initValidators();
    }

    initValidators() {
        this.resetForm = this.formBuilder.group({
            username: ['', [Validators.required, Validators.minLength(1)]],
        });
    }

    resetPassword() {
        if(!this.resetForm.valid || this.isResetting) return;

        this.isResetting = true;
        const formValues = this.resetForm.value;

        setTimeout(() => {
            this.authService.resetPassword(formValues).subscribe({
                next: (res) => {
                    this.isResetting = false;
                    this.cdr.detectChanges();
                    this.router.navigateByUrl('/login', { replaceUrl: true });
                    this.toastService.showToast("O parolă temporară a fost trimisa pe email-ul contului!", 2000, 'success', 'bottom');
                },
                error: (err) => {
                    this.initValidators();
                    this.isResetting = false;
                    this.cdr.detectChanges();
                    this.toastService.showToast("A intervenit o eroare în trimiterea parolei, încearcă din nou!", 2000, 'danger', 'bottom');
                    console.log(err);
                }
            });
        }, 1000);

    }

}
