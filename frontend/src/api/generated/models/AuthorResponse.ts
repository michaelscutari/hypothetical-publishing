/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response body for an author
 */
export type AuthorResponse = {
    /**
     * Author id
     */
    id: number;
    /**
     * Author name
     */
    name: string;
    /**
     * Author email
     */
    email?: string;
    /**
     * Number of books written by the author
     */
    bookCount: number;
    /**
     * Total royalty earned by the author (both paid and unpaid)
     */
    totalRoyalty: number;
    /**
     * Total royalty paid to the author
     */
    paidRoyalty: number;
    /**
     * Total royalty unpaid to the author
     */
    unpaidRoyalty: number;
};

