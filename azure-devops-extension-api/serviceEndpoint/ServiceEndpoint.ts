import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    AadLoginPromptOption,
    AzureManagementGroupQueryResult,
    AzureSubscriptionQueryResult,
    DataSourceBinding,
    OAuthConfiguration,
    OAuthConfigurationActionFilter,
    OAuthConfigurationParams,
    ProjectReference,
    RefreshAuthenticationParameters,
    ServiceEndpoint,
    ServiceEndpointActionFilter,
    ServiceEndpointExecutionRecord,
    ServiceEndpointExecutionRecordsInput,
    ServiceEndpointProjectReference,
    ServiceEndpointRequest,
    ServiceEndpointRequestResult,
    ServiceEndpointRestClient,
    ServiceEndpointType
} from "azure-devops-extension-api/ServiceEndpoint";
import { PagedList } from "azure-devops-extension-api/WebApi";
import {
    azureManagementGroups,
    aadTenantId,
    azureSubscriptions,
    endpointTypes,
    executionRecords,
    makeAadOAuthRequestUrl,
    makeAzureManagementGroupQueryResult,
    makeAzureSubscriptionQueryResult,
    makeOAuthConfiguration,
    makeServiceEndpoint,
    makeServiceEndpointRequestResult,
    oauthConfigurations,
    queryResults,
    serviceEndpoints
} from "./Data";

const findEndpoint = (endpointId: string): ServiceEndpoint =>
    serviceEndpoints.find(e => e.id === endpointId) ?? { ...makeServiceEndpoint(), id: endpointId };

const findEndpointByName = (name: string): ServiceEndpoint =>
    serviceEndpoints.find(e => e.name === name) ?? { ...makeServiceEndpoint(), name };

const findOAuthConfiguration = (configurationId: string): OAuthConfiguration =>
    oauthConfigurations.find(c => c.id === configurationId) ?? { ...makeOAuthConfiguration(), id: configurationId };

const matchesEndpoint = (endpoint: ServiceEndpoint, type?: string, authSchemes?: string[], owner?: string): boolean =>
    (!type || endpoint.type === type) &&
    (!authSchemes || authSchemes.includes(endpoint.authorization.scheme)) &&
    (!owner || endpoint.owner === owner);

export class MockServiceEndpointRestClient extends RestClientBase {
    public TYPE = ServiceEndpointRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getAzureManagementGroups(): Promise<AzureManagementGroupQueryResult> {
        return Promise.resolve(makeAzureManagementGroupQueryResult(azureManagementGroups));
    }

    getAzureSubscriptions(): Promise<AzureSubscriptionQueryResult> {
        return Promise.resolve(makeAzureSubscriptionQueryResult(azureSubscriptions));
    }

    executeServiceEndpointRequest(
        _serviceEndpointRequest: ServiceEndpointRequest,
        _project: string,
        _endpointId: string
    ): Promise<ServiceEndpointRequestResult> {
        return Promise.resolve(makeServiceEndpointRequestResult(queryResults));
    }

    queryServiceEndpoint(_binding: DataSourceBinding, _project: string): Promise<string[]> {
        return Promise.resolve(queryResults);
    }

    createServiceEndpoint(endpoint: ServiceEndpoint): Promise<ServiceEndpoint> {
        return Promise.resolve({ ...makeServiceEndpoint(), ...endpoint });
    }

    deleteServiceEndpoint(_endpointId: string, _projectIds: string[], _deep?: boolean): Promise<void> {
        return Promise.resolve();
    }

    getServiceEndpointsByTypeAndOwner(type: string, owner: string): Promise<ServiceEndpoint[]> {
        return Promise.resolve(serviceEndpoints.filter(e => matchesEndpoint(e, type, undefined, owner)));
    }

    shareServiceEndpoint(
        _endpointProjectReferences: ServiceEndpointProjectReference[],
        _endpointId: string
    ): Promise<void> {
        return Promise.resolve();
    }

    updateServiceEndpoint(
        endpoint: ServiceEndpoint,
        endpointId: string,
        _operation?: string
    ): Promise<ServiceEndpoint> {
        return Promise.resolve({ ...findEndpoint(endpointId), ...endpoint, id: endpointId });
    }

    updateServiceEndpoints(endpoints: ServiceEndpoint[]): Promise<ServiceEndpoint[]> {
        return Promise.resolve(endpoints.map(endpoint => ({ ...makeServiceEndpoint(), ...endpoint })));
    }

    getServiceEndpointDetails(
        _project: string,
        endpointId: string,
        _actionFilter?: ServiceEndpointActionFilter,
        _loadConfidentialData?: boolean
    ): Promise<ServiceEndpoint> {
        return Promise.resolve(findEndpoint(endpointId));
    }

