/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Book detail response data - includes book financials
 */
export type BookDetailResponse = {
    /**
     * Unique book identifier
     */
    id: number;
    /**
     * Book title
     */
    title: string;
    /**
     * Author name
     */
    author: string;
    /**
     * Author Id
     */
    authorId: number;
    /**
     * ISBN-13 identifier
     */
    isbn13: string;
    /**
     * ISBN-10 identifier
     */
    isbn10?: string;
    /**
     * Publication year
     */
    publicationYear: number;
    /**
     * Publication month (1-12)
     */
    publicationMonth: number;
    /**
     * Distributor author royalty rate
     */
    distributorAuthorRoyaltyRate: number;
    /**
     * Handsold/Kickstarter author royalty rate
     */
    handsoldAuthorRoyaltyRate: number;
    /**
     * Series name
     */
    seriesName?: string;
    /**
     * Series position
     */
    seriesPosition?: number;
    /**
     * Cover price (USD)
     */
    coverPrice: number;
    /**
     * Print cost (USD)
     */
    printCost: number;
    /**
     * Amazon Ebook ASIN
     */
    amazonEbookAsin?: string;
    /**
     * Whether this book has been released
     */
    released: boolean;
    /**
     * Kickstarter item tag for ebook edition
     */
    kickstarterItemTagEbook?: string;
    /**
     * Kickstarter item tag for print edition
     */
    kickstarterItemTagPrint?: string;
    /**
     * Total sales quantity to date
     */
    totalSalesToDate: number;
    /**
     * Total publisher revenue earned from this book
     */
    revenue: number;
    /**
     * Total author unpaid royalty from the book
     */
    unpaidRoyalty: number;
    /**
     * Total author paid royalty from the book
     */
    paidRoyalty: number;
    /**
     * Total royalty earned by the author (both paid and unpaid)
     */
    totalRoyalty: number;
    /**
     * Whether this book has a cover image
     */
    hasCover: boolean;
};

