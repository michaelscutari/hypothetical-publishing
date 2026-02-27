/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TotalReportData } from './TotalReportData';
/**
 * Book sales data for a specific quarter
 */
export type QuarterBookData = {
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

