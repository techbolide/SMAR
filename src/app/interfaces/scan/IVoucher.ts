export interface IVoucher {
    code: string;
    startDate: Date;
    employeeId: number;
    officeId: number;
    items: IVoucherItem[]
}

export interface IVoucherItem {
    type: IVoucherItemType;
    name: IVoucherItemContentType;
    quantity: number;
    readDate: Date;
    eanCode: string;
}

export enum IVoucherItemType {
    Necunoscut = 0,
    Plastic = 1,
    Doze = 2,
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
