import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const SERVER_URL = 'http://localhost:8000'
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"