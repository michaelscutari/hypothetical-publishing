/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParsingError } from './ParsingError';
import type { SaleResponse } from './SaleResponse';
/**
 * Response after uploading an ingram CSV for either preview or saving.
 */
export type IngramImportResponse = {
    /**
     * List of sales that are going to be or were saved
     */
    savedSales: Array<SaleResponse>;
    /**
     * List of errors in the csv file
     */
    csvErrors: Array<ParsingError>;
    /**
     * List of errors when mapping rows to Sale objects
     */
    savingErrors: Array<ParsingError>;
};

