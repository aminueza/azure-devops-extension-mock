import { fake } from "../common/fixtures";
import {
    AuthorizationHeader,
    AzureManagementGroup,
    AzureManagementGroupQueryResult,
    AzureSubscription,
    AzureSubscriptionQueryResult,
    ClientCertificate,
    DataSource,
    DataSourceBinding,
    DependencyData,
    EndpointAuthorization,
    EndpointUrl,
    HelpLink,
    OAuthConfiguration,
    ProjectReference,
    ServiceEndpoint,
    ServiceEndpointAuthenticationScheme,
    ServiceEndpointExecutionData,
    ServiceEndpointExecutionOwner,
    ServiceEndpointExecutionRecord,
    ServiceEndpointExecutionResult,
    ServiceEndpointProjectReference,
    ServiceEndpointRequestResult,
    ServiceEndpointType
} from "azure-devops-extension-api/ServiceEndpoint";
import { InputDataType, InputDescriptor, InputMode } from "azure-devops-extension-api/FormInput";
import { makeIdentityRef } from "../core/Data";

export const SECRET_PLACEHOLDER = "***";

export const endpointKinds: { name: string; displayName: string; scheme: string; secretInput: string }[] = [
    { name: "azurerm", displayName: "Azure Resource Manager", scheme: "ServicePrincipal", secretInput: "serviceprincipalkey" },
    { name: "github", displayName: "GitHub", scheme: "Token", secretInput: "accessToken" },
    { name: "dockerregistry", displayName: "Docker Registry", scheme: "UsernamePassword", secretInput: "password" },
    { name: "generic", displayName: "Generic", scheme: "UsernamePassword", secretInput: "password" }
];

export const aadTenantId: string = fake.string.uuid();

export const makeAuthorizationHeader = (): AuthorizationHeader => ({
    name: "Accept",
    value: "application/json"
});

export const makeClientCertificate = (): ClientCertificate => ({
    value: SECRET_PLACEHOLDER
});

export const makeEndpointAuthorization = (scheme: string, secretInput: string): EndpointAuthorization => ({
    scheme,
    parameters: { [secretInput]: SECRET_PLACEHOLDER }
});

export const makeProjectReference = (): ProjectReference => ({
    id: fake.string.uuid(),
    name: fake.commerce.productName()
});

export const makeServiceEndpointProjectReference = (name: string): ServiceEndpointProjectReference => ({
    name,
    description: fake.lorem.sentence(),
    projectReference: makeProjectReference()
});

export const makeServiceEndpoint = (): ServiceEndpoint => {
    const kind = fake.helpers.arrayElement(endpointKinds);
    const name = `${fake.lorem.slug(2)}-connection`;
    return {
        id: fake.string.uuid(),
        name,
        type: kind.name,
        url: fake.internet.url(),
        description: fake.lorem.sentence(),
        owner: "library",
        authorization: makeEndpointAuthorization(kind.scheme, kind.secretInput),
        data: {},
        administratorsGroup: makeIdentityRef(),
        readersGroup: makeIdentityRef(),
        createdBy: makeIdentityRef(),
        creationDate: fake.date.past(),
        modifiedBy: makeIdentityRef(),
        modificationDate: fake.date.recent(),
        groupScopeId: fake.string.uuid(),
        isDisabled: false,
        isOutdated: false,
        isReady: true,
        isShared: false,
        operationStatus: { state: "Ready", statusMessage: "" },
        serviceEndpointProjectReferences: [makeServiceEndpointProjectReference(name)],
        serviceManagementReference: fake.string.uuid()
    };
};

export const makeInputDescriptor = (id: string, isConfidential: boolean): InputDescriptor => ({
    id,
    name: id,
    description: fake.lorem.sentence(),
    groupName: "AuthenticationParameter",
    type: "string",
    inputMode: isConfidential ? InputMode.PasswordBox : InputMode.TextBox,
    isConfidential,
    dependencyInputIds: [],
    hasDynamicValueInformation: false,
    properties: {},
    useInDefaultDescription: false,
    valueHint: "",
    validation: {
        dataType: InputDataType.String,
        isRequired: true,
        maxLength: 300,
        maxValue: 0,
        minLength: 0,
        minValue: 0,
        pattern: "",
        patternMismatchErrorMessage: "",
        patternMismatchWarningMessage: "",
        warningPattern: ""
    },
    values: {
        inputId: id,
        defaultValue: "",
        error: { message: "" },
        isDisabled: false,
        isLimitedToPossibleValues: false,
        isReadOnly: false,
        possibleValues: []
    }
});

export const makeDataSourceBinding = (): DataSourceBinding => ({
    dataSourceName: "TestConnection",
    endpointId: fake.string.uuid(),
    endpointUrl: fake.internet.url(),
    headers: [makeAuthorizationHeader()],
    parameters: {},
    requestContent: "",
    requestVerb: "GET",
    resultSelector: "jsonpath:$.value[*]",
    resultTemplate: "",
    target: "",
    initialContextTemplate: "",
    callbackContextTemplate: "",
    callbackRequiredTemplate: ""
});

export const makeDataSource = (): DataSource => ({
    name: "TestConnection",
    endpointUrl: "{{endpoint.url}}",
    resourceUrl: "",
    requestVerb: "GET",
    requestContent: "",
    resultSelector: "jsonpath:$.value[*]",
    headers: [makeAuthorizationHeader()],
    authenticationScheme: { type: "", inputs: {} },
    initialContextTemplate: "",
    callbackContextTemplate: "",
    callbackRequiredTemplate: ""
});

