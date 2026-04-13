/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request object for sales import
 */
export type SalesImportRequest = {
    /**
     * Explicit import type used to disambiguate supported file formats
     */
    importType?: SalesImportRequest.importType;
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
export namespace SalesImportRequest {
    /**
     * Explicit import type used to disambiguate supported file formats
     */
    export enum importType {
        INGRAM_CSV = 'INGRAM_CSV',
        AMAZON_XLSX = 'AMAZON_XLSX',
        BACKERKIT_XLSX = 'BACKERKIT_XLSX',
    }
}

