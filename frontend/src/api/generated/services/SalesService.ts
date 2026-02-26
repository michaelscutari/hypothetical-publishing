/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MarkAllPaidRequest } from '../models/MarkAllPaidRequest';
import type { MarkAllPaidResponse } from '../models/MarkAllPaidResponse';
import type { PagedResponseAuthorPaymentGroupResponse } from '../models/PagedResponseAuthorPaymentGroupResponse';
import type { PagedResponseSaleResponse } from '../models/PagedResponseSaleResponse';
import type { SaleRequest } from '../models/SaleRequest';
import type { SaleResponse } from '../models/SaleResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SalesService {
    /**
     * Gets a sale by its ID
     * @param id
     * @returns SaleResponse OK
     * @throws ApiError
     */
    public static getSaleById(
        id: number,
    ): CancelablePromise<SaleResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sales/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Updates an existing sale
     * @param id
     * @param requestBody
     * @returns SaleResponse OK
     * @throws ApiError
     */
    public static updateSale(
        id: number,
        requestBody: SaleRequest,
    ): CancelablePromise<SaleResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/sales/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deletes an existing sale
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteSale(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/sales/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Marks all unpaid sales for an author as paid
     * @param requestBody
     * @returns MarkAllPaidResponse OK
     * @throws ApiError
     */
    public static markAuthorPaymentsPaid(
        requestBody: MarkAllPaidRequest,
    ): CancelablePromise<MarkAllPaidResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/sales/author-payments/mark-paid',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Retrieves all sales, paginated
     * @param page
     * @param size
     * @param showAll
     * @param sortField
     * @param sortDirection
     * @param startDate
     * @param endDate
     * @param query
     * @returns PagedResponseSaleResponse OK
     * @throws ApiError
     */
    public static getSales(
        page?: number,
        size: number = 25,
        showAll: boolean = false,
        sortField?: string,
        sortDirection: string = 'asc',
        startDate?: string,
        endDate?: string,
        query?: string,
    ): CancelablePromise<PagedResponseSaleResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sales',
            query: {
                'page': page,
                'size': size,
                'showAll': showAll,
                'sortField': sortField,
                'sortDirection': sortDirection,
                'startDate': startDate,
                'endDate': endDate,
                'query': query,
            },
        });
    }
    /**
     * Creates a new sale
     * @param requestBody
     * @returns SaleResponse OK
     * @throws ApiError
     */
    public static createSale(
        requestBody: SaleRequest,
    ): CancelablePromise<SaleResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sales',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Gets grouped author payments view
     * @param page
     * @param size
     * @param showAll
     * @param startDate
     * @param endDate
     * @param query
     * @returns PagedResponseAuthorPaymentGroupResponse OK
     * @throws ApiError
     */
    public static getAuthorPayments(
        page?: number,
        size: number = 25,
        showAll: boolean = false,
        startDate?: string,
        endDate?: string,
        query?: string,
    ): CancelablePromise<PagedResponseAuthorPaymentGroupResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sales/author-payments',
            query: {
                'page': page,
                'size': size,
                'showAll': showAll,
                'startDate': startDate,
                'endDate': endDate,
                'query': query,
            },
        });
    }
}
