/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportBookRow } from './ReportBookRow';
/**
 * One fiscal quarter in the royalty report
 */
export type QuarterSection = {
    /**
     * Quarter number (1-4)
     */
    quarter: number;
    /**
     * Year
     */
    year: number;
    /**
     * Book rows for this quarter
     */
    books: Array<ReportBookRow>;
    totals: ReportBookRow;
};

