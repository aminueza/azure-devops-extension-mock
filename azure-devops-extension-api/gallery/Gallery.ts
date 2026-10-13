import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    AcquisitionOptions,
    AzurePublisher,
    AzureRestApiRequestModel,
    CategoriesResult,
    Concern,
    CustomerSupportRequest,
    DraftPatchOperation,
    DraftStateType,
    ExtensionAcquisitionRequest,
    ExtensionCategory,
    ExtensionDailyStats,
    ExtensionDraft,
    ExtensionDraftAsset,
    ExtensionDraftPatch,
    ExtensionEvents,
    ExtensionQuery,
    ExtensionQueryFilterType,
    ExtensionQueryFlags,
    ExtensionQueryResult,
    ExtensionStatisticUpdate,
    ExtensionStatsAggregateType,
    GalleryRestClient,
    NotificationsData,
    ProductCategoriesResult,
    ProductCategory,
    PublishedExtension,
    PublishedExtensionFlags,
    Publisher,
    PublisherQuery,
    PublisherQueryResult,
    PublisherRoleAssignment,
    PublisherUserRoleAssignmentRef,
    QueryFilter,
    Question,
    QuestionsResult,
    Response,
    Review,
    ReviewFilterOptions,
    ReviewPatch,
    ReviewsResult,
    ReviewSummary,
    VSCodeWebExtensionStatisicsType
} from "azure-devops-extension-api/Gallery";
import {
    azurePublishers,
    categories,
    events,
    extensions,
    makeAcquisitionOptions,
    makeAzurePublisher,
    makeBuffer,
    makeConcern,
    makeExtensionCategory,
    makeExtensionDailyStat,
    makeExtensionDailyStats,
    makeExtensionDraft,
    makeExtensionDraftAsset,
    makeExtensionEvents,
    makeExtensionFilterResult,
    makeExtensionVersion,
    makeFederatedCredentialPolicy,
    makeProductCategory,
    makePublishedExtension,
    makePublisher,
    makePublisherFacts,
    makePublisherRoleAssignment,
    makeQuestion,
    makeResponse,
    makeReview,
    makeReviewSummary,
    policies,
    productCategories,
    publishers,
    questions,
    reviews,
    userSettings
} from "./Data";

const DEFAULT_STAT_DAYS = 30;
const DEFAULT_QUESTION_COUNT = 10;
const DEFAULT_REVIEW_COUNT = 5;

const findPublisher = (publisherName: string): Publisher =>
    publishers.find(p => p.publisherName === publisherName) ?? { ...makePublisher(), publisherName };

const findExtension = (publisherName: string, extensionName: string): PublishedExtension =>
    extensions.find(e => e.publisher.publisherName === publisherName && e.extensionName === extensionName) ?? {
        ...makePublishedExtension(makePublisherFacts(findPublisher(publisherName))),
        extensionName
    };

const findExtensionById = (extensionId: string): PublishedExtension =>
    extensions.find(e => e.extensionId === extensionId) ?? { ...makePublishedExtension(), extensionId };

const atVersion = (extension: PublishedExtension, version?: string): PublishedExtension =>
    version === undefined
        ? extension
        : {
              ...extension,
              versions: [extension.versions.find(v => v.version === version) ?? makeExtensionVersion(version)]
          };

const findAzurePublisher = (publisherName: string): AzurePublisher =>
    azurePublishers.find(a => a.publisherName === publisherName) ?? makeAzurePublisher(publisherName);

const findCategory = (categoryName: string): ExtensionCategory =>
    categories.find(c => c.categoryName === categoryName) ?? makeExtensionCategory(categoryName);

const findProductCategory = (categoryId: string): ProductCategory =>
    productCategories.flatMap(c => [c, ...c.children]).find(c => c.id === categoryId) ?? {
        ...makeProductCategory(),
        id: categoryId
    };

const findQuestion = (questionId: number): Question =>
    questions.find(q => q.id === questionId) ?? { ...makeQuestion(), id: questionId };

const findResponse = (questionId: number, responseId: number): Response => {
    const { responses } = findQuestion(questionId);
    return responses.find(r => r.id === responseId) ?? { ...makeResponse(), id: responseId };
};