    getServiceEndpoints(
        _project: string,
        type?: string,
        authSchemes?: string[],
        endpointIds?: string[],
        owner?: string,
        _includeFailed?: boolean,
        _includeDetails?: boolean,
        _actionFilter?: ServiceEndpointActionFilter
    ): Promise<ServiceEndpoint[]> {
        return Promise.resolve(
            serviceEndpoints.filter(
                e => matchesEndpoint(e, type, authSchemes, owner) && (!endpointIds || endpointIds.includes(e.id))
            )
        );
    }

    getServiceEndpointsByNames(
        _project: string,
        endpointNames: string[],
        type?: string,
        authSchemes?: string[],
        owner?: string,
        _includeFailed?: boolean,
        _includeDetails?: boolean
    ): Promise<ServiceEndpoint[]> {
        return Promise.resolve(
            endpointNames.map(findEndpointByName).filter(e => matchesEndpoint(e, type, authSchemes, owner))
        );
    }

    getServiceEndpointsWithRefreshedAuthentication(
        _refreshAuthenticationParameters: RefreshAuthenticationParameters[],
        _project: string,
        endpointIds: string[]
    ): Promise<ServiceEndpoint[]> {
        return Promise.resolve(endpointIds.map(findEndpoint));
    }

    getServiceEndpointExecutionRecords(
        _project: string,
        endpointId: string,
        top?: number,
        _continuationToken?: number
    ): Promise<PagedList<ServiceEndpointExecutionRecord>> {
        const records: PagedList<ServiceEndpointExecutionRecord> = Object.assign(
            executionRecords.slice(0, top ?? executionRecords.length).map(record => ({ ...record, endpointId })),
            { continuationToken: null }
        );
        return Promise.resolve(records);
    }

    addServiceEndpointExecutionRecords(
        input: ServiceEndpointExecutionRecordsInput,
        _project: string
    ): Promise<ServiceEndpointExecutionRecord[]> {
        return Promise.resolve(input.endpointIds.map(endpointId => ({ endpointId, data: input.data })));
    }

    createOAuthConfiguration(configurationParams: OAuthConfigurationParams): Promise<OAuthConfiguration> {
        return Promise.resolve({ ...makeOAuthConfiguration(), ...configurationParams });
    }

    deleteOAuthConfiguration(configurationId: string): Promise<OAuthConfiguration> {
        return Promise.resolve(findOAuthConfiguration(configurationId));
    }

    getOAuthConfiguration(configurationId: string): Promise<OAuthConfiguration> {
        return Promise.resolve(findOAuthConfiguration(configurationId));
    }

    getOAuthConfigurations(
        endpointType?: string,
        _actionFilter?: OAuthConfigurationActionFilter
    ): Promise<OAuthConfiguration[]> {
        return Promise.resolve(oauthConfigurations.filter(c => !endpointType || c.endpointType === endpointType));
    }

    updateOAuthConfiguration(
        configurationParams: OAuthConfigurationParams,
        configurationId: string
    ): Promise<OAuthConfiguration> {
        return Promise.resolve({ ...findOAuthConfiguration(configurationId), ...configurationParams });
    }

    querySharedProjects(endpointId: string, _project: string): Promise<ProjectReference[]> {
        return Promise.resolve(
            findEndpoint(endpointId).serviceEndpointProjectReferences.map(reference => reference.projectReference)
        );
    }

    shareEndpointWithProject(_endpointId: string, _fromProject: string, _withProject: string): Promise<void> {
        return Promise.resolve();
    }

    getServiceEndpointTypes(type?: string, scheme?: string): Promise<ServiceEndpointType[]> {
        return Promise.resolve(
            endpointTypes.filter(
                t => (!type || t.name === type) && (!scheme || t.authenticationSchemes.some(s => s.scheme === scheme))
            )
        );
    }

    getFilteredServiceEndpointTypes(typesFilter: string[]): Promise<ServiceEndpointType[]> {
        return Promise.resolve(endpointTypes.filter(t => typesFilter.includes(t.name)));
    }

    createAadOAuthRequest(
        tenantId: string,
        redirectUri: string,
        _promptOption?: AadLoginPromptOption,
        _completeCallbackPayload?: string,
        _completeCallbackByAuthCode?: boolean
    ): Promise<string> {
        return Promise.resolve(makeAadOAuthRequestUrl(tenantId, redirectUri));
    }

    getVstsAadTenantId(): Promise<string> {
        return Promise.resolve(aadTenantId);
    }
}
