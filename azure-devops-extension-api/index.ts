import { CommonServiceIds } from "azure-devops-extension-api/Common";
import { AccountsRestClient } from "azure-devops-extension-api/Accounts";
import { WorkRestClient } from "azure-devops-extension-api/Work";
import { BuildRestClient } from "azure-devops-extension-api/Build";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { DashboardRestClient } from "azure-devops-extension-api/Dashboard";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { GraphRestClient } from "azure-devops-extension-api/Graph";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines";
import { PolicyRestClient } from "azure-devops-extension-api/Policy";
import { ReleaseRestClient } from "azure-devops-extension-api/Release";
import { ServiceEndpointRestClient } from "azure-devops-extension-api/ServiceEndpoint";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import { TestRestClient } from "azure-devops-extension-api/Test";
import { TfvcRestClient } from "azure-devops-extension-api/Tfvc";
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
import { MockGraphRestClient } from "./graph/Graph";
import { MockPipelinesRestClient } from "./pipelines/Pipelines";
import { MockPolicyRestClient } from "./policy/Policy";
import { MockReleaseRestClient } from "./release/Release";
import { MockServiceEndpointRestClient } from "./serviceEndpoint/ServiceEndpoint";
import { MockTaskAgentRestClient } from "./taskAgent/TaskAgent";
import { MockTestRestClient } from "./test/Test";
import { MockTfvcRestClient } from "./tfvc/Tfvc";
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
registerMockClient(WorkRestClient, MockBoardsRestClient as any);
registerMockClient(BuildRestClient, MockBuildRestClient as any);
registerMockClient(CoreRestClient, MockCoreRestClient as any);
registerMockClient(DashboardRestClient, MockDashboardRestClient as any);
registerMockClient(GitRestClient, MockGitRestClient as any);
registerMockClient(GraphRestClient, MockGraphRestClient as any);
registerMockClient(PipelinesRestClient, MockPipelinesRestClient as any);
registerMockClient(PolicyRestClient, MockPolicyRestClient as any);
registerMockClient(ReleaseRestClient, MockReleaseRestClient as any);
registerMockClient(ServiceEndpointRestClient, MockServiceEndpointRestClient as any);
registerMockClient(TaskAgentRestClient, MockTaskAgentRestClient as any);
registerMockClient(TestRestClient, MockTestRestClient as any);
registerMockClient(TfvcRestClient, MockTfvcRestClient as any);
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
    if (Object.prototype.hasOwnProperty.call(serviceDictionary, serviceId)) {
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
 * If a hand-written mock is registered for `clientClass`, its methods are
 * used. Any method of the real client that the mock does not implement
 * resolves to `undefined`, so every method of every client is callable.
 *
 * Pass `overrides` to pin specific method responses for a test.
 */
export function getClient<T extends object>(
    clientClass: new (...args: any[]) => T,
    overrides: MockOverrides<T> = {}
): T {
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
    MockGraphRestClient,
    MockPipelinesRestClient,
    MockPolicyRestClient,
    MockReleaseRestClient,
    MockServiceEndpointRestClient,
    MockTaskAgentRestClient,
    MockTestRestClient,
    MockTfvcRestClient,
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
