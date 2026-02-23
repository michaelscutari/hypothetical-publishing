/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sale response data
 */
export type SaleResponse = {
    /**
     * Unique sale identifier id
     */
    id?: number;
    /**
     * Unique identifier for the sold book
     */
    bookId?: number;
    /**
     * Title of the sold book
     */
    bookTitle?: string;
    /**
     * Author ID of the sold book
     */
    authorId?: number;
    /**
     * Author name of the sold book
     */
    bookAuthor?: string;
    /**
     * Sale source (distributor or handsold)
     */
    saleSource?: SaleResponse.saleSource;
    /**
     * Month of the sale
     */
    saleMonth?: number;
    /**
     * Year of the sale
     */
    saleYear?: number;
    /**
     * Quantity of books sold
     */
    quantitySold?: number;
    /**
     * Revenue of the publisher
     */
    publisherRevenue?: number;
    /**
     * The amount the author was paid
     */
    authorRoyalty?: number;
    /**
     * Indicates whether the author has been paid or not
     */
    hasAuthorBeenPaid?: boolean;
    /**
     * Optional comment
     */
    comment?: string;
};
export namespace SaleResponse {
    /**
     * Sale source (distributor or handsold)
     */
    export enum saleSource {
        DISTRIBUTOR = 'DISTRIBUTOR',
        HAND_SOLD = 'HAND_SOLD',
    }
}