const findReview = (reviewId: number): Review =>
    reviews.find(r => r.id === reviewId) ?? { ...makeReview(), id: reviewId };

const fullName = (extension: PublishedExtension): string =>
    `${extension.publisher.publisherName}.${extension.extensionName}`;

const EXTENSION_MATCHERS: { [filterType: number]: (extension: PublishedExtension, value: string) => boolean } = {
    [ExtensionQueryFilterType.Tag]: (extension, value) => extension.tags.includes(value),
    [ExtensionQueryFilterType.DisplayName]: (extension, value) => extension.displayName === value,
    [ExtensionQueryFilterType.Id]: (extension, value) => extension.extensionId === value,
    [ExtensionQueryFilterType.Category]: (extension, value) => extension.categories.includes(value),
    [ExtensionQueryFilterType.Name]: (extension, value) => fullName(extension) === value,
    [ExtensionQueryFilterType.SearchText]: (extension, value) =>
        `${fullName(extension)} ${extension.displayName} ${extension.shortDescription}`
            .toLowerCase()
            .includes(value.toLowerCase()),
    [ExtensionQueryFilterType.PublisherName]: (extension, value) => extension.publisher.publisherName === value,
    [ExtensionQueryFilterType.PublisherDisplayName]: (extension, value) => extension.publisher.displayName === value,
    [ExtensionQueryFilterType.ExtensionName]: (extension, value) => extension.extensionName === value
};

const matchesFilter = (extension: PublishedExtension, filter: QueryFilter): boolean =>
    filter.criteria.every(
        criterion =>
            !(criterion.filterType in EXTENSION_MATCHERS) ||
            filter.criteria.some(
                other =>
                    other.filterType === criterion.filterType &&
                    EXTENSION_MATCHERS[other.filterType](extension, other.value)
            )
    );

const pageOf = <T>(source: T[], filter: QueryFilter): T[] => {
    const size = filter.pageSize > 0 ? filter.pageSize : source.length;
    const start = (Math.max(filter.pageNumber, 1) - 1) * size;
    return source.slice(start, start + size);
};

const inDateRange = (date: Date, beforeDate?: Date, afterDate?: Date): boolean =>
    (beforeDate === undefined || date < beforeDate) && (afterDate === undefined || date > afterDate);

const assetBuffer = (...parts: string[]): ArrayBuffer => makeBuffer(parts.join("/"));

const latestVersion = (extension: PublishedExtension): string => extension.versions[0].version;

const withFileName = (draft: ExtensionDraft, fileName?: string): ExtensionDraft =>
    fileName === undefined ? draft : { ...draft, payload: { ...draft.payload, fileName } };

const patchedDraft = (draft: ExtensionDraft, draftPatch: ExtensionDraftPatch, draftId: string): ExtensionDraft => ({
    ...draft,
    id: draftId,
    draftState:
        draftPatch.operation === DraftPatchOperation.Publish ? DraftStateType.Published : DraftStateType.Cancelled
});

const dailyStats = (
    extension: PublishedExtension,
    days: number,
    version: string,
    afterDate?: Date
): ExtensionDailyStats => {
    const stats = Array.from({ length: days }, (_, index) => makeExtensionDailyStat(index, version));
    return makeExtensionDailyStats(
        extension,
        stats.filter(s => inDateRange(s.statisticDate, undefined, afterDate))
    );
};

export class MockGalleryRestClient extends RestClientBase {
    public TYPE = GalleryRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    shareExtensionById(_extensionId: string, _accountName: string): Promise<void> {
        return Promise.resolve();
    }

    unshareExtensionById(_extensionId: string, _accountName: string): Promise<void> {
        return Promise.resolve();
    }

    shareExtension(_publisherName: string, _extensionName: string, _accountName: string): Promise<void> {
        return Promise.resolve();
    }

    unshareExtension(_publisherName: string, _extensionName: string, _accountName: string): Promise<void> {
        return Promise.resolve();
    }

    getAcquisitionOptions(
        itemId: string,
        installationTarget: string,
        _testCommerce?: boolean,
        _isFreeOrTrialInstall?: boolean
    ): Promise<AcquisitionOptions> {
        return Promise.resolve(makeAcquisitionOptions(itemId, installationTarget));
    }

