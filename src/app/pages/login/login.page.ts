import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
    public loginForm!: FormGroup;
    public isLogging: boolean = false;
    constructor(private router: Router,
        private formBuilder: FormBuilder,
        private authService: AuthenticationService,
        private toastService: ToastService,
        private cdr: ChangeDetectorRef,
        private translateService: TranslateService) { }

    ngOnInit() {
        this.initValidators();
    }

    initValidators() {
        this.loginForm = this.formBuilder.group({
            username: ['', [Validators.required, Validators.minLength(1)]],
            password: ['', [Validators.required, Validators.minLength(1)]],
        });
    }

    login() {
        if(!this.loginForm.valid || this.isLogging) return;

        this.isLogging = true;
        const formValues = this.loginForm.value;

        setTimeout(() => {
            this.authService.login(formValues).subscribe({
                next: (res) => {
                    this.isLogging = false;
                    this.cdr.detectChanges();
                    this.router.navigateByUrl('/home', { replaceUrl: true });
                },
                error: (err) => {
                    this.initValidators();
                    this.isLogging = false;
                    this.cdr.detectChanges();
                    this.toastService.showToast(this.translateService.instant('Toast.InvalidLogin'), 2000, 'danger', 'bottom');
                    console.log(err);
                }
            });
        }, 1000);

    }
}
