export interface IVoucher {
    code: string;
    expirationDate: string;
    generatedDate: string;
    generatedTime: string;
    state: number;
    items: IVoucherItem[]
}

export interface IVoucherItem {
    uniqueID: string;
    type: IVoucherItemType;
    name: string;
    quantity: string;
    readDate: Date;
    eanCode: string;
}

export enum IVoucherItemType {
    Necunoscut = 0,
    Plastic = 1,
    Aluminiu = 2,
    Sticla = 3
}

export enum IVoucherItemContentType {
    Necunoscut = 0,
    Suc = 1,
    Nectar = 2,
    Bautura_racoritoare = 3,
    Apa = 4,
    Apa_minerala = 5,
    Apa_cu_arome = 6,
    Bere = 7,
    Mix_de_bere = 8,
    Cidru = 9,
    Vin = 10,
    Spirtoase = 11,
    Mix_de_bauturi_alcoolice = 12
}

export interface IVoucherQR {
    code: string;
    date: string;
    hour: string;
    expire: string;
    employeeCode: string;
    officeCode: string;
    value: number;
    plasticCount: number;
    aluminiumCount: number;
    glassCount: number;
}

export interface IVoucherInitialize {
    employeeCode: string;
    officeCode: string;
}

export interface IVoucherReceived {
    Code: string;
    ExpirationDate: string;
    GeneratedDate: string;
    GeneratedTime: string;
    InsertBy: string;
    InsertDate: string;
    State: number;
    PlasticCount: number;
    AluminiumCount: number;
    GlassCount: number;
    Value: number;
    Message: string;
}

export interface IVoucherActive {
    Code: string;
    PlasticCount: number;
    AluminiumCount: number;
    GlassCount: number;
    Items: IVoucherItem[];
    Type: string;
}

export interface IVoucherGetByScan
{
    Code: string;
}


export interface IPaginated
{
    from: number;
    take: number;
}
