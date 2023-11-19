import { CommonServiceIds } from "azure-devops-extension-api/Common";
import {
    MockExtensionDataService,
    MockGlobalMessagesService,
    MockHostNavigationService,
    MockHostPageLayoutService,
    MockLocationService,
    MockProjectPageService
} from "./CommonServices";

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