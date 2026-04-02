/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CurrencyConversionResponse } from '../models/CurrencyConversionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CurrencyService {
    /**
     * Convert an amount between currencies
     * @param from
     * @param to
     * @param amount
     * @returns CurrencyConversionResponse OK
     * @throws ApiError
     */
    public static convertCurrency(
        from: string,
        to: string,
        amount: number,
    ): CancelablePromise<CurrencyConversionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/currency/convert',
            query: {
                'from': from,
                'to': to,
                'amount': amount,
            },
        });
    }
}
