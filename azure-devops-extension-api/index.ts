import { CommonServiceIds } from "azure-devops-extension-api/Common";
import { AccountsRestClient } from "azure-devops-extension-api/Accounts";
import { AlertRestClient } from "azure-devops-extension-api/Alert";
import { BuildRestClient } from "azure-devops-extension-api/Build";
import { ContributionsRestClient } from "azure-devops-extension-api/Contributions";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { DashboardRestClient } from "azure-devops-extension-api/Dashboard";
import { ExtensionManagementRestClient } from "azure-devops-extension-api/ExtensionManagement";
import { FavoriteRestClient } from "azure-devops-extension-api/Favorite";
import { FeatureAvailabilityRestClient } from "azure-devops-extension-api/FeatureAvailability";
import { FeatureManagementRestClient } from "azure-devops-extension-api/FeatureManagement";
import { FileContainerRestClient } from "azure-devops-extension-api/FileContainer";
import { GalleryRestClient } from "azure-devops-extension-api/Gallery";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { GraphRestClient } from "azure-devops-extension-api/Graph";
import { LocationsRestClient } from "azure-devops-extension-api/Locations";
import { ManagementRestClient } from "azure-devops-extension-api/Management";
import { NotificationRestClient } from "azure-devops-extension-api/Notification";
import { OperationsRestClient } from "azure-devops-extension-api/Operations";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines";
import { PolicyRestClient } from "azure-devops-extension-api/Policy";
import { ProfileRestClient } from "azure-devops-extension-api/Profile";
import { ProjectAnalysisRestClient } from "azure-devops-extension-api/ProjectAnalysis";
import { ReleaseRestClient } from "azure-devops-extension-api/Release";
import { ReportingRestClient } from "azure-devops-extension-api/AdvancedSecurity.Reporting";
import { ResourceUsageRestClient } from "azure-devops-extension-api/ResourceUsage";
import { ServiceEndpointRestClient } from "azure-devops-extension-api/ServiceEndpoint";
import { ServiceHooksRestClient } from "azure-devops-extension-api/ServiceHooks";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import { TestPlanRestClient } from "azure-devops-extension-api/TestPlan";
import { TestRestClient } from "azure-devops-extension-api/Test";
import { TestResultsRestClient } from "azure-devops-extension-api/TestResults";
import { TfvcRestClient } from "azure-devops-extension-api/Tfvc";
import { WikiRestClient } from "azure-devops-extension-api/Wiki";
import { WorkItemTrackingProcessDefinitionsRestClient } from "azure-devops-extension-api/WorkItemTrackingProcessDefinitions";
import { WorkItemTrackingProcessRestClient } from "azure-devops-extension-api/WorkItemTrackingProcess";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { WorkRestClient } from "azure-devops-extension-api/Work";

import {
    MockExtensionDataService,
    MockGlobalMessagesService,
    MockHostNavigationService,
    MockHostPageLayoutService,
    MockLocationService,
    MockProjectPageService
} from "./common/CommonServices";
import { MockAccountsRestClient } from "./accounts/Accounts";
import { MockAlertRestClient } from "./alert/Alert";
import { MockBoardsRestClient } from "./boards/Boards";
import { MockBuildRestClient } from "./build/Build";
import { MockContributionsRestClient } from "./contributions/Contributions";
import { MockCoreRestClient } from "./core/Core";
import { MockDashboardRestClient } from "./dashboard/Dashboard";
import { MockExtensionManagementRestClient } from "./extensionManagement/ExtensionManagement";
import { MockFavoriteRestClient } from "./favorite/Favorite";
import { MockFeatureAvailabilityRestClient } from "./featureAvailability/FeatureAvailability";
import { MockFeatureManagementRestClient } from "./featureManagement/FeatureManagement";
import { MockFileContainerRestClient } from "./fileContainer/FileContainer";
import { MockGalleryRestClient } from "./gallery/Gallery";
import { MockGitRestClient } from "./git/Git";
import { MockGraphRestClient } from "./graph/Graph";
import { MockLocationsRestClient } from "./locations/Locations";
import { MockManagementRestClient } from "./management/Management";
import { MockNotificationRestClient } from "./notification/Notification";
import { MockOperationsRestClient } from "./operations/Operations";
import { MockPipelinesRestClient } from "./pipelines/Pipelines";
import { MockPolicyRestClient } from "./policy/Policy";
import { MockProfileRestClient } from "./profile/Profile";
import { MockProjectAnalysisRestClient } from "./projectAnalysis/ProjectAnalysis";
import { MockReleaseRestClient } from "./release/Release";
import { MockReportingRestClient } from "./advancedSecurityReporting/Reporting";
import { MockResourceUsageRestClient } from "./resourceUsage/ResourceUsage";
import { MockServiceEndpointRestClient } from "./serviceEndpoint/ServiceEndpoint";
import { MockServiceHooksRestClient } from "./serviceHooks/ServiceHooks";
import { MockTaskAgentRestClient } from "./taskAgent/TaskAgent";
import { MockTestPlanRestClient } from "./testPlan/TestPlan";
import { MockTestRestClient } from "./test/Test";
import { MockTestResultsRestClient } from "./testResults/TestResults";
import { MockTfvcRestClient } from "./tfvc/Tfvc";
import { MockWikiRestClient } from "./wiki/Wiki";
import { MockWorkItemTrackingProcessDefinitionsRestClient } from "./workItemTrackingProcessDefinitions/WorkItemTrackingProcessDefinitions";
import { MockWorkItemTrackingProcessRestClient } from "./workItemTrackingProcess/WorkItemTrackingProcess";
import { MockWorkItemTrackingRestClient } from "./workItemTracking/WorkItemTracking";

