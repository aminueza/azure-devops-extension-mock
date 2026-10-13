import {
    FilterCriteria,
    GalleryRestClient,
    PagingDirection,
    Publisher,
    PublisherFlags,
    PublisherQueryFlags,
    QueryFilter
} from "azure-devops-extension-api/Gallery";
import { getClient } from "../azure-devops-extension-api";
import {
    azurePublishers,
    makeFederatedCredentialPolicy,
    makePublisher,
    policies,
    publishers
} from "../azure-devops-extension-api/gallery/Data";

const decode = (buffer: ArrayBuffer): string => new TextDecoder().decode(buffer);

const filterOf = (criteria: FilterCriteria[], pageSize = 0, pageNumber = 1): QueryFilter => ({
    criteria,
    direction: PagingDirection.Forward,
    pageNumber,
    pageSize,
    pagingToken: "",
    sortBy: 0,
    sortOrder: 0
});

describe("GalleryRestClient mock: publishers", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GalleryRestClient);
    const known = publishers[0];

    it("queries every publisher when the filter has no criteria", async () => {
        const result = await client.queryPublishers({
            filters: [filterOf([])],
            flags: PublisherQueryFlags.IncludeExtensions
        });
        expect(result.results.length).toBe(1);
        expect(result.results[0].publishers).toEqual(publishers);
    });

    it("queries publishers by name", async () => {
        const result = await client.queryPublishers({
            filters: [
                filterOf([
                    { filterType: 18, value: publishers[2].publisherName },
                    { filterType: 18, value: publishers[0].publisherName }
                ]),
                filterOf([{ filterType: 18, value: "missing-publisher" }]),
                filterOf([], 2, 2)
            ],
            flags: PublisherQueryFlags.None
        });
        expect(result.results[0].publishers).toEqual([publishers[0], publishers[2]]);
        expect(result.results[1].publishers).toEqual([]);
        expect(result.results[2].publishers).toEqual([publishers[2]]);
    });

    it("returns no result for a publisher query without filters", async () => {
        expect(await client.queryPublishers({ filters: [], flags: PublisherQueryFlags.None })).toEqual({ results: [] });
    });

    it("creates a publisher echoing the posted object", async () => {
        const posted: Publisher = { ...makePublisher(), displayName: "Posted", flags: PublisherFlags.Certified };
        const created = await client.createPublisher(posted);
        expect(created).toEqual(posted);
        expect(created).not.toBe(posted);
    });

    it("fills a partially posted publisher from a fixture", async () => {
        const created = await client.createPublisher({ publisherName: "partial" } as Publisher);
        expect(created.publisherName).toBe("partial");
        expect(typeof created.publisherId).toBe("string");
        expect(created.extensions).toEqual([]);
        expect(created.lastUpdated).toBeInstanceOf(Date);
        expect(created.reCaptchaToken).toBeUndefined();
    });

    it("deletes a publisher", async () => {
        await expect(client.deletePublisher(known.publisherName)).resolves.toBeUndefined();
    });

    it("gets a known publisher", async () => {
        expect(await client.getPublisher(known.publisherName)).toBe(known);
        expect(await client.getPublisher(known.publisherName, PublisherQueryFlags.IncludeExtensions)).toBe(known);
        expect(await client.getPublisherWithoutToken(publishers[1].publisherName)).toBe(publishers[1]);
    });

    it("fabricates an unknown publisher", async () => {
        const made = await client.getPublisher("missing-publisher");
        expect(made.publisherName).toBe("missing-publisher");
        expect(made.isDomainVerified).toBe(true);
        expect(made._links).toEqual({});
        expect((await client.getPublisherWithoutToken("other-missing")).publisherName).toBe("other-missing");
    });

    it("updates a known publisher", async () => {
        const updated = await client.updatePublisher(
            { ...known, publisherName: "ignored", displayName: "Renamed" },
            known.publisherName
        );
        expect(updated.publisherName).toBe(known.publisherName);
        expect(updated.displayName).toBe("Renamed");
        expect(updated.publisherId).toBe(known.publisherId);
        expect(known.displayName).not.toBe("Renamed");
    });

    it("updates an unknown publisher", async () => {
        const updated = await client.updatePublisher({ shortDescription: "short" } as Publisher, "missing-publisher");
        expect(updated.publisherName).toBe("missing-publisher");
        expect(updated.shortDescription).toBe("short");
        expect(typeof updated.domain).toBe("string");
    });

    it("updates the members of a publisher", async () => {
        const assignments = await client.updatePublisherMembers(
            [
                { roleName: "Owner", uniqueName: "owner@example.com", userId: "user-1" },
                { roleName: "Reader", uniqueName: "reader@example.com", userId: "user-2" }
            ],
            known.publisherName,
            true
        );
        expect(assignments.map(a => a.role.name)).toEqual(["Owner", "Reader"]);
        expect(assignments.map(a => a.identity.id)).toEqual(["user-1", "user-2"]);
        expect(assignments.map(a => a.identity.uniqueName)).toEqual(["owner@example.com", "reader@example.com"]);
        expect(typeof assignments[0].identity.displayName).toBe("string");
        expect(await client.updatePublisherMembers([], known.publisherName)).toEqual([]);
    });

    it("associates an azure publisher", async () => {
        expect(await client.associateAzurePublisher(known.publisherName, "azure-id")).toEqual({
            publisherName: known.publisherName,
            azurePublisherId: "azure-id"
        });
    });

    it("queries the associated azure publisher", async () => {
        expect(await client.queryAssociatedAzurePublisher(known.publisherName)).toBe(azurePublishers[0]);
        const made = await client.queryAssociatedAzurePublisher("missing-publisher");
        expect(made.publisherName).toBe("missing-publisher");
        expect(typeof made.azurePublisherId).toBe("string");
    });

    it("gets, updates and deletes a publisher asset", async () => {
        expect(decode(await client.getPublisherAsset(known.publisherName))).toBe(`${known.publisherName}/logo`);
        expect(decode(await client.getPublisherAsset(known.publisherName, "banner"))).toBe(
            `${known.publisherName}/banner`
        );
        expect(await client.updatePublisherAsset("content", known.publisherName)).toEqual({
            logo: `${known.domain}/${known.publisherName}/logo`
        });
        expect(await client.updatePublisherAsset("content", known.publisherName, "banner", "banner.png")).toEqual({
            banner: `${known.domain}/${known.publisherName}/banner.png`
        });
        await expect(client.deletePublisherAsset(known.publisherName)).resolves.toBeUndefined();
        await expect(client.deletePublisherAsset(known.publisherName, "banner")).resolves.toBeUndefined();
    });

    it("fetches and verifies the domain token", async () => {
        expect(await client.fetchDomainToken(known.publisherName)).toBe(known.publisherId);
        expect(typeof (await client.fetchDomainToken("missing-publisher"))).toBe("string");
        await expect(client.verifyDomainToken(known.publisherName)).resolves.toBeUndefined();
    });

    it("lists the policies of a publisher", async () => {
        expect(await client.listPolicies(known.publisherName)).toEqual([policies[0], policies[1]]);
        expect(await client.listPolicies(publishers[1].publisherName)).toEqual([policies[2]]);
        expect(await client.listPolicies(publishers[2].publisherName)).toEqual([]);
        expect(await client.listPolicies("missing-publisher")).toEqual([]);
    });

    it("adds a policy echoing the posted object under the publisher", async () => {
        const posted = { ...makeFederatedCredentialPolicy("ignored"), policyName: "Release workflow" };
        const added = await client.addPolicy(posted, known.publisherName);
        expect(added).toEqual({ ...posted, publisherId: known.publisherId });
        const unknown = await client.addPolicy(posted, "missing-publisher");
        expect(unknown.publisherId).not.toBe("ignored");
        expect(unknown.key).toBe(posted.key);
    });

    it("fills a partially posted policy from a fixture", async () => {
        const partial = { criteria: "{}" } as ReturnType<typeof makeFederatedCredentialPolicy>;
        const added = await client.addPolicy(partial, known.publisherName);
        expect(added.criteria).toBe("{}");
        expect(typeof added.key).toBe("number");
        expect(added.type).toBe(0);
        expect(added.created).toBeInstanceOf(Date);
        expect(added.lastMatched).toBeUndefined();
    });

    it("deletes a policy", async () => {
        await expect(client.deletePolicy(known.publisherName, policies[0].key)).resolves.toBeUndefined();
    });
});
