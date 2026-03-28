/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request object for sales import
 */
export type SalesImportRequest = {
    /**
     * The month in which the sale was made (required for CSV)
     */
    saleMonth?: number;
    /**
     * The year in which the sale was made (required for CSV)
     */
    saleYear?: number;
    importFile: Blob;
    /**
     * Indicates if it is a preview request or not
     */
    isPreview: boolean;
    /**
     * Required to commit when non-blocking warnings are present
     */
    acknowledgeWarnings?: boolean;
};

