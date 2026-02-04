/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Book detail response data - includes book financials
 */
export type BookDetailResponse = {
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
     * Author royalty rate
     */
    royaltyRate?: number;
    /**
     * Total sales quantity to date
     */
    totalSalesToDate?: number;
    /**
     * Total publisher revenue earned from this book
     */
    revenue?: number;
    /**
     * Total author unpaid royalty from the book
     */
    unpaidRoyalty?: number;
    /**
     * Total author paid royalty from the book
     */
    paidRoyalty?: number;
    /**
     * Total royalty earned by the author (both paid and unpaid
     */
    totalRoyalty?: number;
};

