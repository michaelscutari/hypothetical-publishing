/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Prefill response for book lookup by ISBN
 */
export type BookLookupResponse = {
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
     * Cover image URL
     */
    coverImage?: string;
};

