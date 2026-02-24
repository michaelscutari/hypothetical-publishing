/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BookCoversService {
    /**
     * Get the full-size cover image
     * @param bookId
     * @returns string OK
     * @throws ApiError
     */
    public static getCover(
        bookId: number,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/books/{bookId}/cover',
            path: {
                'bookId': bookId,
            },
        });
    }
    /**
     * Upload or replace a book cover image
     * @param bookId
     * @param formData
     * @returns string OK
     * @throws ApiError
     */
    public static uploadCover(
        bookId: number,
        formData?: {
            file: Blob;
        },
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/books/{bookId}/cover',
            path: {
                'bookId': bookId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Remove a book cover image
     * @param bookId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteCover(
        bookId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/books/{bookId}/cover',
            path: {
                'bookId': bookId,
            },
        });
    }
    /**
     * Import cover from OpenLibrary using the book's ISBN
     * @param bookId
     * @returns string OK
     * @throws ApiError
     */
    public static importCover(
        bookId: number,
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/books/{bookId}/cover/import',
            path: {
                'bookId': bookId,
            },
        });
    }
    /**
     * Get the cover thumbnail
     * @param bookId
     * @returns string OK
     * @throws ApiError
     */
    public static getCoverThumbnail(
        bookId: number,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/books/{bookId}/cover/thumbnail',
            path: {
                'bookId': bookId,
            },
        });
    }
}
