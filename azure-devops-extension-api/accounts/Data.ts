import { fake } from "../common/fixtures";
import { Account, AccountStatus, AccountType } from "azure-devops-extension-api/Accounts";

/**
 * Mocked AccountsRestClient data
 */
export const accounts = Array.from({ length: 10 }, () => (
    {
        accountId: fake.string.uuid(),
        accountName: fake.lorem.slug(),
        accountOwner: fake.internet.username(),
        accountStatus: fake.helpers.arrayElement([
            AccountStatus.None,
            AccountStatus.Enabled,
            AccountStatus.Disabled,
            AccountStatus.Deleted,
            AccountStatus.Moved]),
        accountType: fake.helpers.arrayElement([
            AccountType.Personal,
            AccountType.Organization]),
        accountUri: fake.internet.url(),
        createdBy: fake.internet.username(),
        createdDate: fake.date.past(),
        hasMoved: fake.datatype.boolean(),
        lastUpdatedBy: fake.internet.username(),
        lastUpdatedDate: fake.date.past(),
        namespaceId: fake.string.uuid(),
        newCollectionId: fake.string.uuid(),
        organizationName: fake.lorem.slug(),
        properties: {
            "key": "value"
        },
        statusReason: fake.lorem.sentence()
    } as Account));
