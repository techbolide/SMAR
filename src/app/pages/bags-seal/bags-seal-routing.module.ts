import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BagsSealPage } from './bags-seal.page';

const routes: Routes = [
    {
        path: '',
        component: BagsSealPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class BagsSealPageRoutingModule { }
