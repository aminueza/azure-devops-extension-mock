import { AccountsRestClient, AccountStatus, AccountType } from "azure-devops-extension-api/Accounts";
import { getClient } from "../azure-devops-extension-api";

describe("AccountsRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(AccountsRestClient);

    it("is registered under the AccountsRestClient type", () => {
        expect((client as any).TYPE).toBe(AccountsRestClient);
    });

    it("lists accounts with well-formed entries", async () => {
        const accounts = await client.getAccounts();
        expect(accounts.length).toBeGreaterThan(0);
        for (const account of accounts) {
            expect(typeof account.accountId).toBe("string");
            expect(typeof account.accountName).toBe("string");
            expect(Object.values(AccountStatus)).toContain(account.accountStatus);
            expect(Object.values(AccountType)).toContain(account.accountType);
            expect(account.createdDate).toBeInstanceOf(Date);
            expect(account.properties).toEqual({ key: "value" });
        }
    });

    it("fills every member of each account", async () => {
        const accounts = await client.getAccounts();
        expect(accounts).toHaveLength(10);
        for (const account of accounts) {
            expect(typeof account.accountOwner).toBe("string");
            expect(account.accountUri).toMatch(/^https:/);
            expect(typeof account.createdBy).toBe("string");
            expect(typeof account.hasMoved).toBe("boolean");
            expect(typeof account.lastUpdatedBy).toBe("string");
            expect(account.lastUpdatedDate).toBeInstanceOf(Date);
            expect(account.namespaceId).toMatch(/^[0-9a-f-]{36}$/);
            expect(account.newCollectionId).toMatch(/^[0-9a-f-]{36}$/);
            expect(typeof account.organizationName).toBe("string");
            expect(typeof account.statusReason).toBe("string");
        }
    });

    it("returns the same list regardless of filters", async () => {
        const unfiltered = await client.getAccounts();
        const filtered = await client.getAccounts("owner", "member", "props");
        expect(filtered).toBe(unfiltered);
    });

    it("gets an account from the fixture set", async () => {
        const all = await client.getAccounts();
        const account = await client.getAccount("any-id");
        expect(all).toContain(account);
    });

    it("creates an account from the fixture set", async () => {
        const all = await client.getAccounts();
        const created = await client.createAccount({ accountName: "new" } as any, true);
        expect(all).toContain(created);
        const createdDefault = await client.createAccount({ accountName: "new" } as any);
        expect(all).toContain(createdDefault);
    });
});
