import { fake } from "../common/fixtures";
import {
    AcquisitionAssignmentType,
    AcquisitionOperation,
    AcquisitionOperationState,
    AcquisitionOperationType,
    AcquisitionOptions,
    Contribution,
    ContributionPropertyType,
    ContributionType,
    ExtensionAcquisitionRequest,
    ExtensionAuditLog,
    ExtensionAuditLogEntry,
    ExtensionAuthorization,
    ExtensionDataCollection,
    ExtensionEventCallbackCollection,
    ExtensionFlags,
    ExtensionRequest,
    ExtensionRequestState,
    ExtensionState,
    ExtensionStateFlags,
    InstalledExtension,
    InstalledExtensionState,
    InstalledExtensionStateIssue,
    InstalledExtensionStateIssueType,
    RequestedExtension
} from "azure-devops-extension-api/ExtensionManagement";
import type { ExtensionFile, UserExtensionPolicy } from "azure-devops-extension-api/Gallery";
import { makeIdentityRef } from "../core/Data";

export interface ExtensionDocument {
    id: string;
    __etag: number;
    [key: string]: unknown;
}

const EXTENSION_POLICY_ALL = 31;

export const makeExtensionFile = (): ExtensionFile => ({
    assetType: "Microsoft.VisualStudio.Services.Icons.Default",
    language: "en-US",
    source: fake.image.url()
});

export const makeContribution = (owner: string = fake.lorem.slug(2)): Contribution => ({
    id: `${owner}.${fake.lorem.slug(2)}`,
    description: fake.lorem.sentence(),
    type: "ms.vss-web.hub",
    targets: ["ms.vss-web.project-hub-groups-collection"],
    includes: [],
    constraints: [],
    restrictedTo: [],
    visibleTo: [],
    properties: { name: fake.lorem.words(2), uri: "dist/index.html" }
});

export const makeContributionType = (owner: string = fake.lorem.slug(2)): ContributionType => ({
    id: `${owner}.${fake.lorem.slug(2)}`,
    name: fake.lorem.words(2),
    description: fake.lorem.sentence(),
    indexed: false,
    visibleTo: [],
    properties: {
        uri: {
            name: "uri",
            description: fake.lorem.sentence(),
            required: true,
            type: ContributionPropertyType.Uri
        }
    }
});

export const makeExtensionEventCallbackCollection = (
    baseUri: string = fake.internet.url()
): ExtensionEventCallbackCollection => ({
    postDisable: { uri: `${baseUri}/events/post-disable` },
    postEnable: { uri: `${baseUri}/events/post-enable` },
    postInstall: { uri: `${baseUri}/events/post-install` },
    postUninstall: { uri: `${baseUri}/events/post-uninstall` },
    postUpdate: { uri: `${baseUri}/events/post-update` },
    preInstall: { uri: `${baseUri}/events/pre-install` },
    versionCheck: { uri: `${baseUri}/events/version-check` }
});

export const makeInstalledExtensionStateIssue = (): InstalledExtensionStateIssue => ({
    message: fake.lorem.sentence(),
    source: fake.lorem.slug(2),
    type: InstalledExtensionStateIssueType.Warning
});

export const makeInstalledExtensionState = (): InstalledExtensionState => ({
    flags: ExtensionStateFlags.None,
    installationIssues: [],
    lastUpdated: fake.date.recent()
});

export const makeInstalledExtension = (): InstalledExtension => {
    const publisherId = fake.lorem.slug(2);
    const extensionId = fake.lorem.slug(2);
    const owner = `${publisherId}.${extensionId}`;
    const baseUri = fake.internet.url();
    return {
        extensionId,
        extensionName: fake.commerce.productName(),
        publisherId,
        publisherName: fake.company.name(),
        version: fake.system.semver(),
        registrationId: fake.string.uuid(),
        manifestVersion: 1,
        baseUri,
        fallbackBaseUri: fake.internet.url(),
        marketplaceBaseUri: "https://marketplace.visualstudio.com",
        language: "en-US",
        serviceInstanceType: fake.string.uuid(),
        scopes: ["vso.work", "vso.code"],
        demands: [],
        restrictedTo: [],
        constraints: [],
        contributions: [makeContribution(owner), makeContribution(owner)],
        contributionTypes: [makeContributionType(owner)],
        eventCallbacks: makeExtensionEventCallbackCollection(baseUri),
        licensing: { overrides: [] },
        files: [makeExtensionFile()],
        flags: ExtensionFlags.Trusted,
        installState: makeInstalledExtensionState(),
        lastPublished: fake.date.past()
    };
};

export const extensionKey = (publisherName: string, extensionName: string): string =>
    `${publisherName}.${extensionName}`;

