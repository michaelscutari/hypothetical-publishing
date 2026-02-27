/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BookDetailResponse } from '../models/BookDetailResponse';
import type { BookLookupResponse } from '../models/BookLookupResponse';
import type { BookRequest } from '../models/BookRequest';
import type { BookResponse } from '../models/BookResponse';
import type { PagedResponseAuthorResponse } from '../models/PagedResponseAuthorResponse';
import type { PagedResponseBookResponse } from '../models/PagedResponseBookResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BooksService {
    /**
     * Get a book by ID (includes financials)
     * @param id
     * @returns BookDetailResponse OK
     * @throws ApiError
     */
    public static getBookById(
        id: number,
    ): CancelablePromise<BookDetailResponse> {
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
     * @param authorId
     * @param page
     * @param size
     * @param showAll
     * @param query
     * @param sortField
     * @param sortDirection
     * @returns PagedResponseBookResponse OK
     * @throws ApiError
     */
    public static getAllBooks(
        authorId?: number,
        page?: number,
        size: number = 25,
        showAll: boolean = false,
        query?: string,
        sortField?: Array<string>,
        sortDirection?: Array<string>,
    ): CancelablePromise<PagedResponseBookResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/books',
            query: {
                'authorId': authorId,
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
     * Lookup a book by ISBN
     * @param isbn
     * @returns BookLookupResponse Book metadata for prefill
     * @throws ApiError
     */
    public static lookupBookByIsbn(
        isbn: string,
    ): CancelablePromise<BookLookupResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/books/lookup',
            query: {
                'isbn': isbn,
            },
            errors: {
                400: `Invalid ISBN`,
                404: `Book not found`,
                409: `Book already exists`,
                502: `Upstream lookup failed`,
            },
        });
    }
    /**
     * Search authors for autocomplete
     * @param query
     * @param page
     * @param size
     * @param showAll
     * @returns PagedResponseAuthorResponse OK
     * @throws ApiError
     */
    public static searchAuthors(
        query?: string,
        page?: number,
        size: number = 25,
        showAll: boolean = false,
    ): CancelablePromise<PagedResponseAuthorResponse> {
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
