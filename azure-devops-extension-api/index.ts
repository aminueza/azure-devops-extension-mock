import { CommonServiceIds } from "azure-devops-extension-api/Common";
import { AccountsRestClient } from "azure-devops-extension-api/Accounts";
import { BoardsRestClient } from "azure-devops-extension-api/Boards";
import { BuildRestClient } from "azure-devops-extension-api/Build";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { DashboardRestClient } from "azure-devops-extension-api/Dashboard";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines/PipelinesClient";
import { ReleaseRestClient } from "azure-devops-extension-api/Release";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import { TestRestClient } from "azure-devops-extension-api/Test";
import { WikiRestClient } from "azure-devops-extension-api/Wiki";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";

import {
    MockExtensionDataService,
    MockGlobalMessagesService,
    MockHostNavigationService,
    MockHostPageLayoutService,
    MockLocationService,
    MockProjectPageService
} from "./common/CommonServices";
import { MockAccountsRestClient } from "./accounts/Accounts";
import { MockBoardsRestClient } from "./boards/Boards";
import { MockBuildRestClient } from "./build/Build";
import { MockCoreRestClient } from "./core/Core";
import { MockDashboardRestClient } from "./dashboard/Dashboard";
import { MockGitRestClient } from "./git/Git";
import { MockPipelinesRestClient } from "./pipelines/Pipelines";
import { MockReleaseRestClient } from "./release/Release";
import { MockTaskAgentRestClient } from "./taskAgent/TaskAgent";
import { MockTestRestClient } from "./test/Test";
import { MockWikiRestClient } from "./wiki/Wiki";
import { MockWorkItemTrackingRestClient } from "./workItemTracking/WorkItemTracking";

import {
    registerMockClient,
    getRegisteredMockClient,
    mockClient,
    MockOverrides
} from "./factory";

// Register the real → mock client mapping once at module load.
registerMockClient(AccountsRestClient, MockAccountsRestClient as any);
registerMockClient(BoardsRestClient, MockBoardsRestClient as any);
registerMockClient(BuildRestClient, MockBuildRestClient as any);
registerMockClient(CoreRestClient, MockCoreRestClient as any);
registerMockClient(DashboardRestClient, MockDashboardRestClient as any);
registerMockClient(GitRestClient, MockGitRestClient as any);
registerMockClient(PipelinesRestClient, MockPipelinesRestClient as any);
registerMockClient(ReleaseRestClient, MockReleaseRestClient as any);
registerMockClient(TaskAgentRestClient, MockTaskAgentRestClient as any);
registerMockClient(TestRestClient, MockTestRestClient as any);
registerMockClient(WikiRestClient, MockWikiRestClient as any);
registerMockClient(WorkItemTrackingRestClient, MockWorkItemTrackingRestClient as any);

const serviceDictionary: { [key: string]: any } = {
    [CommonServiceIds.ExtensionDataService]: MockExtensionDataService,
    [CommonServiceIds.GlobalMessagesService]: MockGlobalMessagesService,
    [CommonServiceIds.HostNavigationService]: MockHostNavigationService,
    [CommonServiceIds.HostPageLayoutService]: MockHostPageLayoutService,
    [CommonServiceIds.LocationService]: MockLocationService,
    [CommonServiceIds.ProjectPageService]: MockProjectPageService
};

/**
 * Returns a mock implementation for a given service id. Register additional
 * services via `registerMockService`.
 */
export const getService = <T = any>(serviceId: string): T => {
    if (serviceDictionary.hasOwnProperty(serviceId)) {
        return serviceDictionary[serviceId] as T;
    }
    throw new Error(`Unknown service id for mock: ${serviceId}`);
};

export const registerMockService = (serviceId: string, service: unknown): void => {
    serviceDictionary[serviceId] = service;
};

/**
 * Returns a mock REST client for the given real client class.
 *
 * If a hand-written mock is registered for `clientClass`, a fresh instance is
 * returned. Otherwise the real class is auto-stubbed via `mockClient` so every
 * method returns `Promise.resolve(undefined)`.
 *
 * Pass `overrides` to pin specific method responses for a test.
 */
export function getClient<T extends object>(
    clientClass: new (...args: any[]) => T,
    overrides: MockOverrides<T> = {}
): T {
    const registered = getRegisteredMockClient(clientClass as any);
    if (registered) {
        const instance = new (registered as any)({});
        if (Object.keys(overrides).length === 0) {
            return instance as T;
        }
        return mockClient(clientClass as any, overrides) as unknown as T;
    }
    return mockClient(clientClass as any, overrides) as unknown as T;
}

export { mockClient, registerMockClient, getRegisteredMockClient, MockOverrides };

// Re-export mock clients for direct import.
export {
    MockAccountsRestClient,
    MockBoardsRestClient,
    MockBuildRestClient,
    MockCoreRestClient,
    MockDashboardRestClient,
    MockGitRestClient,
    MockPipelinesRestClient,
    MockReleaseRestClient,
    MockTaskAgentRestClient,
    MockTestRestClient,
    MockWikiRestClient,
    MockWorkItemTrackingRestClient
};

// Re-export service mocks.
export {
    MockExtensionDataService,
    MockGlobalMessagesService,
    MockHostNavigationService,
    MockHostPageLayoutService,
    MockLocationService,
    MockProjectPageService
};
