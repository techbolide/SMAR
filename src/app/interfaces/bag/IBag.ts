export interface IBag {
    Code: string;
    Count: number;
    State: number;
    Category: number;
    Date: Date;
}

export interface ISealBag {
    Id: number;
    SealCode: string;
    PlasticCount: number;
    AluminiumCount: number;
    GlassCount: number;
    ProductCategoryId: number;
}

export interface IPickup {

}
