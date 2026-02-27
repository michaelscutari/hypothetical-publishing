/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BookReportData } from './BookReportData';
import type { QuarterReportData } from './QuarterReportData';
import type { TotalReportData } from './TotalReportData';
/**
 * Author royalty report data
 */
export type AuthorRoyaltyReportResponse = {
    /**
     * Author ID
     */
    authorId?: number;
    /**
     * Author name
     */
    authorName?: string;
    /**
     * Author email
     */
    authorEmail?: string;
    /**
     * Report generation date
     */
    generatedDate?: string;
    /**
     * Start quarter (1-4)
     */
    startQuarter?: number;
    /**
     * Start year
     */
    startYear?: number;
    /**
     * End quarter (1-4)
     */
    endQuarter?: number;
    /**
     * End year
     */
    endYear?: number;
    /**
     * Books in the report
     */
    books?: Array<BookReportData>;
    /**
     * Quarterly breakdowns
     */
    quarters?: Array<QuarterReportData>;
    allTimeTotals?: TotalReportData;
};

