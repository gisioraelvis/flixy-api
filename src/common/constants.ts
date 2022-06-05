import * as dotenv from 'dotenv';
dotenv.config();

export const EMAIL_CONFIRMATION_URL = `${process.env.HOST}:${process.env.PORT}/v1/confirm-email`;
