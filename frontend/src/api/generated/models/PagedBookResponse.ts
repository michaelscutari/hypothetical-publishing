/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BookResponse } from './BookResponse';
/**
 * Paginated book response
 */
export type PagedBookResponse = {
    /**
     * List of books
     */
    content?: Array<BookResponse>;
    /**
     * Current page number (0-indexed)
     */
    page?: number;
    /**
     * Page size
     */
    size?: number;
    /**
     * Total number of elements
     */
    totalElements?: number;
    /**
     * Total number of pages
     */
    totalPages?: number;
    /**
     * Whether this is an unpaged (show all) response
     */
    unpaged?: boolean;
};

