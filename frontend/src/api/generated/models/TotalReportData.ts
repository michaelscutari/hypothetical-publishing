/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Aggregated sales data
 */
export type TotalReportData = {
    /**
     * Total quantity sold
     */
    quantitySold?: number;
    /**
     * Total quantity handsold (subset of quantitySold)
     */
    quantityHandsold?: number;
    /**
     * Unpaid author royalty
     */
    authorRoyaltyUnpaid?: number;
    /**
     * Paid author royalty
     */
    authorRoyaltyPaid?: number;
    /**
     * Total author royalty (paid + unpaid)
     */
    authorRoyaltyTotal?: number;
};

