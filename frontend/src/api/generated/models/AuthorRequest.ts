/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request body for creating or updating an author
 */
export type AuthorRequest = {
    /**
     * Author name
     */
    name: string;
    /**
     * Author email
     */
    email: string;
    /**
     * Paypal.me account name
     */
    paypalAccount?: string;
    /**
     * Venmo account name
     */
    venmoAccount?: string;
};

