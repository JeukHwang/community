import * as dotenv from 'dotenv';
dotenv.config();

export const isDev = process.env.NODE_ENV === 'development';
