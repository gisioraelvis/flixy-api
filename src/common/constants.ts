import * as dotenv from 'dotenv';
dotenv.config();

const EMAIL_CONFIRMATION_URL = `${process.env.HOST}:${process.env.PORT}/v1/confirm-email`;
const EMAIL_PASSWORD_RESET_URL = `${process.env.HOST}:${process.env.PORT}/v1/reset-password`;

console.log(process.env.HOST);
