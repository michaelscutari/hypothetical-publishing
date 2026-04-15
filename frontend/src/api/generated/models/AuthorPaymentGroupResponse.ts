/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorPaymentSaleResponse } from './AuthorPaymentSaleResponse';
/**
 * Grouped author payments response
 */
export type AuthorPaymentGroupResponse = {
    /**
     * Author ID
     */
    authorId: number;
    /**
     * Author name
     */
    author: string;
    /**
     * Total unpaid author royalty for this author
     */
    unpaidTotal: number;
    /**
     * Total unpaid projected author royalty for this author (not eligible for payment)
     */
    projectedUnpaidTotal: number;
    /**
     * Sales rows for this author
     */
    sales: Array<AuthorPaymentSaleResponse>;
};

