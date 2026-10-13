import { fake } from "../common/fixtures";
import type { Identity, IdentityDescriptor } from "azure-devops-extension-api/Identities";
import {
    AccessMapping,
    ConnectionData,
    InheritLevel,
    LocationMapping,
    LocationServiceData,
    RelativeToSetting,
    ResourceAreaInfo,
    ServiceDefinition,
    ServiceStatus
} from "azure-devops-extension-api/Locations";
import { DeploymentFlags } from "azure-devops-extension-api/WebApi";

export const makeIdentityDescriptor = (): IdentityDescriptor => ({
    identifier: `${fake.string.uuid()}\\${fake.internet.email()}`,
    identityType: "Microsoft.IdentityModel.Claims.ClaimsIdentity"
});

export const makeIdentity = (): Identity => ({
    id: fake.string.uuid(),
    customDisplayName: fake.person.fullName(),
    providerDisplayName: fake.person.fullName(),
    descriptor: makeIdentityDescriptor(),
    isActive: true,
    isContainer: false,
    masterId: fake.string.uuid(),
    memberIds: [],
    memberOf: [],
    members: [],
    metaTypeId: 0,
    properties: {},
    resourceVersion: 2,
    socialDescriptor: fake.helpers.absent(),
    subjectDescriptor: `aad.${fake.string.alphanumeric(16)}`,
    uniqueUserId: 0
});

export const makeAccessMapping = (): AccessMapping => ({
    accessPoint: fake.internet.url(),
    displayName: fake.lorem.words(2),
    moniker: fake.lorem.slug(2),
    serviceOwner: fake.string.uuid(),
    virtualDirectory: ""
});

export const makeLocationMapping = (accessMappingMoniker: string = fake.lorem.slug(2)): LocationMapping => ({
    accessMappingMoniker,
    location: fake.internet.url()
});

export const makeServiceDefinition = (): ServiceDefinition => ({
    serviceType: fake.helpers.arrayElement(["LocationService2", "distributedtask", "git", "build", "wit"]),
    identifier: fake.string.uuid(),
    displayName: fake.lorem.words(2),
    description: fake.lorem.sentence(),
    inheritLevel: InheritLevel.None,
    locationMappings: [makeLocationMapping()],
    maxVersion: "7.2",
    minVersion: "1.0",
    releasedVersion: "7.1",
    resourceVersion: 1,
    parentIdentifier: fake.helpers.absent(),
    parentServiceType: fake.helpers.absent(),
    properties: {},
    relativePath: `/${fake.lorem.slug(2)}`,
    relativeToSetting: RelativeToSetting.Context,
    serviceOwner: fake.string.uuid(),
    status: ServiceStatus.Active,
    toolId: fake.lorem.word()
});

export const makeResourceAreaInfo = (): ResourceAreaInfo => ({
    id: fake.string.uuid(),
    name: fake.lorem.word(),
    locationUrl: fake.internet.url()
});

export const accessMappings: AccessMapping[] = [
    { ...makeAccessMapping(), moniker: "HostGuidAccessMapping", displayName: "Host Guid Access Mapping" },
    { ...makeAccessMapping(), moniker: "PublicAccessMapping", displayName: "Public Access Mapping" }
];

const topLevelDefinitions: ServiceDefinition[] = fake.helpers
    .distinct(3, makeServiceDefinition, definition => `${definition.serviceType}/${definition.identifier}`)
    .map(definition => ({
        ...definition,
        locationMappings: accessMappings.map(mapping => makeLocationMapping(mapping.moniker))
    }));

export const serviceDefinitions: ServiceDefinition[] = [
    ...topLevelDefinitions,
    {
        ...makeServiceDefinition(),
        serviceType: `${topLevelDefinitions[0].serviceType}.child`,
        parentIdentifier: topLevelDefinitions[0].identifier,
        parentServiceType: topLevelDefinitions[0].serviceType,
        inheritLevel: InheritLevel.Account
    }
];

export const resourceAreas: ResourceAreaInfo[] = [
    { ...makeResourceAreaInfo(), id: "79134c72-4a58-4b42-976c-04e7115f32bf", name: "core" },
    { ...makeResourceAreaInfo(), id: "4e080c62-fa21-4fbc-8fef-2a10a2b38049", name: "git" },
    { ...makeResourceAreaInfo(), id: "965220d5-5bb9-42cf-8d67-9b146df2a5a4", name: "build" },
    { ...makeResourceAreaInfo(), id: "fb13a388-40dd-4a04-b530-013a739c72ef", name: "policy" }
];

export const makeLocationServiceData = (): LocationServiceData => ({
    accessMappings,
    clientCacheFresh: false,
    clientCacheTimeToLive: 3_600,
    defaultAccessMappingMoniker: accessMappings[1].moniker,
    lastChangeId: fake.number.int({ min: 1, max: 100_000 }),
    lastChangeId64: fake.number.int({ min: 1, max: 100_000 }),
    serviceDefinitions,
    serviceOwner: fake.string.uuid()
});

export const makeConnectionData = (user: Identity = makeIdentity()): ConnectionData => ({
    authenticatedUser: user,
    authorizedUser: user,
    deploymentId: fake.string.uuid(),
    deploymentType: DeploymentFlags.Hosted,
    instanceId: fake.string.uuid(),
    lastUserAccess: fake.date.recent(),
    locationServiceData: makeLocationServiceData(),
    webApplicationRelativeDirectory: ""
});

export const connectionData: ConnectionData = makeConnectionData();
