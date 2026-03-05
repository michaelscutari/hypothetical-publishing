/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AllTimeTotals } from './AllTimeTotals';
import type { QuarterSection } from './QuarterSection';
/**
 * Full author royalty report
 */
export type RoyaltyReportResponse = {
    /**
     * Author name
     */
    author: string;
    /**
     * Start quarter (1-4)
     */
    startQuarter: number;
    /**
     * Start year
     */
    startYear: number;
    /**
     * End quarter (1-4)
     */
    endQuarter: number;
    /**
     * End year
     */
    endYear: number;
    /**
     * Quarter-by-quarter sections
     */
    quarters: Array<QuarterSection>;
    allTime: AllTimeTotals;
};