    requestAcquisition(acquisitionRequest: ExtensionAcquisitionRequest): Promise<ExtensionAcquisitionRequest> {
        return Promise.resolve({ ...acquisitionRequest });
    }

    getAssetByName(
        publisherName: string,
        extensionName: string,
        version: string,
        assetType: string,
        _accountToken?: string,
        _acceptDefault?: boolean,
        _accountTokenHeader?: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(assetBuffer(publisherName, extensionName, version, assetType));
    }

    getAsset(
        extensionId: string,
        version: string,
        assetType: string,
        _accountToken?: string,
        _acceptDefault?: boolean,
        _accountTokenHeader?: string
    ): Promise<ArrayBuffer> {
        const extension = findExtensionById(extensionId);
        return Promise.resolve(
            assetBuffer(extension.publisher.publisherName, extension.extensionName, version, assetType)
        );
    }

    getAssetAuthenticated(
        publisherName: string,
        extensionName: string,
        version: string,
        assetType: string,
        _accountToken?: string,
        _accountTokenHeader?: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(assetBuffer(publisherName, extensionName, version, assetType));
    }

    associateAzurePublisher(publisherName: string, azurePublisherId: string): Promise<AzurePublisher> {
        return Promise.resolve({ publisherName, azurePublisherId });
    }

    queryAssociatedAzurePublisher(publisherName: string): Promise<AzurePublisher> {
        return Promise.resolve(findAzurePublisher(publisherName));
    }

    getCategories(_languages?: string): Promise<string[]> {
        return Promise.resolve(categories.map(c => c.categoryName));
    }

    getCategoryDetails(categoryName: string, _languages?: string, _product?: string): Promise<CategoriesResult> {
        return Promise.resolve({ categories: [findCategory(categoryName)] });
    }

    getCategoryTree(
        _product: string,
        categoryId: string,
        _lcid?: number,
        _source?: string,
        _productVersion?: string,
        _skus?: string,
        _subSkus?: string,
        _productArchitecture?: string
    ): Promise<ProductCategory> {
        return Promise.resolve(findProductCategory(categoryId));
    }

    getRootCategories(
        _product: string,
        _lcid?: number,
        _source?: string,
        _productVersion?: string,
        _skus?: string,
        _subSkus?: string
    ): Promise<ProductCategoriesResult> {
        return Promise.resolve({ categories: productCategories });
    }

    getCertificate(publisherName: string, extensionName: string, version?: string): Promise<ArrayBuffer> {
        return Promise.resolve(
            assetBuffer(
                publisherName,
                extensionName,
                version ?? latestVersion(findExtension(publisherName, extensionName)),
                "certificate"
            )
        );
    }

    createSupportRequest(_customerSupportRequest: CustomerSupportRequest): Promise<void> {
        return Promise.resolve();
    }

    createDraftForEditExtension(publisherName: string, extensionName: string): Promise<ExtensionDraft> {
        return Promise.resolve(makeExtensionDraft(publisherName, extensionName));
    }

    performEditExtensionDraftOperation(
        draftPatch: ExtensionDraftPatch,
        publisherName: string,
        extensionName: string,
        draftId: string
    ): Promise<ExtensionDraft> {
        return Promise.resolve(patchedDraft(makeExtensionDraft(publisherName, extensionName), draftPatch, draftId));
    }

    updatePayloadInDraftForEditExtension(
        _content: unknown,
        publisherName: string,
        extensionName: string,
        draftId: string,
        fileName?: string
    ): Promise<ExtensionDraft> {
        return Promise.resolve(
            withFileName({ ...makeExtensionDraft(publisherName, extensionName), id: draftId }, fileName)
        );
    }

    addAssetForEditExtensionDraft(
        _content: string,
        _publisherName: string,
        _extensionName: string,
        _draftId: string,
        assetType: string
    ): Promise<ExtensionDraftAsset> {
        return Promise.resolve(makeExtensionDraftAsset(assetType));
    }

    createDraftForNewExtension(
        _content: unknown,
        publisherName: string,
        product: string,
        fileName?: string
    ): Promise<ExtensionDraft> {
        return Promise.resolve(withFileName({ ...makeExtensionDraft(publisherName), product }, fileName));
    }

