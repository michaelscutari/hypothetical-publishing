/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request object for CSV import
 */
export type IngramImportRequest = {
    /**
     * The month in which the sale was made
     */
    saleMonth: number;
    /**
     * The year in which the sale was made
     */
    saleYear: number;
    csvFile: Blob;
    /**
     * Indicates if it is a preview request or not
     */
    isPreview: boolean;
};

