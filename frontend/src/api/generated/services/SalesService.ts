/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MarkAllPaidRequest } from '../models/MarkAllPaidRequest';
import type { MarkAllPaidResponse } from '../models/MarkAllPaidResponse';
import type { PagedResponseAuthorPaymentGroupResponse } from '../models/PagedResponseAuthorPaymentGroupResponse';
import type { PagedResponseSaleResponse } from '../models/PagedResponseSaleResponse';
import type { RoyaltyReportResponse } from '../models/RoyaltyReportResponse';
import type { SaleRequest } from '../models/SaleRequest';
import type { SaleResponse } from '../models/SaleResponse';
import type { SalesImportRequest } from '../models/SalesImportRequest';
import type { SalesImportResponse } from '../models/SalesImportResponse';
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
     * @param distributor
     * @param format
     * @param query
     * @param bookId
     * @returns PagedResponseSaleResponse OK
     * @throws ApiError
     */
    public static getSales(
        page?: number,
        size: number = 25,
        showAll: boolean = false,
        sortField?: Array<string>,
        sortDirection?: Array<string>,
        startDate?: string,
        endDate?: string,
        authorId?: number,
        saleSource?: 'DISTRIBUTOR' | 'HAND_SOLD' | 'KICKSTARTER',
        distributor?: 'INGRAM_SPARK' | 'AMAZON' | 'OTHER',
        format?: 'PRINT' | 'EBOOK' | 'KINDLE_UNLIMITED',
        query?: string,
        bookId?: number,
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
                'distributor': distributor,
                'format': format,
                'query': query,
                'bookId': bookId,
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
     * Imports or previews a CSV file
     * @param formData
     * @returns SalesImportResponse OK
     * @throws ApiError
     */
    public static importCsv(
        formData?: SalesImportRequest,
    ): CancelablePromise<SalesImportResponse> {
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
     * @param includeEmptyQuarters
     * @returns RoyaltyReportResponse OK
     * @throws ApiError
     */
    public static getRoyaltyReport(
        authorId: number,
        startQuarter: number,
        startYear: number,
        endQuarter: number,
        endYear: number,
        includeEmptyQuarters: boolean = false,
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
                'includeEmptyQuarters': includeEmptyQuarters,
            },
        });
    }
    /**
     * Exports publisher profit totals by quarter range as XLSX
     * @param startQuarter
     * @param startYear
     * @param endQuarter
     * @param endYear
     * @returns any OK
     * @throws ApiError
     */
    public static exportPublisherProfitReport(
        startQuarter: number,
        startYear: number,
        endQuarter: number,
        endYear: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sales/reports/publisher-profit',
            query: {
                'startQuarter': startQuarter,
                'startYear': startYear,
                'endQuarter': endQuarter,
                'endYear': endYear,
            },
        });
    }
    /**
     * Exports Amazon lifetime sales data as XLSX
     * @returns any OK
     * @throws ApiError
     */
    public static exportAmazonSalesReport(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sales/reports/amazon-sales',
        });
    }
    /**
     * Exports all authors royalty totals by quarter range as XLSX
     * @param startQuarter
     * @param startYear
     * @param endQuarter
     * @param endYear
     * @returns any OK
     * @throws ApiError
     */
    public static exportAllAuthorsRoyaltyReport(
        startQuarter: number,
        startYear: number,
        endQuarter: number,
        endYear: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sales/reports/all-authors-royalty',
            query: {
                'startQuarter': startQuarter,
                'startYear': startYear,
                'endQuarter': endQuarter,
                'endYear': endYear,
            },
        });
    }
    /**
     * Exports filtered sales as CSV
     * @param startDate
     * @param endDate
     * @param authorId
     * @param saleSource
     * @param distributor
     * @param format
     * @param query
     * @param bookId
     * @returns any OK
     * @throws ApiError
     */
    public static exportSalesCsv(
        startDate?: string,
        endDate?: string,
        authorId?: number,
        saleSource?: 'DISTRIBUTOR' | 'HAND_SOLD' | 'KICKSTARTER',
        distributor?: 'INGRAM_SPARK' | 'AMAZON' | 'OTHER',
        format?: 'PRINT' | 'EBOOK' | 'KINDLE_UNLIMITED',
        query?: string,
        bookId?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sales/export',
            query: {
                'startDate': startDate,
                'endDate': endDate,
                'authorId': authorId,
                'saleSource': saleSource,
                'distributor': distributor,
                'format': format,
                'query': query,
                'bookId': bookId,
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