    performNewExtensionDraftOperation(
        draftPatch: ExtensionDraftPatch,
        publisherName: string,
        draftId: string
    ): Promise<ExtensionDraft> {
        return Promise.resolve(patchedDraft(makeExtensionDraft(publisherName), draftPatch, draftId));
    }

    updatePayloadInDraftForNewExtension(
        _content: unknown,
        publisherName: string,
        draftId: string,
        fileName?: string
    ): Promise<ExtensionDraft> {
        return Promise.resolve(withFileName({ ...makeExtensionDraft(publisherName), id: draftId }, fileName));
    }

    addAssetForNewExtensionDraft(
        _content: string,
        _publisherName: string,
        _draftId: string,
        assetType: string
    ): Promise<ExtensionDraftAsset> {
        return Promise.resolve(makeExtensionDraftAsset(assetType));
    }

    getAssetFromEditExtensionDraft(
        publisherName: string,
        draftId: string,
        assetType: string,
        extensionName: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(assetBuffer(publisherName, extensionName, draftId, assetType));
    }

    getAssetFromNewExtensionDraft(publisherName: string, draftId: string, assetType: string): Promise<ArrayBuffer> {
        return Promise.resolve(assetBuffer(publisherName, draftId, assetType));
    }

    getExtensionEvents(
        publisherName: string,
        extensionName: string,
        count?: number,
        afterDate?: Date,
        include?: string,
        _includeProperty?: string
    ): Promise<ExtensionEvents> {
        const selected = Object.entries(events)
            .filter(([eventType]) => include === undefined || eventType === include)
            .map(([eventType, list]): [string, typeof list] => [
                eventType,
                list.filter(e => inDateRange(e.statisticDate, undefined, afterDate)).slice(0, count ?? list.length)
            ]);
        return Promise.resolve(
            makeExtensionEvents(findExtension(publisherName, extensionName), Object.fromEntries(selected))
        );
    }

    publishExtensionEvents(_extensionEvents: ExtensionEvents[]): Promise<void> {
        return Promise.resolve();
    }

    queryExtensions(
        extensionQuery: ExtensionQuery,
        _accountToken?: string,
        _accountTokenHeader?: string
    ): Promise<ExtensionQueryResult> {
        return Promise.resolve({
            results: extensionQuery.filters.map(filter => {
                const matching = extensions.filter(e => matchesFilter(e, filter));
                return makeExtensionFilterResult(pageOf(matching, filter), matching.length);
            })
        });
    }

    createExtension(_content: unknown, _extensionType?: string, _reCaptchaToken?: string): Promise<PublishedExtension> {
        return Promise.resolve(makePublishedExtension());
    }

    deleteExtensionById(_extensionId: string, _version?: string): Promise<void> {
        return Promise.resolve();
    }

    getExtensionById(extensionId: string, version?: string, _flags?: ExtensionQueryFlags): Promise<PublishedExtension> {
        return Promise.resolve(atVersion(findExtensionById(extensionId), version));
    }

    updateExtensionById(extensionId: string, _reCaptchaToken?: string): Promise<PublishedExtension> {
        return Promise.resolve(findExtensionById(extensionId));
    }

    createExtensionWithPublisher(
        _content: unknown,
        publisherName: string,
        _extensionType?: string,
        _reCaptchaToken?: string
    ): Promise<PublishedExtension> {
        return Promise.resolve(makePublishedExtension(makePublisherFacts(findPublisher(publisherName))));
    }

    deleteExtension(_publisherName: string, _extensionName: string, _version?: string): Promise<void> {
        return Promise.resolve();
    }

    getExtension(
        publisherName: string,
        extensionName: string,
        version?: string,
        _flags?: ExtensionQueryFlags,
        _accountToken?: string,
        _accountTokenHeader?: string
    ): Promise<PublishedExtension> {
        return Promise.resolve(atVersion(findExtension(publisherName, extensionName), version));
    }

    updateExtension(
        _content: unknown,
        publisherName: string,
        extensionName: string,
        _extensionType?: string,
        _reCaptchaToken?: string,
        _bypassScopeCheck?: boolean
    ): Promise<PublishedExtension> {
        return Promise.resolve(findExtension(publisherName, extensionName));
    }

