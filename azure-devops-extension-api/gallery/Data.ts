import { fake } from "../common/fixtures";
import {
    AcquisitionOperation,
    AcquisitionOperationState,
    AcquisitionOperationType,
    AcquisitionOptions,
    AzurePublisher,
    Concern,
    ConcernCategory,
    DraftStateType,
    EventCounts,
    ExtensionCategory,
    ExtensionDailyStat,
    ExtensionDailyStats,
    ExtensionDeploymentTechnology,
    ExtensionDraft,
    ExtensionDraftAsset,
    ExtensionEvent,
    ExtensionEvents,
    ExtensionFile,
    ExtensionFilterResult,
    ExtensionPayload,
    ExtensionStatistic,
    ExtensionVersion,
    ExtensionVersionFlags,
    InstallationTarget,
    ProductCategory,
    PublishedExtension,
    PublishedExtensionFlags,
    Publisher,
    PublisherFacts,
    PublisherFlags,
    PublisherRoleAccess,
    PublisherRoleAssignment,
    PublisherSecurityRole,
    PublisherState,
    QnAItem,
    QnAItemStatus,
    Question,
    Response,
    Review,
    ReviewSummary,
    UserIdentityRef
} from "azure-devops-extension-api/Gallery";
import { makeIdentityRef } from "../core/Data";

const DAY_MS = 86_400_000;
const ASSET_PREFIX = "Microsoft.VisualStudio.Services";
const CATEGORY_NAMES = ["Azure Boards", "Azure Repos", "Azure Pipelines", "Azure Test Plans", "Azure Artifacts"];
const PRODUCTS = ["vsts", "vs", "vscode"];

export const makeBuffer = (text: string): ArrayBuffer => {
    const encoded = new TextEncoder().encode(text);
    const buffer = new ArrayBuffer(encoded.byteLength);
    new Uint8Array(buffer).set(encoded);
    return buffer;
};

export const makeInstallationTarget = (target = "Microsoft.VisualStudio.Services"): InstallationTarget => ({
    target,
    targetVersion: "[15.0,)",
    extensionVersion: fake.helpers.absent(),
    productArchitecture: fake.helpers.absent(),
    targetPlatform: fake.helpers.absent()
});

export const makeExtensionFile = (assetType = `${ASSET_PREFIX}.VSIXPackage`): ExtensionFile => ({
    assetType,
    language: "en-us",
    source: `${fake.internet.url()}/${assetType}`
});

export const makeExtensionVersion = (version: string = fake.system.semver()): ExtensionVersion => ({
    version,
    flags: ExtensionVersionFlags.Validated,
    lastUpdated: fake.date.recent({ days: 30 }),
    versionDescription: fake.lorem.sentence(),
    assetUri: fake.internet.url(),
    fallbackAssetUri: fake.internet.url(),
    badges: [],
    files: [
        makeExtensionFile(`${ASSET_PREFIX}.VSIXPackage`),
        makeExtensionFile(`${ASSET_PREFIX}.Manifest`),
        makeExtensionFile(`${ASSET_PREFIX}.Content.Details`),
        makeExtensionFile(`${ASSET_PREFIX}.Icons.Default`)
    ],
    properties: [{ key: "Microsoft.VisualStudio.Services.Links.Source", value: fake.internet.url() }],
    targetPlatform: fake.helpers.absent(),
    validationResultMessage: fake.helpers.absent()
});

export const makeExtensionStatistic = (statisticName: string, value: number): ExtensionStatistic => ({
    statisticName,
    value
});

export const makePublisher = (): Publisher => ({
    publisherId: fake.string.uuid(),
    publisherName: fake.lorem.slug(2),
    displayName: fake.company.name(),
    shortDescription: fake.lorem.sentence(),
    longDescription: fake.lorem.paragraph(),
    emailAddress: [fake.internet.exampleEmail()],
    extensions: [],
    flags: PublisherFlags.Verified,
    state: PublisherState.None,
    lastUpdated: fake.date.recent({ days: 30 }),
    domain: `https://${fake.internet.domainName()}`,
    isDnsTokenVerified: true,
    isDomainVerified: true,
    reCaptchaToken: fake.helpers.absent(),
    _links: {}
});