import { registerMockClient, getRegisteredMockClient, mockClient, MockOverrides } from "./factory";

// Register the real → mock client mapping once at module load.
registerMockClient(AccountsRestClient, MockAccountsRestClient);
registerMockClient(AlertRestClient, MockAlertRestClient);
registerMockClient(BuildRestClient, MockBuildRestClient);
registerMockClient(ContributionsRestClient, MockContributionsRestClient);
registerMockClient(CoreRestClient, MockCoreRestClient);
registerMockClient(DashboardRestClient, MockDashboardRestClient);
registerMockClient(ExtensionManagementRestClient, MockExtensionManagementRestClient);
registerMockClient(FavoriteRestClient, MockFavoriteRestClient);
registerMockClient(FeatureAvailabilityRestClient, MockFeatureAvailabilityRestClient);
registerMockClient(FeatureManagementRestClient, MockFeatureManagementRestClient);
registerMockClient(FileContainerRestClient, MockFileContainerRestClient);
registerMockClient(GalleryRestClient, MockGalleryRestClient);
registerMockClient(GitRestClient, MockGitRestClient);
registerMockClient(GraphRestClient, MockGraphRestClient);
registerMockClient(LocationsRestClient, MockLocationsRestClient);
registerMockClient(ManagementRestClient, MockManagementRestClient);
registerMockClient(NotificationRestClient, MockNotificationRestClient);
registerMockClient(OperationsRestClient, MockOperationsRestClient);
registerMockClient(PipelinesRestClient, MockPipelinesRestClient);
registerMockClient(PolicyRestClient, MockPolicyRestClient);
registerMockClient(ProfileRestClient, MockProfileRestClient);
registerMockClient(ProjectAnalysisRestClient, MockProjectAnalysisRestClient);
registerMockClient(ReleaseRestClient, MockReleaseRestClient);
registerMockClient(ReportingRestClient, MockReportingRestClient);
registerMockClient(ResourceUsageRestClient, MockResourceUsageRestClient);
registerMockClient(ServiceEndpointRestClient, MockServiceEndpointRestClient);
registerMockClient(ServiceHooksRestClient, MockServiceHooksRestClient);
registerMockClient(TaskAgentRestClient, MockTaskAgentRestClient);
registerMockClient(TestPlanRestClient, MockTestPlanRestClient);
registerMockClient(TestRestClient, MockTestRestClient);
registerMockClient(TestResultsRestClient, MockTestResultsRestClient);
registerMockClient(TfvcRestClient, MockTfvcRestClient);
registerMockClient(WikiRestClient, MockWikiRestClient);
registerMockClient(WorkItemTrackingProcessDefinitionsRestClient, MockWorkItemTrackingProcessDefinitionsRestClient);
registerMockClient(WorkItemTrackingProcessRestClient, MockWorkItemTrackingProcessRestClient);
registerMockClient(WorkItemTrackingRestClient, MockWorkItemTrackingRestClient);
registerMockClient(WorkRestClient, MockBoardsRestClient);

const serviceDictionary: { [key: string]: unknown } = {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clientClass: new (...args: any[]) => T,
    overrides: MockOverrides<T> = {}
): T {
    return mockClient(clientClass, overrides);
}

export { mockClient, registerMockClient, getRegisteredMockClient, MockOverrides };
export { stateful } from "./common/state";

// Re-export mock clients for direct import.
export {
    MockAccountsRestClient,
    MockAlertRestClient,
    MockBoardsRestClient,
    MockBuildRestClient,
    MockContributionsRestClient,
    MockCoreRestClient,
    MockDashboardRestClient,
    MockExtensionManagementRestClient,
    MockFavoriteRestClient,
    MockFeatureAvailabilityRestClient,
    MockFeatureManagementRestClient,
    MockFileContainerRestClient,
    MockGalleryRestClient,
    MockGitRestClient,
    MockGraphRestClient,
    MockLocationsRestClient,
    MockManagementRestClient,
    MockNotificationRestClient,
    MockOperationsRestClient,
    MockPipelinesRestClient,
    MockPolicyRestClient,
    MockProfileRestClient,
    MockProjectAnalysisRestClient,
    MockReleaseRestClient,
    MockReportingRestClient,
    MockResourceUsageRestClient,
    MockServiceEndpointRestClient,
    MockServiceHooksRestClient,
    MockTaskAgentRestClient,
    MockTestPlanRestClient,
    MockTestRestClient,
    MockTestResultsRestClient,
    MockTfvcRestClient,
    MockWikiRestClient,
    MockWorkItemTrackingProcessDefinitionsRestClient,
    MockWorkItemTrackingProcessRestClient,
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
