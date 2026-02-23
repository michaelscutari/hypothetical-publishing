/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Book response data
 */
export type BookResponse = {
    /**
     * Unique book identifier
     */
    id?: number;
    /**
     * Book title
     */
    title?: string;
    /**
     * Author name(s)
     */
    author?: string;
    /**
     * ISBN-13 identifier
     */
    isbn13?: string;
    /**
     * ISBN-10 identifier
     */
    isbn10?: string;
    /**
     * Publication year
     */
    publicationYear?: number;
    /**
     * Publication month (1-12)
     */
    publicationMonth?: number;
    /**
     * Distributor author royalty rate
     */
    distributorAuthorRoyaltyRate?: number;
    /**
     * Handsold author royalty rate
     */
    handsoldAuthorRoyaltyRate?: number;
    /**
     * Series name
     */
    seriesName?: string;
    /**
     * Series position
     */
    seriesPosition?: number;
    /**
     * Cover price (USD)
     */
    coverPrice?: number;
    /**
     * Print cost (USD)
     */
    printCost?: number;
    /**
     * Cover image URL
     */
    coverImage?: string;
    /**
     * Total sales quantity to date
     */
    totalSalesToDate?: number;
};

