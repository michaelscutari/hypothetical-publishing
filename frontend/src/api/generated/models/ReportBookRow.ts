/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A single book row in a royalty report quarter or all-time section
 */
export type ReportBookRow = {
    /**
     * Display name — series name (position) or standalone title
     */
    displayName: string;
    /**
     * Book title
     */
    title?: string;
    /**
     * Series name (null if not part of a series)
     */
    seriesName?: string;
    /**
     * Position in series (null if not part of a series)
     */
    seriesPosition?: number;
    /**
     * Total quantity sold
     */
    quantity: number;
    /**
     * Quantity from handsold source
     */
    handsold: number;
    /**
     * Unpaid author royalty
     */
    unpaidRoyalty: number;
    /**
     * Paid author royalty
     */
    paidRoyalty: number;
    /**
     * Total author royalty (paid + unpaid)
     */
    totalRoyalty: number;
};

