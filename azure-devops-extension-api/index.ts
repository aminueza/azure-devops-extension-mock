import { CommonServiceIds } from "azure-devops-extension-api/Common";
import { AccountsRestClient } from "azure-devops-extension-api/Accounts";
import { ReportingRestClient } from "azure-devops-extension-api/AdvancedSecurity.Reporting";
import { AlertRestClient } from "azure-devops-extension-api/Alert";
import { WorkRestClient } from "azure-devops-extension-api/Work";
import { BuildRestClient } from "azure-devops-extension-api/Build";
import { ContributionsRestClient } from "azure-devops-extension-api/Contributions";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { DashboardRestClient } from "azure-devops-extension-api/Dashboard";
import { FileContainerRestClient } from "azure-devops-extension-api/FileContainer";
import { ExtensionManagementRestClient } from "azure-devops-extension-api/ExtensionManagement";
import { FeatureAvailabilityRestClient } from "azure-devops-extension-api/FeatureAvailability";
import { FeatureManagementRestClient } from "azure-devops-extension-api/FeatureManagement";
import { GalleryRestClient } from "azure-devops-extension-api/Gallery";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { GraphRestClient } from "azure-devops-extension-api/Graph";
import { OperationsRestClient } from "azure-devops-extension-api/Operations";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines";
import { PolicyRestClient } from "azure-devops-extension-api/Policy";
import { ProjectAnalysisRestClient } from "azure-devops-extension-api/ProjectAnalysis";
import { FavoriteRestClient } from "azure-devops-extension-api/Favorite";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { GraphRestClient } from "azure-devops-extension-api/Graph";
import { LocationsRestClient } from "azure-devops-extension-api/Locations";
import { ManagementRestClient } from "azure-devops-extension-api/Management";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines";
import { PolicyRestClient } from "azure-devops-extension-api/Policy";
import { ProfileRestClient } from "azure-devops-extension-api/Profile";
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
import { WorkItemTrackingProcessDefinitionsRestClient } from "azure-devops-extension-api/WorkItemTrackingProcessDefinitions";
import { WorkItemTrackingProcessRestClient } from "azure-devops-extension-api/WorkItemTrackingProcess";

import {
    MockExtensionDataService,
    MockGlobalMessagesService,
    MockHostNavigationService,
    MockHostPageLayoutService,
    MockLocationService,
    MockProjectPageService
} from "./common/CommonServices";
import { MockAccountsRestClient } from "./accounts/Accounts";
import { MockReportingRestClient } from "./advancedSecurityReporting/Reporting";
import { MockAlertRestClient } from "./alert/Alert";
import { MockBoardsRestClient } from "./boards/Boards";
import { MockBuildRestClient } from "./build/Build";
import { MockContributionsRestClient } from "./contributions/Contributions";
import { MockCoreRestClient } from "./core/Core";
import { MockDashboardRestClient } from "./dashboard/Dashboard";
import { MockFileContainerRestClient } from "./fileContainer/FileContainer";
import { MockExtensionManagementRestClient } from "./extensionManagement/ExtensionManagement";
import { MockFeatureAvailabilityRestClient } from "./featureAvailability/FeatureAvailability";
import { MockFeatureManagementRestClient } from "./featureManagement/FeatureManagement";
import { MockGalleryRestClient } from "./gallery/Gallery";
import { MockGitRestClient } from "./git/Git";
import { MockGraphRestClient } from "./graph/Graph";
import { MockOperationsRestClient } from "./operations/Operations";
import { MockPipelinesRestClient } from "./pipelines/Pipelines";
import { MockPolicyRestClient } from "./policy/Policy";
import { MockProjectAnalysisRestClient } from "./projectAnalysis/ProjectAnalysis";
import { MockFavoriteRestClient } from "./favorite/Favorite";
import { MockGitRestClient } from "./git/Git";
import { MockGraphRestClient } from "./graph/Graph";
import { MockLocationsRestClient } from "./locations/Locations";
import { MockManagementRestClient } from "./management/Management";
import { MockPipelinesRestClient } from "./pipelines/Pipelines";
import { MockPolicyRestClient } from "./policy/Policy";
import { MockProfileRestClient } from "./profile/Profile";
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
import { MockWorkItemTrackingProcessDefinitionsRestClient } from "./workItemTrackingProcessDefinitions/WorkItemTrackingProcessDefinitions";
import { MockWorkItemTrackingProcessRestClient } from "./workItemTrackingProcess/WorkItemTrackingProcess";

