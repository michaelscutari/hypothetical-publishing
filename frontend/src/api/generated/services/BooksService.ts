/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BookFinancialSummaryResponse } from '../models/BookFinancialSummaryResponse';
import type { BookRequest } from '../models/BookRequest';
import type { BookResponse } from '../models/BookResponse';
import type { PagedBookResponse } from '../models/PagedBookResponse';
import type { PagedResponseString } from '../models/PagedResponseString';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BooksService {
    /**
     * Get a book by ID
     * @param id
     * @returns BookResponse OK
     * @throws ApiError
     */
    public static getBookById(
        id: number,
    ): CancelablePromise<BookResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/books/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update an existing book
     * @param id
     * @param requestBody
     * @returns BookResponse OK
     * @throws ApiError
     */
    public static updateBook(
        id: number,
        requestBody: BookRequest,
    ): CancelablePromise<BookResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/books/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a book
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteBook(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/books/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get paginated books with optional search, sort, and filter
     * @param page
     * @param size
     * @param showAll
     * @param query
     * @param sortField
     * @param sortDirection
     * @returns PagedBookResponse OK
     * @throws ApiError
     */
    public static getAllBooks(
        page?: number,
        size: number = 25,
        showAll: boolean = false,
        query?: string,
        sortField?: string,
        sortDirection: string = 'asc',
    ): CancelablePromise<PagedBookResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/books',
            query: {
                'page': page,
                'size': size,
                'showAll': showAll,
                'query': query,
                'sortField': sortField,
                'sortDirection': sortDirection,
            },
        });
    }
    /**
     * Create a new book
     * @param requestBody
     * @returns BookResponse Created
     * @throws ApiError
     */
    public static createBook(
        requestBody: BookRequest,
    ): CancelablePromise<BookResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/books',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Gets the aggregate amounts for book detail financials
     * @param id
     * @returns BookFinancialSummaryResponse OK
     * @throws ApiError
     */
    public static getBookDetailFinancials(
        id: number,
    ): CancelablePromise<BookFinancialSummaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/books/{id}/financials',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Search distinct author names
     * @param query
     * @param page
     * @param size
     * @param showAll
     * @returns PagedResponseString OK
     * @throws ApiError
     */
    public static searchAuthors(
        query?: string,
        page?: number,
        size: number = 25,
        showAll: boolean = false,
    ): CancelablePromise<PagedResponseString> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/books/authors',
            query: {
                'query': query,
                'page': page,
                'size': size,
                'showAll': showAll,
            },
        });
    }
}
