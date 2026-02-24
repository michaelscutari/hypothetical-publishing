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
     * Author name
     */
    author?: string;
    /**
     * Author Id
     */
    authorId?: number;
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
};

