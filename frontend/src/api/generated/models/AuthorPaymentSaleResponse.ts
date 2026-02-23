/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sale row for author payments view
 */
export type AuthorPaymentSaleResponse = {
    /**
     * Unique sale identifier
     */
    id?: number;
    /**
     * Unique identifier for the sold book
     */
    bookId?: number;
    /**
     * Book title
     */
    bookTitle?: string;
    /**
     * Book author
     */
    bookAuthor?: string;
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
};

