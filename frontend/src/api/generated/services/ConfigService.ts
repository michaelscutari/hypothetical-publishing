/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BrandingResponse } from '../models/BrandingResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConfigService {
    /**
     * Get publisher branding for white-label display
     * @returns BrandingResponse OK
     * @throws ApiError
     */
    public static getBranding(): CancelablePromise<BrandingResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/config/branding',
        });
    }
}
