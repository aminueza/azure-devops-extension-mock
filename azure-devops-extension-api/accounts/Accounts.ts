import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import { Account, AccountCreateInfoInternal } from "azure-devops-extension-api/Accounts";
import { faker } from "@faker-js/faker";
import { accounts } from "./Data";

/**
 * Mocked AccountsRestClient
 */
export class MockAccountsRestClient extends RestClientBase {
    public TYPE = 'AccountsRestClient';
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    createAccount(
        info: AccountCreateInfoInternal,
        usePrecreated?: boolean
    ): Promise<Account> {
        console.log(`Creating account with info: ${JSON.stringify(info)}, usePrecreated: ${usePrecreated}`)
        return new Promise((resolve) => resolve(faker.helpers.arrayElement(accounts)));
    }

    getAccount(accountId: string): Promise<Account> {
        console.log(`Getting account with id: ${accountId}`)
        return new Promise((resolve) => resolve(faker.helpers.arrayElement(accounts)));
    }

    getAccounts(
        ownerId?: string,
        memberId?: string,
        properties?: string
    ): Promise<Account[]> {
        console.log(`Getting accounts with ownerId: ${ownerId}, memberId: ${memberId}, properties: ${properties}`)
        return new Promise((resolve) => resolve(accounts));
    }

};