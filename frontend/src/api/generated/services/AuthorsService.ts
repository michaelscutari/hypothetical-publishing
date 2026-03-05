/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorRequest } from '../models/AuthorRequest';
import type { AuthorResponse } from '../models/AuthorResponse';
import type { PagedResponseAuthorResponse } from '../models/PagedResponseAuthorResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthorsService {
    /**
     * Get an author by id
     * @param id
     * @returns AuthorResponse OK
     * @throws ApiError
     */
    public static getAuthorById(
        id: number,
    ): CancelablePromise<AuthorResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/authors/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update an existing author
     * @param id
     * @param requestBody
     * @returns AuthorResponse OK
     * @throws ApiError
     */
    public static updateAuthor(
        id: number,
        requestBody: AuthorRequest,
    ): CancelablePromise<AuthorResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/authors/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete an author
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteAuthor(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/authors/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get paged list of authors (search by name/email)
     * @param page
     * @param size
     * @param showAll
     * @param query
     * @param sortField
     * @param sortDirection
     * @returns PagedResponseAuthorResponse OK
     * @throws ApiError
     */
    public static getAllAuthors(
        page?: number,
        size: number = 25,
        showAll: boolean = false,
        query?: string,
        sortField?: Array<string>,
        sortDirection?: Array<string>,
    ): CancelablePromise<PagedResponseAuthorResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/authors',
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
     * Creates a new author
     * @param requestBody
     * @returns AuthorResponse Created
     * @throws ApiError
     */
    public static createAuthor(
        requestBody: AuthorRequest,
    ): CancelablePromise<AuthorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/authors',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
