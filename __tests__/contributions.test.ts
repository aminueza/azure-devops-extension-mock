import {
    ContributionQueryOptions,
    ContributionsRestClient,
    ExtensionFlags,
    ExtensionStateFlags
} from "azure-devops-extension-api/Contributions";
import { getClient, getRegisteredMockClient, MockContributionsRestClient } from "../azure-devops-extension-api";
import {
    extensionKey,
    installedExtensions,
    makeClientContribution,
    makeClientContributionNode,
    makeClientContributionProviderDetails,
    makeContribution,
    makeContributionNodeQueryResult,
    makeContributionType,
    makeDataProviderResult,
    makeExtensionEventCallbackCollection,
    makeExtensionFile,
    makeInstalledExtension,
    makeInstalledExtensionState,
    makeResolvedDataProvider
} from "../azure-devops-extension-api/contributions/Data";

describe("ContributionsRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(ContributionsRestClient);
    const nodeQuery = {
        contributionIds: ["pub.ext.hub-one", "pub.ext.hub-two", "other.ext.hub"],
        dataProviderContext: { properties: {} },
        includeProviderDetails: false,
        queryOptions: ContributionQueryOptions.IncludeSelf
    };

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(ContributionsRestClient)).toBe(MockContributionsRestClient);
    });

    it("returns a node for each queried contribution", async () => {
        const result = await client.queryContributionNodes(nodeQuery);
        expect(Object.keys(result.nodes)).toEqual(nodeQuery.contributionIds);
        for (const id of nodeQuery.contributionIds) {
            expect(result.nodes[id].contribution.id).toBe(id);
            expect(result.nodes[id].children).toEqual([]);
        }
        expect(result.providerDetails).toEqual({});
    });

    it("includes provider details when asked to", async () => {
        const result = await client.queryContributionNodes({ ...nodeQuery, includeProviderDetails: true });
        expect(Object.keys(result.providerDetails)).toEqual(["pub.ext", "other.ext"]);
        expect(result.providerDetails["pub.ext"].name).toBe("pub.ext");
        expect(typeof result.providerDetails["other.ext"].version).toBe("string");
    });

    it("resolves the queried data providers", async () => {
        const query = {
            context: { properties: {} },
            contributionIds: ["pub.ext.provider-one", "pub.ext.provider-two"]
        };
        const result = await client.queryDataProviders(query);
        expect(Object.keys(result.data)).toEqual(query.contributionIds);
        expect(result.resolvedProviders.map(p => p.id)).toEqual(query.contributionIds);
        expect(result.resolvedProviders[0].error).toBeUndefined();
        expect(result.exceptions).toEqual({});
        expect(result.scopeName).toBeUndefined();
        expect(result.scopeValue).toBeUndefined();
    });

    it("carries the requested scope on the data provider result", async () => {
        const query = { context: { properties: {} }, contributionIds: [] };
        const result = await client.queryDataProviders(query, "project", "project-1");
        expect(result.scopeName).toBe("project");
        expect(result.scopeValue).toBe("project-1");
        expect(result.resolvedProviders).toEqual([]);
    });

    it("lists enabled extensions by default", async () => {
        const list = await client.getInstalledExtensions();
        expect(list).toEqual([installedExtensions[0], installedExtensions[1]]);
        expect(await client.getInstalledExtensions(undefined, false)).toEqual(list);
    });

    it("includes disabled extensions when asked to", async () => {
        expect(await client.getInstalledExtensions(undefined, true, ["asset"])).toEqual(installedExtensions);
    });

    it("lists the extensions that own a contribution", async () => {
        const target = installedExtensions[2];
        const ids = [target.contributions[0].id];
        expect(await client.getInstalledExtensions(ids, true)).toEqual([target]);
        expect(await client.getInstalledExtensions(ids)).toEqual([]);
        expect(await client.getInstalledExtensions(["missing.contribution.id"], true)).toEqual([]);
    });

    it("gets a known extension by name", async () => {
        const target = installedExtensions[1];
        expect(await client.getInstalledExtensionByName(target.publisherId, target.extensionId)).toBe(target);
    });

    it("fabricates an unknown extension by name", async () => {
        const made = await client.getInstalledExtensionByName("missing-publisher", "missing-extension", ["asset"]);
        expect(made.publisherId).toBe("missing-publisher");
        expect(made.extensionId).toBe("missing-extension");
        expect(made.installState.flags).toBe(ExtensionStateFlags.None);
        expect(made.lastPublished).toBeInstanceOf(Date);
    });

    it("does not match an extension of another publisher", async () => {
        const target = installedExtensions[0];
        const made = await client.getInstalledExtensionByName("missing-publisher", target.extensionId);
        expect(made).not.toBe(target);
        expect(made.publisherId).toBe("missing-publisher");
    });
});

describe("contributions fixtures", () => {
    it("makes an installed extension that owns its contributions", () => {
        const extension = makeInstalledExtension();
        const owner = extensionKey(extension.publisherId, extension.extensionId);
        expect(extension.contributions.length).toBe(2);
        for (const contribution of extension.contributions) {
            expect(contribution.id.startsWith(`${owner}.`)).toBe(true);
        }
        expect(extension.contributionTypes[0].id.startsWith(`${owner}.`)).toBe(true);
        expect(extension.eventCallbacks.postInstall.uri).toBe(`${extension.baseUri}/events/post-install`);
        expect(extension.flags).toBe(ExtensionFlags.Trusted);
        expect(extension.files).toEqual([{ ...makeExtensionFile(), source: extension.files[0].source }]);
    });

    it("makes standalone manifest parts", () => {
        expect(makeContribution().id.split(".").length).toBe(2);
        expect(makeContributionType().properties.uri.required).toBe(true);
        expect(makeExtensionEventCallbackCollection().preInstall.uri.endsWith("/events/pre-install")).toBe(true);
        expect(makeInstalledExtensionState().installationIssues).toEqual([]);
    });

    it("makes a node under the targets of its contribution", () => {
        const contribution = makeClientContribution();
        expect(makeClientContributionNode(contribution).parents).toEqual(contribution.targets);
        expect(makeClientContributionNode().contribution.type).toBe("ms.vss-web.hub");
    });

    it("makes provider details and results", () => {
        expect(makeClientContributionProviderDetails().properties).toEqual({});
        expect(makeContributionNodeQueryResult()).toEqual({ nodes: {}, providerDetails: {} });
        expect(makeResolvedDataProvider().duration).toBeGreaterThan(0);
        expect(makeDataProviderResult().resolvedProviders).toEqual([]);
    });

    it("seeds unique extension keys", () => {
        const keys = installedExtensions.map(e => extensionKey(e.publisherId, e.extensionId));
        expect(new Set(keys).size).toBe(keys.length);
        expect(installedExtensions[2].installState.flags).toBe(ExtensionStateFlags.Disabled);
    });
});
