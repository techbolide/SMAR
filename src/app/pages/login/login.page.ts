import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
    public loginForm!: FormGroup;
    constructor(private router: Router, private formBuilder: FormBuilder, private authService: AuthenticationService) { }

    ngOnInit() {
        this.initValidators();
    }

    initValidators() {
        this.loginForm = this.formBuilder.group({
            username: ['', [Validators.required]],
            password: ['', [Validators.required]],
        });
    }

    login() {
        const formValues = this.loginForm.value;
        this.authService.login(formValues).subscribe({
            next: (res) => {
                this.router.navigateByUrl('/home', { replaceUrl: true });
            },
            error: (err) => {
                console.log(err);
            }
        });
    }
}