    updateExtensionProperties(
        publisherName: string,
        extensionName: string,
        flags: PublishedExtensionFlags
    ): Promise<PublishedExtension> {
        return Promise.resolve({ ...findExtension(publisherName, extensionName), flags });
    }

    shareExtensionWithHost(
        _publisherName: string,
        _extensionName: string,
        _hostType: string,
        _hostName: string
    ): Promise<void> {
        return Promise.resolve();
    }

    unshareExtensionWithHost(
        _publisherName: string,
        _extensionName: string,
        _hostType: string,
        _hostName: string
    ): Promise<void> {
        return Promise.resolve();
    }

    extensionValidator(_azureRestApiRequestModel: AzureRestApiRequestModel): Promise<void> {
        return Promise.resolve();
    }

    deletePolicy(_publisherName: string, _policyId: number): Promise<void> {
        return Promise.resolve();
    }

    addPolicy(
        policy: {
            created: Date;
            createdByIdentityId: string;
            criteria: string;
            key: number;
            lastMatched: Date;
            policyName: string;
            publisherId: string;
            type: number;
        },
        publisherName: string
    ): Promise<{
        created: Date;
        createdByIdentityId: string;
        criteria: string;
        key: number;
        lastMatched: Date;
        policyName: string;
        publisherId: string;
        type: number;
    }> {
        const { publisherId } = findPublisher(publisherName);
        return Promise.resolve({ ...makeFederatedCredentialPolicy(publisherId), ...policy, publisherId });
    }

    listPolicies(publisherName: string): Promise<
        {
            created: Date;
            createdByIdentityId: string;
            criteria: string;
            key: number;
            lastMatched: Date;
            policyName: string;
            publisherId: string;
            type: number;
        }[]
    > {
        const { publisherId } = findPublisher(publisherName);
        return Promise.resolve(policies.filter(p => p.publisherId === publisherId));
    }

    sendNotifications(_notificationData: NotificationsData): Promise<void> {
        return Promise.resolve();
    }

    getPackage(
        publisherName: string,
        extensionName: string,
        version: string,
        _accountToken?: string,
        _acceptDefault?: boolean,
        _accountTokenHeader?: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(assetBuffer(publisherName, extensionName, version, "package.vsix"));
    }

    getAssetWithToken(
        publisherName: string,
        extensionName: string,
        version: string,
        assetType: string,
        _assetToken?: string,
        _accountToken?: string,
        _acceptDefault?: boolean,
        _accountTokenHeader?: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(assetBuffer(publisherName, extensionName, version, assetType));
    }

    deletePublisherAsset(_publisherName: string, _assetType?: string): Promise<void> {
        return Promise.resolve();
    }

    getPublisherAsset(publisherName: string, assetType?: string): Promise<ArrayBuffer> {
        return Promise.resolve(assetBuffer(publisherName, assetType ?? "logo"));
    }

    updatePublisherAsset(
        _content: unknown,
        publisherName: string,
        assetType?: string,
        fileName?: string
    ): Promise<{ [key: string]: string }> {
        const type = assetType ?? "logo";
        return Promise.resolve({
            [type]: `${findPublisher(publisherName).domain}/${publisherName}/${fileName ?? type}`
        });
    }

    fetchDomainToken(publisherName: string): Promise<string> {
        return Promise.resolve(findPublisher(publisherName).publisherId);
    }

    verifyDomainToken(_publisherName: string): Promise<void> {
        return Promise.resolve();
    }

    queryPublishers(publisherQuery: PublisherQuery): Promise<PublisherQueryResult> {
        return Promise.resolve({
            results: publisherQuery.filters.map(filter => ({
                publishers: pageOf(
                    publishers.filter(
                        p => filter.criteria.length === 0 || filter.criteria.some(c => c.value === p.publisherName)
                    ),
                    filter
                )
            }))
        });
    }

    createPublisher(publisher: Publisher): Promise<Publisher> {
        return Promise.resolve({ ...makePublisher(), ...publisher });
    }

    deletePublisher(_publisherName: string): Promise<void> {
        return Promise.resolve();
    }

