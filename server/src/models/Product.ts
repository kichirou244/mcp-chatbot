export interface IProduct {
    id: number;
    outletId: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
}

export interface IProductWithOutlet extends IProduct {
    outletName: string;
    outletAddress: string;
}