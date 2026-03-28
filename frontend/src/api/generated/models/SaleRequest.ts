/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request body for creating or updating a sale
 */
export type SaleRequest = {
    /**
     * The id of the corresponding book that was sold
     */
    bookId: number;
    /**
     * Sale source (distributor or handsold)
     */
    saleSource: SaleRequest.saleSource;
    /**
     * The distributor through which the sale was made
     */
    distributor?: SaleRequest.distributor;
    /**
     * The format of the book that was sold
     */
    format: SaleRequest.format;
    /**
     * The month the sale was made
     */
    saleMonth: number;
    /**
     * The year the sale was made
     */
    saleYear: number;
    /**
     * The amount of books sold in this sale
     */
    quantitySold?: number;
    /**
     * The KENP pages read in this sale, required for handsold sales
     */
    kenp?: number;
    /**
     * The currency that the sale was originally made in
     */
    saleCurrency: SaleRequest.saleCurrency;
    /**
     * Publisher revenue in the original currency of the sale. Required for distributor sales
     */
    originalPublisherRevenue: number;
    /**
     * Publisher revenue in USD. Required for distributor sales; computed for handsold sales.
     */
    publisherRevenue?: number;
    /**
     * Indicates whether the author has been paid
     */
    hasAuthorBeenPaid?: boolean;
    /**
     * Optional comment
     */
    comment?: string;
};
export namespace SaleRequest {
    /**
     * Sale source (distributor or handsold)
     */
    export enum saleSource {
        DISTRIBUTOR = 'DISTRIBUTOR',
        HAND_SOLD = 'HAND_SOLD',
    }
    /**
     * The distributor through which the sale was made
     */
    export enum distributor {
        INGRAM_SPARK = 'INGRAM_SPARK',
        AMAZON = 'AMAZON',
        OTHER = 'OTHER',
    }
    /**
     * The format of the book that was sold
     */
    export enum format {
        PRINT = 'PRINT',
        EBOOK = 'EBOOK',
        KINDLE_UNLIMITED = 'KINDLE_UNLIMITED',
    }
    /**
     * The currency that the sale was originally made in
     */
    export enum saleCurrency {
        AUD = 'AUD',
        BRL = 'BRL',
        CAD = 'CAD',
        CNY = 'CNY',
        EGP = 'EGP',
        EUR = 'EUR',
        INR = 'INR',
        JPY = 'JPY',
        MXN = 'MXN',
        PLN = 'PLN',
        SAR = 'SAR',
        SGD = 'SGD',
        SEK = 'SEK',
        TRY = 'TRY',
        AED = 'AED',
        GBP = 'GBP',
        USD = 'USD',
    }
}