    getPublisher(publisherName: string, _flags?: number): Promise<Publisher> {
        return Promise.resolve(findPublisher(publisherName));
    }

    updatePublisher(publisher: Publisher, publisherName: string): Promise<Publisher> {
        return Promise.resolve({ ...findPublisher(publisherName), ...publisher, publisherName });
    }

    updatePublisherMembers(
        roleAssignments: PublisherUserRoleAssignmentRef[],
        _publisherName: string,
        _limitToCallerIdentityDomain?: boolean
    ): Promise<PublisherRoleAssignment[]> {
        return Promise.resolve(
            roleAssignments.map(({ roleName, uniqueName, userId }) => {
                const assignment = makePublisherRoleAssignment(roleName);
                return { ...assignment, identity: { ...assignment.identity, id: userId, uniqueName } };
            })
        );
    }

    publishExtensionWithPublisherSignature(
        _content: unknown,
        publisherName: string,
        extensionName: string,
        _extensionType?: string,
        _reCaptchaToken?: string,
        _bypassScopeCheck?: boolean
    ): Promise<PublishedExtension> {
        return Promise.resolve(findExtension(publisherName, extensionName));
    }

    getPublisherWithoutToken(publisherName: string): Promise<Publisher> {
        return Promise.resolve(findPublisher(publisherName));
    }

    getQuestions(
        _publisherName: string,
        _extensionName: string,
        count?: number,
        page?: number,
        afterDate?: Date
    ): Promise<QuestionsResult> {
        const matching = questions.filter(q => inDateRange(q.updatedDate, undefined, afterDate));
        const size = count ?? DEFAULT_QUESTION_COUNT;
        const start = ((page ?? 1) - 1) * size;
        return Promise.resolve({
            questions: matching.slice(start, start + size),
            hasMoreQuestions: start + size < matching.length
        });
    }

    reportQuestion(concern: Concern, _pubName: string, _extName: string, _questionId: number): Promise<Concern> {
        return Promise.resolve({ ...makeConcern(), ...concern });
    }

    createQuestion(question: Question, _publisherName: string, _extensionName: string): Promise<Question> {
        return Promise.resolve({ ...makeQuestion([]), ...question });
    }

    deleteQuestion(_publisherName: string, _extensionName: string, _questionId: number): Promise<void> {
        return Promise.resolve();
    }

    updateQuestion(
        question: Question,
        _publisherName: string,
        _extensionName: string,
        questionId: number
    ): Promise<Question> {
        return Promise.resolve({ ...findQuestion(questionId), ...question, id: questionId });
    }

    createResponse(
        response: Response,
        _publisherName: string,
        _extensionName: string,
        _questionId: number
    ): Promise<Response> {
        return Promise.resolve({ ...makeResponse(), ...response });
    }

    deleteResponse(
        _publisherName: string,
        _extensionName: string,
        _questionId: number,
        _responseId: number
    ): Promise<void> {
        return Promise.resolve();
    }

    updateResponse(
        response: Response,
        _publisherName: string,
        _extensionName: string,
        questionId: number,
        responseId: number
    ): Promise<Response> {
        return Promise.resolve({ ...findResponse(questionId, responseId), ...response, id: responseId });
    }

    getExtensionReports(
        publisherName: string,
        extensionName: string,
        days?: number,
        _count?: number,
        afterDate?: Date
    ): Promise<unknown> {
        const extension = findExtension(publisherName, extensionName);
        return Promise.resolve({
            ...dailyStats(extension, days ?? DEFAULT_STAT_DAYS, latestVersion(extension), afterDate),
            reviewSummary: makeReviewSummary(reviews)
        });
    }

    getReviews(
        _publisherName: string,
        _extensionName: string,
        count?: number,
        filterOptions?: ReviewFilterOptions,
        beforeDate?: Date,
        afterDate?: Date
    ): Promise<ReviewsResult> {
        const options = filterOptions ?? ReviewFilterOptions.None;
        const matching = reviews.filter(
            r =>
                inDateRange(r.updatedDate, beforeDate, afterDate) &&
                ((options & ReviewFilterOptions.FilterEmptyReviews) === 0 || r.text !== "") &&
                ((options & ReviewFilterOptions.FilterEmptyUserNames) === 0 || r.userDisplayName !== "")
        );
        const size = count ?? DEFAULT_REVIEW_COUNT;
        return Promise.resolve({
            reviews: matching.slice(0, size),
            hasMoreReviews: size < matching.length,
            totalReviewCount: matching.length
        });
    }