import {
    registerMockClient,
    getRegisteredMockClient,
    mockClient,
    MockOverrides
} from "./factory";

// Register the real → mock client mapping once at module load.
registerMockClient(AccountsRestClient, MockAccountsRestClient);
registerMockClient(ReportingRestClient, MockReportingRestClient);
registerMockClient(AlertRestClient, MockAlertRestClient);
registerMockClient(WorkRestClient, MockBoardsRestClient);
registerMockClient(BuildRestClient, MockBuildRestClient);
registerMockClient(ContributionsRestClient, MockContributionsRestClient);
registerMockClient(CoreRestClient, MockCoreRestClient);
registerMockClient(DashboardRestClient, MockDashboardRestClient);
registerMockClient(FileContainerRestClient, MockFileContainerRestClient);
registerMockClient(ExtensionManagementRestClient, MockExtensionManagementRestClient);
registerMockClient(FeatureAvailabilityRestClient, MockFeatureAvailabilityRestClient);
registerMockClient(FeatureManagementRestClient, MockFeatureManagementRestClient);
registerMockClient(GalleryRestClient, MockGalleryRestClient);
registerMockClient(GitRestClient, MockGitRestClient);
registerMockClient(GraphRestClient, MockGraphRestClient);
registerMockClient(OperationsRestClient, MockOperationsRestClient);
registerMockClient(PipelinesRestClient, MockPipelinesRestClient);
registerMockClient(PolicyRestClient, MockPolicyRestClient);
registerMockClient(ProjectAnalysisRestClient, MockProjectAnalysisRestClient);
registerMockClient(FavoriteRestClient, MockFavoriteRestClient);
registerMockClient(GitRestClient, MockGitRestClient);
registerMockClient(GraphRestClient, MockGraphRestClient);
registerMockClient(LocationsRestClient, MockLocationsRestClient);
registerMockClient(ManagementRestClient, MockManagementRestClient);
registerMockClient(PipelinesRestClient, MockPipelinesRestClient);
registerMockClient(PolicyRestClient, MockPolicyRestClient);
registerMockClient(ProfileRestClient, MockProfileRestClient);
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
registerMockClient(WorkItemTrackingProcessDefinitionsRestClient, MockWorkItemTrackingProcessDefinitionsRestClient);
registerMockClient(WorkItemTrackingProcessRestClient, MockWorkItemTrackingProcessRestClient);

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
    MockAlertRestClient,
    MockBoardsRestClient,
    MockBuildRestClient,
    MockContributionsRestClient,
    MockCoreRestClient,
    MockDashboardRestClient,
    MockFileContainerRestClient,
    MockExtensionManagementRestClient,
    MockFeatureAvailabilityRestClient,
    MockFeatureManagementRestClient,
    MockGalleryRestClient,
    MockGitRestClient,
    MockGraphRestClient,
    MockOperationsRestClient,
    MockPipelinesRestClient,
    MockPolicyRestClient,
    MockProjectAnalysisRestClient,
    MockFavoriteRestClient,
    MockGitRestClient,
    MockGraphRestClient,
    MockLocationsRestClient,
    MockManagementRestClient,
    MockPipelinesRestClient,
    MockPolicyRestClient,
    MockProfileRestClient,
    MockReleaseRestClient,
    MockResourceUsageRestClient,
    MockReportingRestClient,
    MockServiceEndpointRestClient,
    MockTaskAgentRestClient,
    MockTestRestClient,
    MockTestPlanRestClient,
    MockTestResultsRestClient,
    MockTfvcRestClient,
    MockWikiRestClient,
    MockWorkItemTrackingRestClient,
    MockWorkItemTrackingProcessDefinitionsRestClient
    MockWorkItemTrackingProcessRestClient
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
