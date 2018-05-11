import dotenv from 'dotenv';

dotenv.config();

export const getEnv = variableName => process.env[variableName];

export const defaultBlockNumber = -1;

export const defaultFromBlockNumber = 0;

export const saveStateFileName = 'last-block-number.json';

export const watchingConfigPath = '.watch.yml';

export const networksById = {
    1: 'api',
    3: 'ropsten',
    4: 'rinkeby',
    42: 'kovan',
};

export const waitingTimeInMilliseconds = 10000;
export const promiseTimeoutInMilliseconds = 180000;

export const databaseCredentials = {
    connectionLimit: 10,
    host: "erc20tokendatabase.cs0t3mxmvoto.us-east-2.rds.amazonaws.com",
    database: "erc20TokenDatabase",
    user: "erc20TokenUser",
    password: "PJJ6vC8AS4F2sDsbSSXKCTdHHCUYDYWd",
    port: "3306"
};