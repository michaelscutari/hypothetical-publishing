/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IngramImportRequest } from '../models/IngramImportRequest';
import type { IngramImportResponse } from '../models/IngramImportResponse';
import type { MarkAllPaidRequest } from '../models/MarkAllPaidRequest';
import type { MarkAllPaidResponse } from '../models/MarkAllPaidResponse';
import type { PagedResponseAuthorPaymentGroupResponse } from '../models/PagedResponseAuthorPaymentGroupResponse';
import type { PagedResponseSaleResponse } from '../models/PagedResponseSaleResponse';
import type { RoyaltyReportResponse } from '../models/RoyaltyReportResponse';
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
     * @param authorId
     * @param saleSource
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
        authorId?: number,
        saleSource?: string,
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
                'authorId': authorId,
                'saleSource': saleSource,
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
     * Previews a CSV import
     * @param formData
     * @returns IngramImportResponse OK
     * @throws ApiError
     */
    public static previewCsv(
        formData?: IngramImportRequest,
    ): CancelablePromise<IngramImportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sales/import',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Generates an author royalty report for a quarter range
     * @param authorId
     * @param startQuarter
     * @param startYear
     * @param endQuarter
     * @param endYear
     * @returns RoyaltyReportResponse OK
     * @throws ApiError
     */
    public static getRoyaltyReport(
        authorId: number,
        startQuarter: number,
        startYear: number,
        endQuarter: number,
        endYear: number,
    ): CancelablePromise<RoyaltyReportResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sales/royalty-report',
            query: {
                'authorId': authorId,
                'startQuarter': startQuarter,
                'startYear': startYear,
                'endQuarter': endQuarter,
                'endYear': endYear,
            },
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
