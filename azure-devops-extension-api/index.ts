import { CommonServiceIds } from "azure-devops-extension-api/Common";
import {
    MockExtensionDataService,
    MockGlobalMessagesService,
    MockHostNavigationService,
    MockHostPageLayoutService,
    MockLocationService,
    MockProjectPageService
} from "./common/CommonServices";
import { MockAccountsRestClient } from "./accounts/Accounts";
import { AccountsRestClient } from "azure-devops-extension-api/Accounts";
import { BoardsRestClient } from "azure-devops-extension-api/Boards";
import { MockBoardsRestClient } from "./boards/Boards";

export const getService = (serviceId: string) => {
    const serviceDictionary: { [key: string]: any } = {
        [CommonServiceIds.ExtensionDataService]: MockExtensionDataService,
        [CommonServiceIds.GlobalMessagesService]: MockGlobalMessagesService,
        [CommonServiceIds.HostNavigationService]: MockHostNavigationService,
        [CommonServiceIds.HostPageLayoutService]: MockHostPageLayoutService,
        [CommonServiceIds.LocationService]: MockLocationService,
        [CommonServiceIds.ProjectPageService]: MockProjectPageService,
    };

    if (serviceDictionary.hasOwnProperty(serviceId)) {
        return serviceDictionary[serviceId];
    } else {
        throw new Error('Unknown service id for mock: ' + serviceId);
    }
};

export function getClient(clientClass: any) {
    const clientTypes: { [key: string]: any } = {
        [typeof AccountsRestClient]: MockAccountsRestClient,
        [typeof BoardsRestClient]: MockBoardsRestClient,
    };

    const clientType = typeof new clientClass().TYPE;

    if (clientTypes.hasOwnProperty(clientType)) {
        const ClientConstructor = clientTypes[clientType];
        return new ClientConstructor({});
    } else {
        throw new Error('Failed to get mock client: ' + new clientClass().TYPE);
    }
}
