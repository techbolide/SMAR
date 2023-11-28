import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VoucherHistoryPage } from './voucher-history.page';

const routes: Routes = [
    {
        path: '',
        component: VoucherHistoryPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class VoucherHistoryPageRoutingModule { }
