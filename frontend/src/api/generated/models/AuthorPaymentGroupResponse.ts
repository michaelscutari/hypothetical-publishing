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
     * Author's paypal.me username
     */
    paypalAccount?: string;
    /**
     * Author's Venmo username
     */
    venmoAccount?: string;
    /**
     * Total unpaid author royalty for this author
     */
    unpaidTotal: number;
    /**
     * Sales rows for this author
     */
    sales: Array<AuthorPaymentSaleResponse>;
};

