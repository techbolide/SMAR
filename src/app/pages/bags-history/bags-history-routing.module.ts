import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BagsHistoryPage } from './bags-history.page';

const routes: Routes = [
    {
        path: '',
        component: BagsHistoryPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class BagsHistoryPageRoutingModule { }
