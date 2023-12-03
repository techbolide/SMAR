import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'home',
        loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule)
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
    },
    {
        path: 'scan',
        loadChildren: () => import('./pages/scan/scan.module').then(m => m.ScanPageModule)
    },
    {
        path: 'voucher-history',
        loadChildren: () => import('./pages/voucher-history/voucher-history.module').then(m => m.VoucherHistoryPageModule)
    },
    {
        path: 'voucher-history/:id',
        loadChildren: () => import('./pages/voucher-details/voucher-details.module').then(m => m.VoucherDetailsPageModule)
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
