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
    id: number;
    /**
     * Unique identifier for the sold book
     */
    bookId: number;
    /**
     * Title of the sold book
     */
    bookTitle: string;
    /**
     * Author of the sold book
     */
    bookAuthor: string;
    /**
     * Sale source (distributor or handsold)
     */
    saleSource: SaleResponse.saleSource;
    /**
     * Distributor of the sale
     */
    distributor: SaleResponse.distributor;
    /**
     * Format of the book that was sold
     */
    format: SaleResponse.format;
    /**
     * Author ID of the sold book
     */
    authorId: number;
    /**
     * Month of the sale
     */
    saleMonth: number;
    /**
     * Year of the sale
     */
    saleYear: number;
    /**
     * Quantity of books sold
     */
    quantitySold?: number;
    /**
     * KENP of the ebooks sold. Only present for ebooks
     */
    kenp?: number;
    /**
     * Currency the sale was made in
     */
    saleCurrency: SaleResponse.saleCurrency;
    /**
     * Revenue of the publisher in the original sale currency
     */
    originalPublisherRevenue: number;
    /**
     * Revenue of the publisher in USD
     */
    publisherRevenue: number;
    /**
     * The amount the author was paid
     */
    authorRoyalty: number;
    /**
     * Indicates whether the author has been paid or not
     */
    hasAuthorBeenPaid: boolean;
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
    /**
     * Distributor of the sale
     */
    export enum distributor {
        INGRAM_SPARK = 'INGRAM_SPARK',
        AMAZON = 'AMAZON',
        OTHER = 'OTHER',
    }
    /**
     * Format of the book that was sold
     */
    export enum format {
        PRINT = 'PRINT',
        EBOOK = 'EBOOK',
        KINDLE_UNLIMITED = 'KINDLE_UNLIMITED',
    }
    /**
     * Currency the sale was made in
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

