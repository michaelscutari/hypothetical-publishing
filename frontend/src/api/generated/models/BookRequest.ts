/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request body for creating or updating a book
 */
export type BookRequest = {
    /**
     * Book title
     */
    title: string;
    /**
     * Author name(s)
     */
    author: string;
    /**
     * ISBN-13 identifier
     */
    isbn13: string;
    /**
     * ISBN-10 identifier (optional)
     */
    isbn10?: string;
    /**
     * Publication year
     */
    publicationYear: number;
    /**
     * Publication month (1-12)
     */
    publicationMonth: number;
    /**
     * Distributor author royalty rate (0.0 to 1.0)
     */
    distributorAuthorRoyaltyRate?: number;
    /**
     * Handsold author royalty rate (0.0 to 1.0)
     */
    handsoldAuthorRoyaltyRate?: number;
    /**
     * Series name
     */
    seriesName?: string;
    /**
     * Series position (positive integer). Required if series is set.
     */
    seriesPosition?: number;
    /**
     * Cover price (USD)
     */
    coverPrice: number;
    /**
     * Print cost (USD)
     */
    printCost: number;
    coverPriceGreaterThanPrintCost?: boolean;
};

