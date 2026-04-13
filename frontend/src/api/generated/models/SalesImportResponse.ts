/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParsingError } from './ParsingError';
import type { SaleResponse } from './SaleResponse';
/**
 * Response after importing sales for either preview or saving.
 */
export type SalesImportResponse = {
    /**
     * List of sales that are going to be or were saved
     */
    savedSales: Array<SaleResponse>;
    /**
     * List of file parsing errors
     */
    parseErrors: Array<ParsingError>;
    /**
     * List of validation errors when mapping rows to Sale objects
     */
    validationErrors: Array<ParsingError>;
    /**
     * List of non-blocking warnings
     */
    warnings: Array<ParsingError>;
    /**
     * Deduplicated unknown Kickstarter item tags
     */
    unknownItemTags: Array<string>;
    /**
     * Rows with unsuccessful pledge status
     */
    unsuccessfulPledgeRows: Array<number>;
};

