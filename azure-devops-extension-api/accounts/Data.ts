import { faker } from "@faker-js/faker";
import { Account, AccountStatus, AccountType } from "azure-devops-extension-api/Accounts";

/**
 * Mocked AccountsRestClient data
 */
export const accounts = Array.from({ length: 10 }, () => (
    {
        accountId: faker.string.uuid(),
        accountName: faker.lorem.slug(),
        accountOwner: faker.internet.userName(),
        accountStatus: faker.helpers.arrayElement([
            AccountStatus.None,
            AccountStatus.Enabled,
            AccountStatus.Disabled,
            AccountStatus.Deleted,
            AccountStatus.Moved]),
        accountType: faker.helpers.arrayElement([
            AccountType.Personal,
            AccountType.Organization]),
        accountUri: faker.internet.url(),
        createdBy: faker.internet.userName(),
        createdDate: faker.date.past(),
        hasMoved: faker.datatype.boolean(),
        lastUpdatedBy: faker.internet.userName(),
        lastUpdatedDate: faker.date.past(),
        namespaceId: faker.string.uuid(),
        newCollectionId: faker.string.uuid(),
        organizationName: faker.lorem.slug(),
        properties: {
            "key": "value"
        },
        statusReason: faker.lorem.sentence()
    } as Account));
