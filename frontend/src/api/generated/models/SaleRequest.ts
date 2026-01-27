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
    quantitySold: number;
    /**
     * The amount of money the publisher made
     */
    publisherRevenue: number;
    /**
     * Indicates whether the author has been paid
     */
    hasAuthorBeenPaid?: boolean;
    pastOrPresent?: boolean;
};

