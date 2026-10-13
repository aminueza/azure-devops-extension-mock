import { fake } from "../common/fixtures";
import {
    ClientContribution,
    ClientContributionNode,
    ClientContributionProviderDetails,
    Contribution,
    ContributionNodeQueryResult,
    ContributionPropertyType,
    ContributionType,
    DataProviderResult,
    ExtensionEventCallbackCollection,
    ExtensionFlags,
    ExtensionStateFlags,
    InstalledExtension,
    InstalledExtensionState,
    ResolvedDataProvider
} from "azure-devops-extension-api/Contributions";
import type { ExtensionFile } from "azure-devops-extension-api/Gallery";

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

export const makeClientContribution = (): ClientContribution => ({
    id: `${fake.lorem.slug(2)}.${fake.lorem.slug(2)}`,
    description: fake.lorem.sentence(),
    type: "ms.vss-web.hub",
    targets: ["ms.vss-web.project-hub-groups-collection"],
    includes: [],
    properties: { name: fake.lorem.words(2), uri: "dist/index.html" }
});

export const makeClientContributionNode = (
    contribution: ClientContribution = makeClientContribution()
): ClientContributionNode => ({
    contribution,
    parents: [...contribution.targets],
    children: []
});

export const makeClientContributionProviderDetails = (): ClientContributionProviderDetails => ({
    name: extensionKey(fake.lorem.slug(2), fake.lorem.slug(2)),
    displayName: fake.commerce.productName(),
    version: fake.system.semver(),
    properties: {}
});

export const makeContributionNodeQueryResult = (): ContributionNodeQueryResult => ({
    nodes: {},
    providerDetails: {}
});

export const makeResolvedDataProvider = (): ResolvedDataProvider => ({
    id: `${fake.lorem.slug(2)}.${fake.lorem.slug(2)}`,
    duration: fake.number.int({ min: 1, max: 250 }),
    error: fake.helpers.absent()
});

export const makeDataProviderResult = (): DataProviderResult => ({
    data: {},
    sharedData: {},
    clientProviders: {},
    exceptions: {},
    resolvedProviders: [],
    scopeName: fake.helpers.absent(),
    scopeValue: fake.helpers.absent()
});

const seededExtensions: InstalledExtension[] = fake.helpers.distinct(3, makeInstalledExtension, item =>
    extensionKey(item.publisherId, item.extensionId)
);

export const installedExtensions: InstalledExtension[] = [
    seededExtensions[0],
    { ...seededExtensions[1], flags: ExtensionFlags.BuiltIn | ExtensionFlags.Trusted },
    {
        ...seededExtensions[2],
        installState: { ...seededExtensions[2].installState, flags: ExtensionStateFlags.Disabled }
    }
];
