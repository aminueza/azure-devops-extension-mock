import {
    ExtensionQueryFilterType,
    ExtensionQueryFlags,
    ExtensionStatisticOperation,
    FilterCriteria,
    GalleryRestClient,
    NotificationTemplateType,
    PagingDirection,
    PublishedExtensionFlags,
    QueryFilter,
    VSCodeWebExtensionStatisicsType
} from "azure-devops-extension-api/Gallery";
import { getClient, getRegisteredMockClient, MockGalleryRestClient } from "../azure-devops-extension-api";
import { events, extensions, makeExtensionEvents, publishers } from "../azure-devops-extension-api/gallery/Data";

const DAY_MS = 86_400_000;

const filterOf = (criteria: FilterCriteria[], pageSize = 0, pageNumber = 1): QueryFilter => ({
    criteria,
    direction: PagingDirection.Forward,
    pageNumber,
    pageSize,
    pagingToken: "",
    sortBy: 0,
    sortOrder: 0
});

const criterion = (filterType: ExtensionQueryFilterType, value: string): FilterCriteria => ({ filterType, value });

describe("GalleryRestClient mock: extensions", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GalleryRestClient);
    const known = extensions[0];
    const publisherName = known.publisher.publisherName;

    const query = async (...filters: QueryFilter[]) =>
        (await client.queryExtensions({ assetTypes: [], filters, flags: ExtensionQueryFlags.IncludeVersions })).results;

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(GalleryRestClient)).toBe(MockGalleryRestClient);
    });

    it("shares and unshares an extension", async () => {
        await expect(client.shareExtensionById(known.extensionId, "account")).resolves.toBeUndefined();
        await expect(client.unshareExtensionById(known.extensionId, "account")).resolves.toBeUndefined();
        await expect(client.shareExtension(publisherName, known.extensionName, "account")).resolves.toBeUndefined();
        await expect(client.unshareExtension(publisherName, known.extensionName, "account")).resolves.toBeUndefined();
        await expect(
            client.shareExtensionWithHost(publisherName, known.extensionName, "account", "host")
        ).resolves.toBeUndefined();
        await expect(
            client.unshareExtensionWithHost(publisherName, known.extensionName, "account", "host")
        ).resolves.toBeUndefined();
    });

    it("queries every extension when the filter has no criteria", async () => {
        const [result] = await query(filterOf([]));
        expect(result.extensions).toEqual(extensions);
        expect(result.resultMetadata).toEqual([
            { metadataType: "ResultCount", metadataItems: [{ name: "TotalCount", count: extensions.length }] }
        ]);
        expect(result.pagingToken).toBeUndefined();
    });

    it("queries extensions by tag", async () => {
        const [result] = await query(filterOf([criterion(ExtensionQueryFilterType.Tag, known.tags[0])]));
        expect(result.extensions).toContain(known);
        expect(result.extensions.every(e => e.tags.includes(known.tags[0]))).toBe(true);
    });

    it("queries extensions by display name", async () => {
        const [result] = await query(filterOf([criterion(ExtensionQueryFilterType.DisplayName, known.displayName)]));
        expect(result.extensions).toContain(known);
        expect(result.extensions.every(e => e.displayName === known.displayName)).toBe(true);
    });

    it("queries extensions by id", async () => {
        const [result] = await query(filterOf([criterion(ExtensionQueryFilterType.Id, extensions[2].extensionId)]));
        expect(result.extensions).toEqual([extensions[2]]);
    });

    it("queries extensions by category", async () => {
        const [result] = await query(filterOf([criterion(ExtensionQueryFilterType.Category, "Azure Repos")]));
        expect(result.extensions).toEqual([extensions[1]]);
    });

    it("queries extensions by full name", async () => {
        const target = extensions[3];
        const [result] = await query(
            filterOf([
                criterion(ExtensionQueryFilterType.Name, `${target.publisher.publisherName}.${target.extensionName}`)
            ])
        );
        expect(result.extensions).toEqual([target]);
    });

    it("queries extensions by search text ignoring case", async () => {
        const [result] = await query(
            filterOf([criterion(ExtensionQueryFilterType.SearchText, known.extensionName.toUpperCase())])
        );
        expect(result.extensions).toContain(known);
    });

    it("queries extensions by publisher name", async () => {
        const [result] = await query(filterOf([criterion(ExtensionQueryFilterType.PublisherName, publisherName)]));
        expect(result.extensions).toEqual([extensions[0], extensions[3]]);
    });

    it("queries extensions by publisher display name", async () => {
        const [result] = await query(
            filterOf([criterion(ExtensionQueryFilterType.PublisherDisplayName, known.publisher.displayName)])
        );
        expect(result.extensions).toContain(known);
        expect(result.extensions.every(e => e.publisher.displayName === known.publisher.displayName)).toBe(true);
    });

    it("queries extensions by extension name", async () => {
        const [result] = await query(
            filterOf([criterion(ExtensionQueryFilterType.ExtensionName, extensions[4].extensionName)])
        );
        expect(result.extensions).toEqual([extensions[4]]);
    });

    it("ignores criteria it does not model", async () => {
        const [result] = await query(
            filterOf([criterion(ExtensionQueryFilterType.InstallationTarget, "Microsoft.VisualStudio.Code")])
        );
        expect(result.extensions).toEqual(extensions);
    });

    it("matches any criterion of one type and every type", async () => {
        const [either, both, neither] = await query(
            filterOf([
                criterion(ExtensionQueryFilterType.ExtensionName, extensions[0].extensionName),
                criterion(ExtensionQueryFilterType.ExtensionName, extensions[1].extensionName)
            ]),
            filterOf([
                criterion(ExtensionQueryFilterType.PublisherName, publisherName),
                criterion(ExtensionQueryFilterType.ExtensionName, extensions[3].extensionName)
            ]),
            filterOf([
                criterion(ExtensionQueryFilterType.PublisherName, publisherName),
                criterion(ExtensionQueryFilterType.ExtensionName, extensions[1].extensionName)
            ])
        );
        expect(either.extensions).toEqual([extensions[0], extensions[1]]);
        expect(both.extensions).toEqual([extensions[3]]);
        expect(neither.extensions).toEqual([]);
        expect(neither.resultMetadata[0].metadataItems[0].count).toBe(0);
    });

    it("pages the query result", async () => {
        const [second, first] = await query(filterOf([], 2, 2), filterOf([], 4, 0));
        expect(second.extensions).toEqual(extensions.slice(2, 4));
        expect(second.resultMetadata[0].metadataItems[0].count).toBe(extensions.length);
        expect(first.extensions).toEqual(extensions.slice(0, 4));
    });

    it("returns no result for a query without filters", async () => {
        expect(await query()).toEqual([]);
        const result = await client.queryExtensions({ assetTypes: [], filters: [], flags: 0 }, "token", "header");
        expect(result).toEqual({ results: [] });
    });

    it("queries an extension by vsix id", async () => {
        const byName = await client.queryExtensionByVsixId(`${publisherName}.${known.extensionName}`);
        expect(byName.results.length).toBe(1);
        expect(byName.results[0].extensions).toEqual([known]);
        expect(byName.results[0].resultMetadata[0].metadataItems[0].count).toBe(1);
        const byId = await client.queryExtensionByVsixId(extensions[1].extensionId, "x64", "[17.0,)", "Pro");
        expect(byId.results[0].extensions).toEqual([extensions[1]]);
    });

    it("finds nothing for an unknown vsix id", async () => {
        const result = await client.queryExtensionByVsixId("missing.vsix");
        expect(result.results[0].extensions).toEqual([]);
        expect(result.results[0].resultMetadata[0].metadataItems[0].count).toBe(0);
    });

    it("creates an extension", async () => {
        const created = await client.createExtension("vsix", "Visual Studio Services", "token");
        expect(typeof created.extensionId).toBe("string");
        expect(created.versions.length).toBe(3);
        expect(extensions.map(e => e.extensionId)).not.toContain(created.extensionId);
    });

    it("creates an extension for a known publisher", async () => {
        const created = await client.createExtensionWithPublisher("vsix", publisherName);
        expect(created.publisher).toEqual(known.publisher);
        expect(extensions.map(e => e.extensionId)).not.toContain(created.extensionId);
    });

    it("creates an extension for an unknown publisher", async () => {
        const created = await client.createExtensionWithPublisher("vsix", "missing-publisher", "type", "token");
        expect(created.publisher.publisherName).toBe("missing-publisher");
        expect(Object.keys(created.publisher).sort()).toEqual(Object.keys(known.publisher).sort());
    });

    it("deletes an extension", async () => {
        await expect(client.deleteExtensionById(known.extensionId)).resolves.toBeUndefined();
        await expect(client.deleteExtensionById(known.extensionId, "1.0.0")).resolves.toBeUndefined();
        await expect(client.deleteExtension(publisherName, known.extensionName)).resolves.toBeUndefined();
        await expect(client.deleteExtension(publisherName, known.extensionName, "1.0.0")).resolves.toBeUndefined();
    });

    it("gets a known extension by id", async () => {
        expect(await client.getExtensionById(known.extensionId)).toBe(known);
    });

    it("fabricates an unknown extension by id", async () => {
        const made = await client.getExtensionById("missing-id");
        expect(made.extensionId).toBe("missing-id");
        expect(made.versions.map(v => v.version)).toEqual(["2.0.0", "1.1.0", "1.0.0"]);
        expect(made.presentInConflictList).toBeUndefined();
    });

    it("gets one version of an extension by id", async () => {
        const narrowed = await client.getExtensionById(known.extensionId, "1.1.0", ExtensionQueryFlags.IncludeFiles);
        expect(narrowed.extensionId).toBe(known.extensionId);
        expect(narrowed.versions).toEqual([known.versions[1]]);
        expect(known.versions.length).toBe(3);
    });

    it("fabricates an unknown version of an extension", async () => {
        const narrowed = await client.getExtensionById(known.extensionId, "9.9.9");
        expect(narrowed.versions.length).toBe(1);
        expect(narrowed.versions[0].version).toBe("9.9.9");
        expect(narrowed.versions[0].files.length).toBe(4);
    });

    it("gets a known extension by name", async () => {
        expect(await client.getExtension(publisherName, known.extensionName)).toBe(known);
    });

    it("gets one version of an extension by name", async () => {
        const narrowed = await client.getExtension(
            publisherName,
            known.extensionName,
            "1.0.0",
            ExtensionQueryFlags.AllAttributes,
            "token",
            "header"
        );
        expect(narrowed.versions).toEqual([known.versions[2]]);
    });

    it("fabricates an unknown extension of a known publisher", async () => {
        const made = await client.getExtension(publisherName, "missing-extension");
        expect(made.extensionName).toBe("missing-extension");
        expect(made.publisher).toEqual(known.publisher);
    });

    it("fabricates an unknown extension of an unknown publisher", async () => {
        const made = await client.getExtension("missing-publisher", "missing-extension");
        expect(made.extensionName).toBe("missing-extension");
        expect(made.publisher.publisherName).toBe("missing-publisher");
    });

    it("does not match an extension name under another publisher", async () => {
        const other = publishers[1].publisherName;
        const made = await client.getExtension(other, known.extensionName);
        expect(made).not.toBe(known);
        expect(made.extensionName).toBe(known.extensionName);
        expect(made.publisher.publisherName).toBe(other);
    });

    it("updates an extension", async () => {
        expect(await client.updateExtensionById(known.extensionId)).toBe(known);
        expect((await client.updateExtensionById("missing-id", "token")).extensionId).toBe("missing-id");
        expect(await client.updateExtension("vsix", publisherName, known.extensionName)).toBe(known);
        const made = await client.updateExtension("vsix", "missing-publisher", "missing-extension", "type", "token", true);
        expect(made.extensionName).toBe("missing-extension");
    });

    it("updates the flags of an extension", async () => {
        const updated = await client.updateExtensionProperties(
            publisherName,
            known.extensionName,
            PublishedExtensionFlags.Unpublished
        );
        expect(updated.flags).toBe(PublishedExtensionFlags.Unpublished);
        expect(updated.extensionId).toBe(known.extensionId);
        expect(known.flags).toBe(PublishedExtensionFlags.Validated | PublishedExtensionFlags.Public);
    });

    it("publishes an extension with a publisher signature", async () => {
        expect(await client.publishExtensionWithPublisherSignature("vsix", publisherName, known.extensionName)).toBe(known);
        const made = await client.publishExtensionWithPublisherSignature("vsix", "missing", "ext", "type", "token", false);
        expect(made.publisher.publisherName).toBe("missing");
    });

    it("gets the latest version of a vscode extension", async () => {
        const latest = await client.getVSCodeExtensionLatestVersion(publisherName, known.extensionName);
        expect(latest.versions).toEqual([known.versions[0]]);
        expect(latest.extensionId).toBe(known.extensionId);
    });

    it("validates an extension", async () => {
        await expect(
            client.extensionValidator({
                assetDetails: {
                    answers: { vsMarketplaceExtensionName: known.extensionName, vsMarketplacePublisherName: publisherName },
                    publisherNaturalIdentifier: publisherName
                },
                assetId: "asset",
                assetVersion: 1,
                customerSupportEmail: "support@example.com",
                integrationContactEmail: "contact@example.com",
                operation: "validate",
                planId: "plan",
                publisherId: known.publisher.publisherId,
                type: "extension"
            })
        ).resolves.toBeUndefined();
    });

    it("sends notifications", async () => {
        await expect(
            client.sendNotifications({ data: {}, identities: {}, type: NotificationTemplateType.ReviewNotification })
        ).resolves.toBeUndefined();
    });

    it("gets the events of an extension", async () => {
        const result = await client.getExtensionEvents(publisherName, known.extensionName);
        expect(result).toEqual(makeExtensionEvents(known, events));
        expect(Object.keys(result.events)).toEqual(["install", "uninstall", "review"]);
    });

    it("gets one type of event", async () => {
        const result = await client.getExtensionEvents(publisherName, known.extensionName, undefined, undefined, "install");
        expect(result.events).toEqual({ install: events.install });
        const none = await client.getExtensionEvents(publisherName, known.extensionName, 5, undefined, "missing", "prop");
        expect(none.events).toEqual({});
    });

    it("limits the events by count and date", async () => {
        const counted = await client.getExtensionEvents(publisherName, known.extensionName, 1);
        expect(Object.values(counted.events).map(list => list.length)).toEqual([1, 1, 1]);
        expect(counted.events.install[0]).toBe(events.install[0]);
        const later = await client.getExtensionEvents(publisherName, "missing", undefined, new Date(Date.now() + DAY_MS));
        expect(later.extensionName).toBe("missing");
        expect(later.events).toEqual({ install: [], uninstall: [], review: [] });
        const earlier = await client.getExtensionEvents(publisherName, "missing", undefined, new Date(0));
        expect(earlier.events).toEqual(events);
    });

    it("publishes extension events", async () => {
        await expect(client.publishExtensionEvents([makeExtensionEvents(known, events)])).resolves.toBeUndefined();
    });

    it("updates extension statistics", async () => {
        await expect(
            client.updateExtensionStatistics(
                {
                    extensionName: known.extensionName,
                    publisherName,
                    operation: ExtensionStatisticOperation.Increment,
                    statistic: { statisticName: "install", value: 1 }
                },
                publisherName,
                known.extensionName
            )
        ).resolves.toBeUndefined();
        await expect(
            client.incrementExtensionDailyStat(publisherName, known.extensionName, "2.0.0", "install")
        ).resolves.toBeUndefined();
        await expect(
            client.incrementExtensionDailyStat(publisherName, known.extensionName, "2.0.0", "install", "win32-x64")
        ).resolves.toBeUndefined();
        await expect(
            client.updateVSCodeWebExtensionStatistics("item", "2.0.0", VSCodeWebExtensionStatisicsType.Install)
        ).resolves.toBeUndefined();
    });

    it("gets the daily stats of an extension", async () => {
        const stats = await client.getExtensionDailyStats(publisherName, known.extensionName);
        expect(stats.extensionId).toBe(known.extensionId);
        expect(stats.extensionName).toBe(known.extensionName);
        expect(stats.publisherName).toBe(publisherName);
        expect(stats.statCount).toBe(30);
        expect(stats.dailyStats.length).toBe(30);
        expect(stats.dailyStats.every(s => s.version === "2.0.0")).toBe(true);
        expect(stats.dailyStats[0].statisticDate.getTime()).toBeGreaterThan(stats.dailyStats[1].statisticDate.getTime());
    });

    it("limits the daily stats by days and date", async () => {
        const three = await client.getExtensionDailyStats(publisherName, known.extensionName, 3);
        expect(three.statCount).toBe(3);
        const recent = await client.getExtensionDailyStats(
            publisherName,
            "missing",
            5,
            undefined,
            new Date(Date.now() - 1.5 * DAY_MS)
        );
        expect(recent.extensionName).toBe("missing");
        expect(recent.statCount).toBe(2);
        expect(recent.dailyStats.length).toBe(2);
    });

    it("gets the anonymous daily stats of a version", async () => {
        const stats = await client.getExtensionDailyStatsAnonymous(publisherName, known.extensionName, "1.0.0");
        expect(stats.extensionId).toBe(known.extensionId);
        expect(stats.statCount).toBe(30);
        expect(stats.dailyStats.every(s => s.version === "1.0.0")).toBe(true);
    });

    it("gets the reports of an extension", async () => {
        const report = await client.getExtensionReports(publisherName, known.extensionName);
        expect(report.extensionId).toBe(known.extensionId);
        expect(report.statCount).toBe(30);
        expect(report.reviewSummary.ratingCount).toBe(6);
        const short = await client.getExtensionReports(publisherName, "missing", 4, 10, new Date(Date.now() - 2.5 * DAY_MS));
        expect(short.extensionName).toBe("missing");
        expect(short.statCount).toBe(3);
    });
});
