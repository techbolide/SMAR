import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { WelcomeGuard } from './guards/welcome/welcome.guard';

const routes: Routes = [
    {
        path: 'home',
        loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule),
        canLoad: [WelcomeGuard]
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule),
        canLoad: [WelcomeGuard]
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
    {
        path: 'bag-history',
        loadChildren: () => import('./pages/bags-history/bags-history.module').then(m => m.BagsHistoryPageModule)
    },
    {
        path: 'bags-seal',
        loadChildren: () => import('./pages/bags-seal/bags-seal.module').then(m => m.BagsSealPageModule)
    },
    {
        path: 'settings',
        loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsPageModule)
    },
    {
        path: 'packaging',
        loadChildren: () => import('./pages/packaging/packaging.module').then(m => m.PackagingPageModule)
    },
    {
        path: 'reset-password',
        loadChildren: () => import('./pages/reset-password/reset-password.module').then(m => m.ResetPasswordPageModule)
    },
    {
        path: 'welcome',
        loadChildren: () => import('./pages/welcome/welcome.module').then(m => m.WelcomePageModule)
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
