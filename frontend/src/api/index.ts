import { OpenAPI } from './generated';

OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = 'include';
OpenAPI.BASE = '';

export * from './generated';
