/* eslint-disable max-len */
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { BehaviorSubject, from, Observable, of, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
    public tokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
    public isRefreshingToken: boolean = false;
    constructor(private authService: AuthenticationService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Check if we need additional token logic or not

        if (this.isInBlockedList(request.url)) {
            return next.handle(request);
        } else {
            return next.handle(this.addToken(request)).pipe(
                catchError(err => {
                    if (err instanceof HttpErrorResponse) {
                        switch (err.status) {
                            case 400:
                                return this.handle400Error(err);
                            case 401:
                                return this.handle401Error(request, next);
                            default:
                                return throwError(err);
                        }
                    } else {
                        return throwError(err);
                    }
                })
            );
        }
    }

    private isInBlockedList(url: string): boolean {
        return url === `${environment.apiUrl}GetToken`;
    }

    private async handle400Error(err: HttpErrorResponse) {
        this.authService.logout();
        return of(null);
    }

    // Indicates our access token is invalid, try to load a new one
    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
        this.authService.logout();
        return of(null);
        // // Check if another call is already using the refresh logic
        // if (!this.isRefreshingToken) {

        //     // Set to null so other requests will wait
        //     // until we got a new token!
        //     this.tokenSubject.next(null);
        //     this.isRefreshingToken = true;
        //     this.authService.currentAccessToken = null;

        //     // First, get a new access token
        //     return this.authService.getNewAccessToken().pipe(
        //         switchMap((token: any) => {
        //             if (token) {
        //                 // Store the new token
        //                 const accessToken = token.accessToken;
        //                 return this.authService.storeAccessToken(accessToken).pipe(
        //                     switchMap(_ => {
        //                         // Use the subject so other calls can continue with the new token
        //                         this.tokenSubject.next(accessToken);

        //                         // Perform the initial request again with the new token
        //                         return next.handle(this.addToken(request));
        //                     })
        //                 );
        //             } else {
        //                 // No new token or other problem occurred
        //                 return of(null);
        //             }
        //         }),
        //         finalize(() => {
        //             // Unblock the token reload logic when everything is done
        //             this.isRefreshingToken = false;
        //         })
        //     );
        // } else {
        //     // "Queue" other calls while we load a new token
        //     return this.tokenSubject.pipe(
        //         filter(token => token !== null),
        //         take(1),
        //         switchMap(token =>
        //             // Perform the request again now that we got a new token!
        //             next.handle(this.addToken(request))
        //         )
        //     );
        // }
    }

    // Add our current access token from the service if present
    private addToken(req: HttpRequest<any>) {
        if (this.authService.currentAccessToken) {
            return req.clone({
                headers: new HttpHeaders({
                    Authorization: `Bearer ${this.authService.currentAccessToken}`
                })
            });
        } else {
            return req;
        }
    }
}