    getReviewsSummary(_pubName: string, _extName: string, beforeDate?: Date, afterDate?: Date): Promise<ReviewSummary> {
        return Promise.resolve(
            makeReviewSummary(reviews.filter(r => inDateRange(r.updatedDate, beforeDate, afterDate)))
        );
    }

    createReview(review: Review, _pubName: string, _extName: string): Promise<Review> {
        return Promise.resolve({ ...makeReview(), ...review });
    }

    deleteReview(_pubName: string, _extName: string, _reviewId: number): Promise<void> {
        return Promise.resolve();
    }

    updateReview(reviewPatch: ReviewPatch, _pubName: string, _extName: string, reviewId: number): Promise<ReviewPatch> {
        return Promise.resolve({
            ...reviewPatch,
            reviewItem: { ...findReview(reviewId), ...reviewPatch.reviewItem, id: reviewId }
        });
    }

    createCategory(category: ExtensionCategory): Promise<ExtensionCategory> {
        return Promise.resolve({ ...makeExtensionCategory(), ...category });
    }

    getGalleryUserSettings(_userScope: string, key?: string): Promise<{ [key: string]: unknown }> {
        if (key === undefined) {
            return Promise.resolve(userSettings);
        }
        return Promise.resolve(key in userSettings ? { [key]: userSettings[key] } : {});
    }

    setGalleryUserSettings(_entries: { [key: string]: unknown }, _userScope: string): Promise<void> {
        return Promise.resolve();
    }

    generateKey(_keyType: string, _expireCurrentSeconds?: number): Promise<void> {
        return Promise.resolve();
    }

    getSigningKey(keyType: string): Promise<string> {
        return Promise.resolve(`${keyType}-signing-key`);
    }

    updateExtensionStatistics(
        _extensionStatisticsUpdate: ExtensionStatisticUpdate,
        _publisherName: string,
        _extensionName: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getExtensionDailyStats(
        publisherName: string,
        extensionName: string,
        days?: number,
        _aggregate?: ExtensionStatsAggregateType,
        afterDate?: Date
    ): Promise<ExtensionDailyStats> {
        const extension = findExtension(publisherName, extensionName);
        return Promise.resolve(dailyStats(extension, days ?? DEFAULT_STAT_DAYS, latestVersion(extension), afterDate));
    }

    getExtensionDailyStatsAnonymous(
        publisherName: string,
        extensionName: string,
        version: string
    ): Promise<ExtensionDailyStats> {
        return Promise.resolve(dailyStats(findExtension(publisherName, extensionName), DEFAULT_STAT_DAYS, version));
    }

    incrementExtensionDailyStat(
        _publisherName: string,
        _extensionName: string,
        _version: string,
        _statType: string,
        _targetPlatform?: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getVerificationLog(
        publisherName: string,
        extensionName: string,
        version: string,
        targetPlatform?: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(
            assetBuffer(publisherName, extensionName, version, targetPlatform ?? "universal", "verification.log")
        );
    }

    getVSCodeExtensionLatestVersion(publisherName: string, extensionName: string): Promise<PublishedExtension> {
        const extension = findExtension(publisherName, extensionName);
        return Promise.resolve(atVersion(extension, latestVersion(extension)));
    }

    updateVSCodeWebExtensionStatistics(
        _itemName: string,
        _version: string,
        _statType: VSCodeWebExtensionStatisicsType
    ): Promise<void> {
        return Promise.resolve();
    }

    queryExtensionByVsixId(
        vsixId: string,
        _arch?: string,
        _versionRange?: string,
        _sku?: string
    ): Promise<ExtensionQueryResult> {
        const matching = extensions.filter(e => fullName(e) === vsixId || e.extensionId === vsixId);
        return Promise.resolve({ results: [makeExtensionFilterResult(matching, matching.length)] });
    }
}
