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

export const getService = (serviceId: string) => {
    switch (serviceId) {
        case CommonServiceIds.ExtensionDataService:
            return MockExtensionDataService
        case CommonServiceIds.GlobalMessagesService:
            return MockGlobalMessagesService
        case CommonServiceIds.HostNavigationService:
            return MockHostNavigationService
        case CommonServiceIds.HostPageLayoutService:
            return MockHostPageLayoutService
        case CommonServiceIds.LocationService:
            return MockLocationService
        case CommonServiceIds.ProjectPageService:
            return MockProjectPageService
        default:
            throw new Error('Unknown service id for mock:' + serviceId)
    }
};

export function getClient(clientClass: any) {
    switch (new clientClass().TYPE) {
        case 'AccountsRestClient':
            return new MockAccountsRestClient({}) as any;
        // case 'WikiRestClient':
        //   return new WikiRestClient({}) as any;
        // case 'GitRestClient':
        //   return new GitRestClient({}) as any;
        // case 'WorkItemTrackingProcessRestClient':
        //   return new WorkItemTrackingProcessRestClient({}) as any;
        // case 'WorkItemTrackingRestClient':
        //   return new WorkItemTrackingRestClient({}) as any;
        default:
            throw new Error('Failed to get mock client' + new clientClass().TYPE);
    }
}