export const makeExtensionState = (extension: InstalledExtension = makeInstalledExtension()): ExtensionState => ({
    ...extension.installState,
    publisherName: extension.publisherId,
    extensionName: extension.extensionId,
    version: extension.version,
    lastVersionCheck: fake.date.recent()
});

export const makeAcquisitionOperation = (
    operationType: AcquisitionOperationType = AcquisitionOperationType.Install
): AcquisitionOperation => ({
    operationType,
    operationState: AcquisitionOperationState.Allow,
    reason: fake.helpers.absent(),
    reasons: []
});

export const makeAcquisitionOptions = (): AcquisitionOptions => {
    const defaultOperation = makeAcquisitionOperation();
    return {
        itemId: extensionKey(fake.lorem.slug(2), fake.lorem.slug(2)),
        target: fake.string.uuid(),
        defaultOperation,
        operations: [defaultOperation, makeAcquisitionOperation(AcquisitionOperationType.Request)],
        properties: {}
    };
};

export const makeExtensionAcquisitionRequest = (): ExtensionAcquisitionRequest => ({
    itemId: extensionKey(fake.lorem.slug(2), fake.lorem.slug(2)),
    assignmentType: AcquisitionAssignmentType.None,
    operationType: AcquisitionOperationType.Install,
    billingId: fake.string.uuid(),
    quantity: 1,
    properties: {}
});

export const makeExtensionAuditLogEntry = (auditAction = "Install"): ExtensionAuditLogEntry => ({
    auditAction,
    auditDate: fake.date.recent({ days: 30 }),
    comment: fake.lorem.sentence(),
    updatedBy: makeIdentityRef()
});

export const makeExtensionAuditLog = (): ExtensionAuditLog => ({
    publisherName: fake.lorem.slug(2),
    extensionName: fake.lorem.slug(2),
    entries: [makeExtensionAuditLogEntry("Install"), makeExtensionAuditLogEntry("VersionUpdate")]
});

export const makeExtensionAuthorization = (): ExtensionAuthorization => ({
    id: fake.string.uuid(),
    scopes: ["vso.work", "vso.code"]
});

export const makeExtensionDocument = (): ExtensionDocument => ({
    id: fake.string.uuid(),
    __etag: 1,
    value: fake.lorem.words(3)
});

export const makeExtensionDataCollection = (): ExtensionDataCollection => ({
    collectionName: fake.lorem.slug(2),
    scopeType: "Default",
    scopeValue: "Current",
    documents: [makeExtensionDocument()]
});

export const makeExtensionRequest = (): ExtensionRequest => ({
    requestMessage: fake.lorem.sentence(),
    requestDate: fake.date.recent({ days: 7 }),
    requestedBy: makeIdentityRef(),
    requestState: ExtensionRequestState.Open,
    rejectMessage: fake.helpers.absent(),
    resolveDate: fake.helpers.absent(),
    resolvedBy: fake.helpers.absent()
});

export const makeRequestedExtension = (requests: number = 1): RequestedExtension => ({
    publisherName: fake.lorem.slug(2),
    publisherDisplayName: fake.company.name(),
    extensionName: fake.lorem.slug(2),
    extensionRequests: Array.from({ length: requests }, makeExtensionRequest),
    requestCount: requests
});

export const makeUserExtensionPolicy = (): UserExtensionPolicy => ({
    userId: fake.string.uuid(),
    displayName: fake.person.fullName(),
    permissions: { install: EXTENSION_POLICY_ALL, request: EXTENSION_POLICY_ALL }
});

const seededExtensions: InstalledExtension[] = fake.helpers.distinct(4, makeInstalledExtension, item =>
    extensionKey(item.publisherId, item.extensionId)
);

export const installedExtensions: InstalledExtension[] = [
    seededExtensions[0],
    { ...seededExtensions[1], flags: ExtensionFlags.BuiltIn | ExtensionFlags.Trusted },
    {
        ...seededExtensions[2],
        installState: { ...seededExtensions[2].installState, flags: ExtensionStateFlags.Disabled }
    },
    {
        ...seededExtensions[3],
        installState: {
            ...seededExtensions[3].installState,
            flags: ExtensionStateFlags.Warning,
            installationIssues: [makeInstalledExtensionStateIssue()]
        }
    }
];

export const extensionStates: ExtensionState[] = installedExtensions.map(makeExtensionState);

export const requestedExtensions: RequestedExtension[] = fake.helpers
    .distinct(2, makeRequestedExtension, item => extensionKey(item.publisherName, item.extensionName))
    .map((item, index) => ({
        ...item,
        extensionRequests: Array.from({ length: index + 1 }, makeExtensionRequest),
        requestCount: index + 1
    }));

export const documents: ExtensionDocument[] = fake.helpers.distinct(3, makeExtensionDocument, item => item.id);