export const makePublisherFacts = (
    { publisherId, publisherName, displayName, flags, domain, isDomainVerified }: PublisherFacts = makePublisher()
): PublisherFacts => ({
    publisherId,
    publisherName,
    displayName,
    flags,
    domain,
    isDomainVerified
});

export const makePublishedExtension = (publisher: PublisherFacts = makePublisherFacts()): PublishedExtension => ({
    extensionId: fake.string.uuid(),
    extensionName: fake.lorem.slug(2),
    displayName: fake.commerce.productName(),
    shortDescription: fake.lorem.sentence(),
    longDescription: fake.lorem.paragraph(),
    publisher,
    flags: PublishedExtensionFlags.Validated | PublishedExtensionFlags.Public,
    deploymentType: ExtensionDeploymentTechnology.Vsix,
    categories: [fake.helpers.arrayElement(CATEGORY_NAMES)],
    tags: [fake.lorem.word(), fake.word.noun()],
    installationTargets: [makeInstallationTarget()],
    lastUpdated: fake.date.recent({ days: 30 }),
    publishedDate: fake.date.past({ years: 2 }),
    releaseDate: fake.date.past({ years: 2 }),
    sharedWith: [],
    statistics: [
        makeExtensionStatistic("install", fake.number.int({ min: 10, max: 50_000 })),
        makeExtensionStatistic("averagerating", fake.number.int({ min: 1, max: 5 })),
        makeExtensionStatistic("ratingcount", fake.number.int({ min: 1, max: 500 }))
    ],
    versions: [makeExtensionVersion("2.0.0"), makeExtensionVersion("1.1.0"), makeExtensionVersion("1.0.0")],
    presentInConflictList: fake.helpers.absent()
});

export const makeExtensionFilterResult = (matching: PublishedExtension[], total: number): ExtensionFilterResult => ({
    extensions: matching,
    pagingToken: fake.helpers.absent(),
    resultMetadata: [{ metadataType: "ResultCount", metadataItems: [{ name: "TotalCount", count: total }] }]
});

export const makeAzurePublisher = (publisherName: string = fake.lorem.slug(2)): AzurePublisher => ({
    publisherName,
    azurePublisherId: fake.string.uuid()
});

export const makeExtensionCategory = (categoryName: string = fake.lorem.words(2)): ExtensionCategory => ({
    categoryId: fake.number.id(),
    categoryName,
    language: "en-us",
    associatedProducts: [PRODUCTS[0]],
    languageTitles: [{ lang: "en-us", lcid: 1033, title: categoryName }],
    parentCategoryName: fake.helpers.absent()
});

export const makeProductCategory = (
    title: string = fake.lorem.words(2),
    children: ProductCategory[] = []
): ProductCategory => ({
    id: fake.string.uuid(),
    title,
    children,
    hasChildren: children.length > 0
});

export const makeUserIdentityRef = (): UserIdentityRef => ({
    id: fake.string.uuid(),
    displayName: fake.person.fullName()
});

export const makeQnAItem = (): QnAItem => ({
    id: fake.number.id(),
    text: fake.lorem.sentence(),
    status: QnAItemStatus.UserEditable,
    createdDate: fake.date.recent({ days: 60 }),
    updatedDate: fake.date.recent({ days: 30 }),
    user: makeUserIdentityRef()
});

export const makeResponse = (): Response => ({
    ...makeQnAItem(),
    status: QnAItemStatus.PublisherCreated,
    reCaptchaToken: fake.helpers.absent()
});

export const makeQuestion = (responses: Response[] = [makeResponse()]): Question => ({
    ...makeQnAItem(),
    responses,
    reCaptchaToken: fake.helpers.absent()
});

export const makeConcern = (): Concern => ({
    ...makeQnAItem(),
    category: ConcernCategory.General
});

export const makeReview = (rating: number = fake.number.int({ min: 1, max: 5 })): Review => ({
    id: fake.number.id(),
    rating,
    title: fake.lorem.words(3),
    text: fake.lorem.sentence(),
    productVersion: fake.system.semver(),
    updatedDate: fake.date.recent({ days: 30 }),
    userDisplayName: fake.person.fullName(),
    userId: fake.string.uuid(),
    isDeleted: false,
    isIgnored: false,
    adminReply: fake.helpers.absent(),
    reply: fake.helpers.absent(),
    reCaptchaToken: fake.helpers.absent()
});

