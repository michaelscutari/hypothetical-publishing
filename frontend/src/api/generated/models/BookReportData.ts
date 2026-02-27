/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuarterBookData } from './QuarterBookData';
import type { TotalReportData } from './TotalReportData';
/**
 * Book data in the royalty report
 */
export type BookReportData = {
    /**
     * Book ID
     */
    bookId?: number;
    /**
     * Book title
     */
    title?: string;
    /**
     * Series name
     */
    seriesName?: string;
    /**
     * Series position
     */
    seriesPosition?: number;
    /**
     * Publication year
     */
    publicationYear?: number;
    /**
     * Publication month
     */
    publicationMonth?: number;
    /**
     * Quarterly data for this book
     */
    quarters?: Array<QuarterBookData>;
    totals?: TotalReportData;
};

