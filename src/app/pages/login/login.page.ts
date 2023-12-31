import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
        private cdr: ChangeDetectorRef) { }

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
                    this.toastService.showToast("Nume de utilizator sau parolă sunt invalide, încearcă din nou!", 2000, 'danger', 'bottom');
                    console.log(err);
                }
            });
        }, 1000);

    }
}
