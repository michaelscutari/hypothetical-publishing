/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TotalReportData } from './TotalReportData';
/**
 * Quarter totals across all books
 */
export type QuarterReportData = {
    /**
     * Quarter (1-4)
     */
    quarter?: number;
    /**
     * Year
     */
    year?: number;
    totals?: TotalReportData;
};

