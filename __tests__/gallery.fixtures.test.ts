import {
    AcquisitionOperationType,
    DraftStateType,
    ExtensionVersionFlags,
    PublisherRoleAccess,
    QnAItemStatus
} from "azure-devops-extension-api/Gallery";
import {
    azurePublishers,
    categories,
    events,
    extensions,
    makeAcquisitionOperation,
    makeAcquisitionOptions,
    makeAzurePublisher,
    makeBuffer,
    makeEventCounts,
    makeExtensionCategory,
    makeExtensionDailyStat,
    makeExtensionDailyStats,
    makeExtensionDraft,
    makeExtensionDraftAsset,
    makeExtensionEvent,
    makeExtensionFile,
    makeExtensionPayload,
    makeExtensionStatistic,
    makeExtensionVersion,
    makeFederatedCredentialPolicy,
    makeInstallationTarget,
    makeProductCategory,
    makePublishedExtension,
    makePublisher,
    makePublisherFacts,
    makePublisherRoleAssignment,
    makePublisherSecurityRole,
    makeQnAItem,
    makeQuestion,
    makeReview,
    makeReviewSummary,
    makeUserIdentityRef,
    policies,
    productCategories,
    publishers,
    questions,
    reviews,
    roleAssignments
} from "../azure-devops-extension-api/gallery/Data";

const SEEDS = 150;

const duplicates = (values: string[]): string[] => values.filter((value, index) => values.indexOf(value) !== index);

const collisions = (load: () => string[]): string[] => {
    const found: string[] = [];
    for (let index = 0; index < SEEDS; index += 1) {
        const random = jest.spyOn(Math, "random").mockReturnValue(index / SEEDS);
        jest.isolateModules(() => {
            found.push(...duplicates(load()));
        });
        random.mockRestore();
    }
    return found;
};