export const makeReviewSummary = (source: Review[]): ReviewSummary => ({
    ratingCount: source.length,
    averageRating: source.length === 0 ? 0 : source.reduce((sum, review) => sum + review.rating, 0) / source.length,
    ratingSplit: [1, 2, 3, 4, 5].map(rating => ({
        rating,
        ratingCount: source.filter(review => review.rating === rating).length
    }))
});

export const makeEventCounts = (): EventCounts => ({
    averageRating: fake.number.int({ min: 1, max: 5 }),
    buyCount: 0,
    connectedBuyCount: 0,
    connectedInstallCount: fake.number.int({ min: 0, max: 20 }),
    installCount: fake.number.int({ min: 0, max: 200 }),
    tryCount: 0,
    uninstallCount: fake.number.int({ min: 0, max: 20 }),
    webDownloadCount: fake.number.int({ min: 0, max: 50 }),
    webPageViews: fake.number.int({ min: 0, max: 2_000 })
});

export const makeExtensionDailyStat = (daysAgo = 0, version = "2.0.0"): ExtensionDailyStat => ({
    statisticDate: new Date(Date.now() - daysAgo * DAY_MS),
    version,
    counts: makeEventCounts(),
    extendedStats: {}
});

export const makeExtensionDailyStats = (
    { extensionId, extensionName, publisher }: PublishedExtension,
    dailyStats: ExtensionDailyStat[]
): ExtensionDailyStats => ({
    extensionId,
    extensionName,
    publisherName: publisher.publisherName,
    dailyStats,
    statCount: dailyStats.length
});

export const makeExtensionEvent = (version = "2.0.0"): ExtensionEvent => ({
    id: fake.number.id(),
    version,
    statisticDate: fake.date.recent({ days: 30 }),
    properties: {}
});

export const makeExtensionEvents = (
    { extensionId, extensionName, publisher }: PublishedExtension,
    events: { [key: string]: ExtensionEvent[] }
): ExtensionEvents => ({
    extensionId,
    extensionName,
    publisherName: publisher.publisherName,
    events
});

export const makeAcquisitionOperation = (
    operationType: AcquisitionOperationType = AcquisitionOperationType.Install
): AcquisitionOperation => ({
    operationType,
    operationState: AcquisitionOperationState.Allow,
    reason: fake.helpers.absent()
});

export const makeAcquisitionOptions = (
    itemId: string = `${fake.lorem.slug(2)}.${fake.lorem.slug(2)}`,
    target: string = fake.lorem.word()
): AcquisitionOptions => {
    const defaultOperation = makeAcquisitionOperation();
    return {
        itemId,
        target,
        defaultOperation,
        operations: [defaultOperation, makeAcquisitionOperation(AcquisitionOperationType.Request)]
    };
};

export const makeExtensionDraftAsset = (assetType = `${ASSET_PREFIX}.Icons.Default`): ExtensionDraftAsset =>
    makeExtensionFile(assetType);

export const makeExtensionPayload = (): ExtensionPayload => ({
    displayName: fake.commerce.productName(),
    description: fake.lorem.sentence(),
    fileName: `${fake.lorem.slug(2)}.vsix`,
    type: ExtensionDeploymentTechnology.Vsix,
    installationTargets: [makeInstallationTarget()],
    isPreview: false,
    isSignedByMicrosoft: false,
    isValid: true,
    metadata: [{ key: "version", value: fake.system.semver() }]
});

export const makeExtensionDraft = (
    publisherName: string = fake.lorem.slug(2),
    extensionName: string = fake.lorem.slug(2)
): ExtensionDraft => ({
    id: fake.string.uuid(),
    publisherName,
    extensionName,
    product: PRODUCTS[0],
    draftState: DraftStateType.Unpublished,
    createdDate: fake.date.recent({ days: 2 }),
    lastUpdated: fake.date.recent(),
    payload: makeExtensionPayload(),
    assets: [makeExtensionDraftAsset()],
    validationErrors: [],
    validationWarnings: []
});

