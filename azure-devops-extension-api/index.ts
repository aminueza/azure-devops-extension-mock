import { CommonServiceIds } from "azure-devops-extension-api/Common";
import { AccountsRestClient } from "azure-devops-extension-api/Accounts";
import { WorkRestClient } from "azure-devops-extension-api/Work";
import { BuildRestClient } from "azure-devops-extension-api/Build";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { DashboardRestClient } from "azure-devops-extension-api/Dashboard";
import { FileContainerRestClient } from "azure-devops-extension-api/FileContainer";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { GraphRestClient } from "azure-devops-extension-api/Graph";
import { OperationsRestClient } from "azure-devops-extension-api/Operations";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines";
import { PolicyRestClient } from "azure-devops-extension-api/Policy";
import { ProjectAnalysisRestClient } from "azure-devops-extension-api/ProjectAnalysis";
import { ReleaseRestClient } from "azure-devops-extension-api/Release";
import { ResourceUsageRestClient } from "azure-devops-extension-api/ResourceUsage";
import { ServiceEndpointRestClient } from "azure-devops-extension-api/ServiceEndpoint";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import { TestRestClient } from "azure-devops-extension-api/Test";
import { TestPlanRestClient } from "azure-devops-extension-api/TestPlan";
import { TestResultsRestClient } from "azure-devops-extension-api/TestResults";
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
import { MockFileContainerRestClient } from "./fileContainer/FileContainer";
import { MockGitRestClient } from "./git/Git";
import { MockGraphRestClient } from "./graph/Graph";
import { MockOperationsRestClient } from "./operations/Operations";
import { MockPipelinesRestClient } from "./pipelines/Pipelines";
import { MockPolicyRestClient } from "./policy/Policy";
import { MockProjectAnalysisRestClient } from "./projectAnalysis/ProjectAnalysis";
import { MockReleaseRestClient } from "./release/Release";
import { MockResourceUsageRestClient } from "./resourceUsage/ResourceUsage";
import { MockServiceEndpointRestClient } from "./serviceEndpoint/ServiceEndpoint";
import { MockTaskAgentRestClient } from "./taskAgent/TaskAgent";
import { MockTestRestClient } from "./test/Test";
import { MockTestPlanRestClient } from "./testPlan/TestPlan";
import { MockTestResultsRestClient } from "./testResults/TestResults";
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
registerMockClient(AccountsRestClient, MockAccountsRestClient);
registerMockClient(WorkRestClient, MockBoardsRestClient);
registerMockClient(BuildRestClient, MockBuildRestClient);
registerMockClient(CoreRestClient, MockCoreRestClient);
registerMockClient(DashboardRestClient, MockDashboardRestClient);
registerMockClient(FileContainerRestClient, MockFileContainerRestClient);
registerMockClient(GitRestClient, MockGitRestClient);
registerMockClient(GraphRestClient, MockGraphRestClient);
registerMockClient(OperationsRestClient, MockOperationsRestClient);
registerMockClient(PipelinesRestClient, MockPipelinesRestClient);
registerMockClient(PolicyRestClient, MockPolicyRestClient);
registerMockClient(ProjectAnalysisRestClient, MockProjectAnalysisRestClient);
registerMockClient(ReleaseRestClient, MockReleaseRestClient);
registerMockClient(ResourceUsageRestClient, MockResourceUsageRestClient);
registerMockClient(ServiceEndpointRestClient, MockServiceEndpointRestClient);
registerMockClient(TaskAgentRestClient, MockTaskAgentRestClient);
registerMockClient(TestRestClient, MockTestRestClient);
registerMockClient(TestPlanRestClient, MockTestPlanRestClient);
registerMockClient(TestResultsRestClient, MockTestResultsRestClient);
registerMockClient(TfvcRestClient, MockTfvcRestClient);
registerMockClient(WikiRestClient, MockWikiRestClient);
registerMockClient(WorkItemTrackingRestClient, MockWorkItemTrackingRestClient);

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
    return mockClient(clientClass, overrides);
}

export { mockClient, registerMockClient, getRegisteredMockClient, MockOverrides };

// Re-export mock clients for direct import.
export {
    MockAccountsRestClient,
    MockBoardsRestClient,
    MockBuildRestClient,
    MockCoreRestClient,
    MockDashboardRestClient,
    MockFileContainerRestClient,
    MockGitRestClient,
    MockGraphRestClient,
    MockOperationsRestClient,
    MockPipelinesRestClient,
    MockPolicyRestClient,
    MockProjectAnalysisRestClient,
    MockReleaseRestClient,
    MockResourceUsageRestClient,
    MockServiceEndpointRestClient,
    MockTaskAgentRestClient,
    MockTestRestClient,
    MockTestPlanRestClient,
    MockTestResultsRestClient,
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
