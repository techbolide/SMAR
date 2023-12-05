import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { StorageService } from '../storage/storage.service';
import { environment } from 'src/environments/environment';
import { map, tap, switchMap, filter, take, catchError } from 'rxjs/operators';
import { BehaviorSubject, from, Observable, of, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { IUser } from 'src/app/interfaces/authentication/IUser';

export const TOKEN_KEY = 'smar_auth_token';
export const REFRESH_TOKEN_KEY = 'smar_refresh_token';
export const PROFILE_KEY = 'smar_profile';

@Injectable({
    providedIn: 'root'
})
export class AuthenticationService {
    public isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public currentUser: BehaviorSubject<IUser | null> = new BehaviorSubject<IUser | null>(null);
    public loginApiLink: string = 'GetToken';
    public profileApiLink: string = 'GetOffice';
    public currentAccessToken: string | null = null;
    constructor(private http: HttpClient, private storageService: StorageService, private router: Router) {
        this.verifyToken();
    }

    async verifyToken() {
        const token = await this.getToken();
        if (token && token.value) {
            this.currentAccessToken = token.value;
            this.doAuth();
        } else {
            this.logout();
        }
    }

    getToken() {
        return this.storageService.getStorageKey(TOKEN_KEY);
    }

    login(credentials: any) {
        return this.http.post<string>(environment.apiUrl + this.loginApiLink, credentials).pipe(
            switchMap((tokens: any) => {
                this.currentAccessToken = tokens.AccessToken;
                const storeAccess = this.storageService.setStorageKey(TOKEN_KEY, tokens.AccessToken);
                const storeRefresh = this.storageService.setStorageKey(REFRESH_TOKEN_KEY, tokens.RefreshToken);
                return from(Promise.all([storeAccess, storeRefresh]));
            }),
            tap(_ => {
                this.doAuth();
            })
        );
    }

    logout() {
        this.isAuthenticated.next(false);
        this.currentAccessToken = null;
        this.storageService.removeStorageKey(TOKEN_KEY);
        this.storageService.removeStorageKey(REFRESH_TOKEN_KEY);
        this.storageService.removeStorageKey(PROFILE_KEY);
        this.router.navigateByUrl('/login', {replaceUrl: true});
    }

    getProfile() {
        return this.http.get<IUser>(environment.apiUrl + this.profileApiLink).pipe(
            map((res) => res || {})
        );
    }

    doAuth() {
        this.getProfile().subscribe({
            next: async (res) => {
                await this.storageService.setStorageKey(PROFILE_KEY, JSON.stringify(res));
                this.isAuthenticated.next(true);
                this.currentUser.next(res);
            },
            error: (err: any) => {
                console.log(err);
                this.logout();
            }
        })
    }

    isLogged() {
        return this.isAuthenticated;
    }
}