export const makePublisherSecurityRole = (name = "Contributor"): PublisherSecurityRole => ({
    name,
    displayName: name,
    description: fake.lorem.sentence(),
    identifier: `gallery.publisher.${name}`,
    scope: "gallery.publisher",
    allowPermissions: name === "Owner" ? 4_095 : 203,
    denyPermissions: 0
});

export const makePublisherRoleAssignment = (roleName = "Contributor"): PublisherRoleAssignment => ({
    access: PublisherRoleAccess.Assigned,
    accessDisplayName: "Assigned",
    identity: makeIdentityRef(),
    role: makePublisherSecurityRole(roleName)
});

export const makeFederatedCredentialPolicy = (
    publisherId: string = fake.string.uuid()
): {
    created: Date;
    createdByIdentityId: string;
    criteria: string;
    key: number;
    lastMatched: Date;
    policyName: string;
    publisherId: string;
    type: number;
} => ({
    key: fake.number.id(),
    policyName: fake.lorem.words(2),
    publisherId,
    type: 0,
    criteria: JSON.stringify({ repository: `${fake.lorem.word()}/${fake.lorem.slug(2)}`, workflow: "release.yml" }),
    created: fake.date.past(),
    createdByIdentityId: fake.string.uuid(),
    lastMatched: fake.helpers.absent()
});

const publisherSeeds: Publisher[] = fake.helpers.distinct(
    3,
    makePublisher,
    publisher => publisher.publisherName,
    publisher => publisher.publisherId
);

export const extensions: PublishedExtension[] = fake.helpers
    .distinct(
        6,
        () => makePublishedExtension(),
        extension => extension.extensionName,
        extension => extension.extensionId
    )
    .map((extension, index) => ({
        ...extension,
        publisher: makePublisherFacts(publisherSeeds[index % publisherSeeds.length]),
        categories: [CATEGORY_NAMES[index % CATEGORY_NAMES.length]]
    }));

export const publishers: Publisher[] = publisherSeeds.map(publisher => ({
    ...publisher,
    extensions: extensions.filter(extension => extension.publisher.publisherId === publisher.publisherId)
}));

export const azurePublishers: AzurePublisher[] = publishers.map(publisher =>
    makeAzurePublisher(publisher.publisherName)
);

export const categories: ExtensionCategory[] = CATEGORY_NAMES.map(name => makeExtensionCategory(name));

export const productCategories: ProductCategory[] = [
    makeProductCategory("Tools", [makeProductCategory("Coding"), makeProductCategory("Testing")]),
    makeProductCategory("Controls"),
    makeProductCategory("Templates", [makeProductCategory("Web")])
];

export const reviews: Review[] = [
    makeReview(5),
    makeReview(4),
    { ...makeReview(4), text: "" },
    { ...makeReview(2), userDisplayName: "" },
    makeReview(5),
    makeReview(1)
].map((review, index) => ({ ...review, updatedDate: new Date(Date.now() - (index + 1) * DAY_MS) }));

export const reviewSummary: ReviewSummary = makeReviewSummary(reviews);

export const questions: Question[] = [
    makeQuestion([makeResponse(), makeResponse()]),
    makeQuestion(),
    makeQuestion([]),
    makeQuestion()
].map((question, index) => ({ ...question, updatedDate: new Date(Date.now() - (index + 1) * DAY_MS) }));

export const events: { [key: string]: ExtensionEvent[] } = {
    install: [makeExtensionEvent(), makeExtensionEvent(), makeExtensionEvent("1.1.0")],
    uninstall: [makeExtensionEvent()],
    review: [makeExtensionEvent(), makeExtensionEvent("1.0.0")]
};

export const roleAssignments: PublisherRoleAssignment[] = [
    makePublisherRoleAssignment("Owner"),
    makePublisherRoleAssignment(),
    makePublisherRoleAssignment("Reader")
];

export const policies = [
    makeFederatedCredentialPolicy(publishers[0].publisherId),
    makeFederatedCredentialPolicy(publishers[0].publisherId),
    makeFederatedCredentialPolicy(publishers[1].publisherId)
];

export const userSettings: { [key: string]: any } = {
    theme: "dark",
    pageSize: 50,
    showPreview: true
};