describe("gallery fixtures", () => {
    it("makes a buffer from text", () => {
        const buffer = makeBuffer("vsix");
        expect(buffer).toBeInstanceOf(ArrayBuffer);
        expect(new TextDecoder().decode(buffer)).toBe("vsix");
    });

    it("makes an installation target", () => {
        expect(makeInstallationTarget()).toEqual({
            target: "Microsoft.VisualStudio.Services",
            targetVersion: "[15.0,)",
            extensionVersion: undefined,
            productArchitecture: undefined,
            targetPlatform: undefined
        });
        expect(makeInstallationTarget("Microsoft.VisualStudio.Code").target).toBe("Microsoft.VisualStudio.Code");
    });

    it("makes an extension file", () => {
        expect(makeExtensionFile().assetType).toBe("Microsoft.VisualStudio.Services.VSIXPackage");
        const file = makeExtensionFile("Icon");
        expect(file.assetType).toBe("Icon");
        expect(file.source.endsWith("/Icon")).toBe(true);
        expect(makeExtensionDraftAsset().assetType).toBe("Microsoft.VisualStudio.Services.Icons.Default");
        expect(makeExtensionDraftAsset("Banner").assetType).toBe("Banner");
    });

    it("makes an extension version", () => {
        const version = makeExtensionVersion("3.2.1");
        expect(version.version).toBe("3.2.1");
        expect(version.flags).toBe(ExtensionVersionFlags.Validated);
        expect(version.files.map(f => f.assetType)).toEqual([
            "Microsoft.VisualStudio.Services.VSIXPackage",
            "Microsoft.VisualStudio.Services.Manifest",
            "Microsoft.VisualStudio.Services.Content.Details",
            "Microsoft.VisualStudio.Services.Icons.Default"
        ]);
        expect(version.badges).toEqual([]);
        expect(version.targetPlatform).toBeUndefined();
        expect(version.validationResultMessage).toBeUndefined();
        expect(makeExtensionVersion().version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("makes a statistic", () => {
        expect(makeExtensionStatistic("install", 7)).toEqual({ statisticName: "install", value: 7 });
    });

    it("makes publisher facts without the extra publisher fields", () => {
        const publisher = makePublisher();
        expect(makePublisherFacts(publisher)).toEqual({
            publisherId: publisher.publisherId,
            publisherName: publisher.publisherName,
            displayName: publisher.displayName,
            flags: publisher.flags,
            domain: publisher.domain,
            isDomainVerified: publisher.isDomainVerified
        });
        expect(Object.keys(makePublisherFacts()).length).toBe(6);
    });

    it("makes an extension of the given publisher", () => {
        const facts = makePublisherFacts(publishers[0]);
        const extension = makePublishedExtension(facts);
        expect(extension.publisher).toBe(facts);
        expect(extension.statistics.map(s => s.statisticName)).toEqual(["install", "averagerating", "ratingcount"]);
        expect(extension.sharedWith).toEqual([]);
        expect(typeof makePublishedExtension().publisher.publisherName).toBe("string");
    });

    it("makes an azure publisher", () => {
        expect(makeAzurePublisher("pub").publisherName).toBe("pub");
        expect(typeof makeAzurePublisher().publisherName).toBe("string");
    });

    it("makes categories", () => {
        expect(makeExtensionCategory("Named").categoryName).toBe("Named");
        expect(typeof makeExtensionCategory().categoryName).toBe("string");
        const child = makeProductCategory("Child");
        const parent = makeProductCategory("Parent", [child]);
        expect(parent.children).toEqual([child]);
        expect(parent.hasChildren).toBe(true);
        expect(child.hasChildren).toBe(false);
        expect(typeof makeProductCategory().title).toBe("string");
    });

    it("makes questions and responses", () => {
        expect(Object.keys(makeUserIdentityRef()).sort()).toEqual(["displayName", "id"]);
        expect(makeQnAItem().status).toBe(QnAItemStatus.UserEditable);
        expect(makeQuestion().responses.length).toBe(1);
        expect(makeQuestion().responses[0].status).toBe(QnAItemStatus.PublisherCreated);
        expect(makeQuestion([]).responses).toEqual([]);
        expect(makeQuestion().reCaptchaToken).toBeUndefined();
    });

    it("makes a review and a summary", () => {
        expect(makeReview(2).rating).toBe(2);
        const rating = makeReview().rating;
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
        expect(makeReviewSummary([makeReview(2), makeReview(5), makeReview(5)])).toEqual({
            ratingCount: 3,
            averageRating: 4,
            ratingSplit: [
                { rating: 1, ratingCount: 0 },
                { rating: 2, ratingCount: 1 },
                { rating: 3, ratingCount: 0 },
                { rating: 4, ratingCount: 0 },
                { rating: 5, ratingCount: 2 }
            ]
        });
        expect(makeReviewSummary([]).averageRating).toBe(0);
    });

    it("makes daily stats", () => {
        expect(Object.keys(makeEventCounts()).length).toBe(9);
        const today = makeExtensionDailyStat();
        const earlier = makeExtensionDailyStat(3, "1.0.0");
        expect(today.version).toBe("2.0.0");
        expect(earlier.version).toBe("1.0.0");
        expect(today.statisticDate.getTime()).toBeGreaterThan(earlier.statisticDate.getTime());
        const stats = makeExtensionDailyStats(extensions[0], [today, earlier]);
        expect(stats.statCount).toBe(2);
        expect(stats.publisherName).toBe(extensions[0].publisher.publisherName);
    });

    it("makes an event", () => {
        expect(makeExtensionEvent().version).toBe("2.0.0");
        expect(makeExtensionEvent("1.0.0").version).toBe("1.0.0");
    });

    it("makes acquisition options", () => {
        expect(makeAcquisitionOperation().operationType).toBe(AcquisitionOperationType.Install);
        expect(makeAcquisitionOperation(AcquisitionOperationType.Buy).operationType).toBe(AcquisitionOperationType.Buy);
        const options = makeAcquisitionOptions();
        expect(options.itemId).toMatch(/^[a-z-]+\.[a-z-]+$/);
        expect(typeof options.target).toBe("string");
        expect(makeAcquisitionOptions("pub.ext", "account").target).toBe("account");
    });

    it("makes a draft", () => {
        expect(makeExtensionPayload().fileName.endsWith(".vsix")).toBe(true);
        const draft = makeExtensionDraft("pub", "ext");
        expect(draft.publisherName).toBe("pub");
        expect(draft.extensionName).toBe("ext");
        expect(draft.draftState).toBe(DraftStateType.Unpublished);
        expect(draft.product).toBe("vsts");
        expect(typeof makeExtensionDraft().publisherName).toBe("string");
        expect(typeof makeExtensionDraft("pub").extensionName).toBe("string");
    });

    it("makes role assignments", () => {
        expect(makePublisherSecurityRole().name).toBe("Contributor");
        expect(makePublisherSecurityRole("Owner").allowPermissions).toBe(4_095);
        expect(makePublisherSecurityRole("Reader").identifier).toBe("gallery.publisher.Reader");
        expect(makePublisherRoleAssignment().role.name).toBe("Contributor");
        expect(makePublisherRoleAssignment("Owner").access).toBe(PublisherRoleAccess.Assigned);
        expect(roleAssignments.map(a => a.role.name)).toEqual(["Owner", "Contributor", "Reader"]);
    });

    it("makes a federated credential policy", () => {
        const policy = makeFederatedCredentialPolicy("publisher-id");
        expect(policy.publisherId).toBe("publisher-id");
        expect(policy.type).toBe(0);
        expect(Object.keys(JSON.parse(policy.criteria))).toEqual(["repository", "workflow"]);
        expect(policy.lastMatched).toBeUndefined();
        expect(typeof makeFederatedCredentialPolicy().publisherId).toBe("string");
    });

    it("seeds two extensions for every publisher", () => {
        expect(publishers.length).toBe(3);
        expect(extensions.length).toBe(6);
        for (const publisher of publishers) {
            expect(publisher.extensions.length).toBe(2);
            for (const extension of publisher.extensions) {
                expect(extensions).toContain(extension);
                expect(extension.publisher).toEqual(makePublisherFacts(publisher));
            }
        }
    });

    it("seeds extensions in seeded categories", () => {
        const names = categories.map(c => c.categoryName);
        for (const extension of extensions) {
            expect(names).toContain(extension.categories[0]);
        }
        expect(new Set(categories.map(c => c.categoryId)).size).toBe(categories.length);
    });

    it("seeds an azure publisher for every publisher", () => {
        expect(azurePublishers.map(a => a.publisherName)).toEqual(publishers.map(p => p.publisherName));
    });

    it("seeds unique keys", () => {
        expect(new Set(reviews.map(r => r.id)).size).toBe(reviews.length);
        expect(new Set(questions.map(q => q.id)).size).toBe(questions.length);
        expect(new Set(policies.map(p => p.key)).size).toBe(policies.length);
        const responseIds = questions.flatMap(q => q.responses.map(r => r.id));
        expect(new Set(responseIds).size).toBe(responseIds.length);
        const eventIds = Object.values(events).flatMap(list => list.map(e => e.id));
        expect(new Set(eventIds).size).toBe(eventIds.length);
        const categoryIds = productCategories.flatMap(c => [c.id, ...c.children.map(child => child.id)]);
        expect(new Set(categoryIds).size).toBe(categoryIds.length);
    });

    it("seeds reviews and questions from newest to oldest", () => {
        const reviewTimes = reviews.map(r => r.updatedDate.getTime());
        expect([...reviewTimes].sort((a, b) => b - a)).toEqual(reviewTimes);
        const questionTimes = questions.map(q => q.updatedDate.getTime());
        expect([...questionTimes].sort((a, b) => b - a)).toEqual(questionTimes);
    });

    it("never seeds two publishers with the same name", () => {
        expect(
            collisions(() =>
                require("../azure-devops-extension-api/gallery/Data").publishers.map(
                    (p: { publisherName: string }) => p.publisherName
                )
            )
        ).toEqual([]);
    });

    it("never seeds two extensions with the same name", () => {
        expect(
            collisions(() =>
                require("../azure-devops-extension-api/gallery/Data").extensions.map(
                    (e: { extensionName: string }) => e.extensionName
                )
            )
        ).toEqual([]);
    });
});