export const makeAuthenticationScheme = (scheme: string, secretInput: string): ServiceEndpointAuthenticationScheme => ({
    scheme,
    displayName: scheme,
    authorizationUrl: "",
    authorizationHeaders: [makeAuthorizationHeader()],
    clientCertificates: [makeClientCertificate()],
    dataSourceBindings: [makeDataSourceBinding()],
    inputDescriptors: [makeInputDescriptor(secretInput, true)],
    properties: {},
    requiresOAuth2Configuration: false
});

export const makeEndpointUrl = (): EndpointUrl => ({
    displayName: "Server URL",
    helpText: fake.lorem.sentence(),
    format: "",
    isVisible: "true",
    value: fake.internet.url(),
    dependsOn: { input: "", map: [] }
});

export const makeHelpLink = (): HelpLink => ({
    text: fake.lorem.words(),
    url: fake.internet.url()
});

export const makeDependencyData = (): DependencyData => ({
    input: "environment",
    map: [{ key: "AzureCloud", value: [{ key: "environmentUrl", value: fake.internet.url() }] }]
});

export const makeServiceEndpointType = (
    name: string,
    displayName: string,
    scheme: string,
    secretInput: string
): ServiceEndpointType => ({
    name,
    displayName,
    description: fake.lorem.sentence(),
    authenticationSchemes: [makeAuthenticationScheme(scheme, secretInput)],
    dataSources: [makeDataSource()],
    dependencyData: [makeDependencyData()],
    endpointUrl: makeEndpointUrl(),
    helpLink: makeHelpLink(),
    helpMarkDown: fake.lorem.sentence(),
    iconUrl: fake.image.url(),
    inputDescriptors: [makeInputDescriptor("url", false)],
    isHidden: false,
    trustedHosts: [],
    uiContributionId: ""
});

export const makeExecutionOwner = (): ServiceEndpointExecutionOwner => ({
    id: fake.number.id(),
    name: fake.lorem.slug(2),
    _links: {}
});

export const makeExecutionData = (): ServiceEndpointExecutionData => ({
    id: fake.number.id(),
    definition: makeExecutionOwner(),
    owner: makeExecutionOwner(),
    ownerDetails: "",
    planType: "Build",
    result: ServiceEndpointExecutionResult.Succeeded,
    startTime: fake.date.recent({ days: 7 }),
    finishTime: fake.date.recent()
});

export const makeExecutionRecord = (endpointId: string): ServiceEndpointExecutionRecord => ({
    endpointId,
    data: makeExecutionData()
});

export const makeOAuthConfiguration = (): OAuthConfiguration => ({
    id: fake.string.uuid(),
    name: `${fake.lorem.slug(2)}-oauth`,
    endpointType: "github",
    url: fake.internet.url(),
    clientId: fake.string.uuid(),
    clientSecret: SECRET_PLACEHOLDER,
    createdBy: makeIdentityRef(),
    createdOn: fake.date.past(),
    modifiedBy: makeIdentityRef(),
    modifiedOn: fake.date.recent()
});

export const makeAzureSubscription = (): AzureSubscription => ({
    displayName: fake.company.name(),
    subscriptionId: fake.string.uuid(),
    subscriptionTenantId: aadTenantId,
    subscriptionTenantName: fake.internet.domainName()
});

export const makeAzureManagementGroup = (): AzureManagementGroup => {
    const name = fake.lorem.slug(2);
    return {
        id: `/providers/Microsoft.Management/managementGroups/${name}`,
        name,
        displayName: fake.company.name(),
        tenantId: aadTenantId
    };
};

export const makeAzureSubscriptionQueryResult = (value: AzureSubscription[]): AzureSubscriptionQueryResult => ({
    errorMessage: "",
    value
});

export const makeAzureManagementGroupQueryResult = (value: AzureManagementGroup[]): AzureManagementGroupQueryResult => ({
    errorMessage: "",
    value
});

export const makeServiceEndpointRequestResult = (result: string[]): ServiceEndpointRequestResult => ({
    activityId: fake.string.uuid(),
    callbackContextParameters: {},
    callbackRequired: false,
    errorMessage: "",
    result,
    statusCode: "OK"
});

export const makeAadOAuthRequestUrl = (tenant: string, redirectUri: string): string =>
    `https://login.example.com/${tenant}/oauth2/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`;

export const serviceEndpoints: ServiceEndpoint[] = fake.helpers.distinct(5, makeServiceEndpoint, e => e.name);

export const endpointTypes: ServiceEndpointType[] = endpointKinds.map(kind =>
    makeServiceEndpointType(kind.name, kind.displayName, kind.scheme, kind.secretInput)
);

export const executionRecords: ServiceEndpointExecutionRecord[] = Array.from({ length: 5 }, () =>
    makeExecutionRecord(serviceEndpoints[0].id)
);

export const oauthConfigurations: OAuthConfiguration[] = [
    ...fake.helpers.distinct(2, makeOAuthConfiguration, c => c.name),
    { ...makeOAuthConfiguration(), name: "bitbucket-oauth", endpointType: "bitbucket" }
];

export const azureSubscriptions: AzureSubscription[] = Array.from({ length: 3 }, makeAzureSubscription);

export const azureManagementGroups: AzureManagementGroup[] = fake.helpers.distinct(
    2,
    makeAzureManagementGroup,
    g => g.name
);

export const queryResults: string[] = Array.from({ length: 3 }, () => fake.lorem.slug(2));
