import {
    AcquisitionAssignmentType,
    AcquisitionOperationState,
    AcquisitionOperationType,
    ExtensionAcquisitionRequest,
    ExtensionFlags,
    ExtensionManagementRestClient,
    ExtensionRequestState,
    ExtensionStateFlags,
    InstalledExtension
} from "azure-devops-extension-api/ExtensionManagement";
import { ExtensionPolicyFlags } from "azure-devops-extension-api/Gallery";
import { getClient, getRegisteredMockClient, MockExtensionManagementRestClient } from "../azure-devops-extension-api";
import {
    documents,
    extensionKey,
    extensionStates,
    installedExtensions,
    makeAcquisitionOperation,
    makeAcquisitionOptions,
    makeContribution,
    makeContributionType,
    makeExtensionAcquisitionRequest,
    makeExtensionAuditLog,
    makeExtensionAuditLogEntry,
    makeExtensionAuthorization,
    makeExtensionDataCollection,
    makeExtensionDocument,
    makeExtensionEventCallbackCollection,
    makeExtensionFile,
    makeExtensionRequest,
    makeExtensionState,
    makeInstalledExtension,
    makeInstalledExtensionState,
    makeInstalledExtensionStateIssue,
    makeRequestedExtension,
    makeUserExtensionPolicy,
    requestedExtensions
} from "../azure-devops-extension-api/extensionManagement/Data";

const SCOPE = ["pub", "ext", "Default", "Current", "settings"] as const;

describe("ExtensionManagementRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(ExtensionManagementRestClient);
    const disabled = installedExtensions[2];
    const warned = installedExtensions[3];

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(ExtensionManagementRestClient)).toBe(MockExtensionManagementRestClient);
    });

    it("gets acquisition options for the item", async () => {
        const options = await client.getAcquisitionOptions("pub.ext", false, true, true, false, false, true);
        expect(options.itemId).toBe("pub.ext");
        expect(options.defaultOperation.operationType).toBe(AcquisitionOperationType.Install);
        expect(options.operations[0]).toBe(options.defaultOperation);
        expect(options.operations.map(o => o.operationType)).toEqual([
            AcquisitionOperationType.Install,
            AcquisitionOperationType.Request
        ]);
    });

    it("echoes a requested acquisition", async () => {
        const posted: ExtensionAcquisitionRequest = {
            ...makeExtensionAcquisitionRequest(),
            assignmentType: AcquisitionAssignmentType.All,
            quantity: 5
        };
        const result = await client.requestAcquisition(posted);
        expect(result).toEqual(posted);
        expect(result).not.toBe(posted);
    });

    it("fills a partially posted acquisition from a fixture", async () => {
        const result = await client.requestAcquisition({ itemId: "pub.ext" } as ExtensionAcquisitionRequest);
        expect(result.itemId).toBe("pub.ext");
        expect(result.quantity).toBe(1);
        expect(result.operationType).toBe(AcquisitionOperationType.Install);
    });

    it("gets the audit log of an extension", async () => {
        const log = await client.getAuditLog("pub", "ext");
        expect(log.publisherName).toBe("pub");
        expect(log.extensionName).toBe("ext");
        expect(log.entries.map(e => e.auditAction)).toEqual(["Install", "VersionUpdate"]);
        expect(log.entries[0].auditDate).toBeInstanceOf(Date);
    });

    it("gets and registers an authorization", async () => {
        const read = await client.getAuthorization("pub", "ext", "registration-1");
        expect(read.id).toBe("registration-1");
        expect(read.scopes.length).toBeGreaterThan(0);
        const registered = await client.registerAuthorization("pub", "ext", "registration-2");
        expect(registered.id).toBe("registration-2");
    });

    it("creates a document echoing the posted object", async () => {
        const created = await client.createDocumentByName({ id: "doc-1", colour: "blue" }, ...SCOPE);
        expect(created).toEqual({ id: "doc-1", __etag: 1, value: expect.any(String), colour: "blue" });
    });

    it("gives a created document an id when none is posted", async () => {
        const created = await client.createDocumentByName({ colour: "blue" }, ...SCOPE);
        expect(typeof created.id).toBe("string");
        expect(created.colour).toBe("blue");
    });

    it("deletes a document", async () => {
        await expect(client.deleteDocumentByName(...SCOPE, documents[0].id)).resolves.toBeUndefined();
    });

    it("gets a known document", async () => {
        expect(await client.getDocumentByName(...SCOPE, documents[1].id)).toBe(documents[1]);
    });

    it("fabricates an unknown document", async () => {
        const made = await client.getDocumentByName(...SCOPE, "missing-document");
        expect(made.id).toBe("missing-document");
        expect(made.__etag).toBe(1);
    });

    it("lists documents", async () => {
        expect(await client.getDocumentsByName(...SCOPE)).toBe(documents);
    });

    it("sets and updates a document", async () => {
        const set = await client.setDocumentByName({ id: "doc-2", __etag: 4, colour: "red" }, ...SCOPE);
        expect(set).toEqual({ id: "doc-2", __etag: 4, value: expect.any(String), colour: "red" });
        const updated = await client.updateDocumentByName({ id: "doc-3", value: "kept" }, ...SCOPE);
        expect(updated).toEqual({ id: "doc-3", __etag: 1, value: "kept" });
    });

    it("fills the queried collections with documents", async () => {
        const first = { ...makeExtensionDataCollection(), collectionName: "one" };
        const second = { ...makeExtensionDataCollection(), collectionName: "two", scopeType: "User", scopeValue: "Me" };
        const result = await client.queryCollectionsByName({ collections: [first, second] }, "pub", "ext");
        expect(result.map(c => c.collectionName)).toEqual(["one", "two"]);
        expect(result[1].scopeType).toBe("User");
        expect(result[0].documents).toBe(documents);
        expect(first.documents).not.toBe(documents);
    });

    it("lists every state without installation issues by default", async () => {
        const states = await client.getStates();
        expect(states.map(s => extensionKey(s.publisherName, s.extensionName))).toEqual(
            installedExtensions.map(e => extensionKey(e.publisherId, e.extensionId))
        );
        for (const state of states) {
            expect(state.installationIssues).toEqual([]);
        }
        expect(states[3].flags).toBe(ExtensionStateFlags.Warning);
    });

    it("leaves out disabled states when asked to", async () => {
        const states = await client.getStates(false, true, false, true);
        expect(states.length).toBe(3);
        expect(states.map(s => s.extensionName)).not.toContain(disabled.extensionId);
    });

    it("includes installation issues on states when asked to", async () => {
        const states = await client.getStates(true, false, true);
        expect(states).toEqual(extensionStates);
        expect(states[3].installationIssues.length).toBe(1);
    });

    it("queries extensions by moniker", async () => {
        const result = await client.queryExtensions({
            assetTypes: [],
            monikers: [
                { publisherName: warned.publisherId, extensionName: warned.extensionId },
                { publisherName: "missing-publisher", extensionName: "missing-extension" }
            ]
        });
        expect(result[0]).toBe(warned);
        expect(result[1].publisherId).toBe("missing-publisher");
        expect(result[1].extensionId).toBe("missing-extension");
    });

    it("lists installed extensions without installation issues by default", async () => {
        const list = await client.getInstalledExtensions();
        expect(list.map(e => e.extensionId)).toEqual(installedExtensions.map(e => e.extensionId));
        for (const extension of list) {
            expect(extension.installState.installationIssues).toEqual([]);
        }
        expect(warned.installState.installationIssues.length).toBe(1);
    });

    it("leaves out disabled extensions when asked to", async () => {
        const list = await client.getInstalledExtensions(false, true, ["asset"]);
        expect(list.length).toBe(3);
        expect(list.map(e => e.extensionId)).not.toContain(disabled.extensionId);
    });

    it("includes installation issues on extensions when asked to", async () => {
        const list = await client.getInstalledExtensions(true, false, undefined, true);
        expect(list).toEqual(installedExtensions);
        expect(list[3]).toBe(warned);
    });

    it("updates a known installed extension", async () => {
        const posted: InstalledExtension = {
            ...disabled,
            installState: { ...disabled.installState, flags: ExtensionStateFlags.None }
        };
        const updated = await client.updateInstalledExtension(posted);
        expect(updated).toEqual(posted);
        expect(disabled.installState.flags).toBe(ExtensionStateFlags.Disabled);
    });

    it("fills a partially posted installed extension from the seeded one", async () => {
        const partial = {
            publisherId: disabled.publisherId,
            extensionId: disabled.extensionId,
            version: "9.9.9"
        } as InstalledExtension;
        const updated = await client.updateInstalledExtension(partial);
        expect(updated.version).toBe("9.9.9");
        expect(updated.registrationId).toBe(disabled.registrationId);
        expect(updated.contributions).toBe(disabled.contributions);
    });

    it("updates an unknown installed extension", async () => {
        const partial = { publisherId: "missing-publisher", extensionId: "missing-extension" } as InstalledExtension;
        const updated = await client.updateInstalledExtension(partial);
        expect(updated.publisherId).toBe("missing-publisher");
        expect(updated.extensionId).toBe("missing-extension");
        expect(typeof updated.version).toBe("string");
    });

    it("gets a known installed extension by name", async () => {
        const target = installedExtensions[1];
        expect(await client.getInstalledExtensionByName(target.publisherId, target.extensionId, ["asset"])).toBe(
            target
        );
        expect(target.flags).toBe(ExtensionFlags.BuiltIn | ExtensionFlags.Trusted);
    });

    it("fabricates an unknown installed extension by name", async () => {
        const made = await client.getInstalledExtensionByName("missing-publisher", installedExtensions[0].extensionId);
        expect(made).not.toBe(installedExtensions[0]);
        expect(made.publisherId).toBe("missing-publisher");
        expect(made.extensionId).toBe(installedExtensions[0].extensionId);
    });

    it("installs an extension at the requested version", async () => {
        const installed = await client.installExtensionByName("new-publisher", "new-extension", "2.0.1");
        expect(installed.publisherId).toBe("new-publisher");
        expect(installed.extensionId).toBe("new-extension");
        expect(installed.version).toBe("2.0.1");
    });

    it("installs an extension at its own version when none is requested", async () => {
        const target = installedExtensions[0];
        const installed = await client.installExtensionByName(target.publisherId, target.extensionId);
        expect(installed).toEqual(target);
        expect(installed).not.toBe(target);
    });

    it("uninstalls an extension", async () => {
        await expect(client.uninstallExtensionByName("pub", "ext", "unused", "code")).resolves.toBeUndefined();
    });

    it("gets the policies of a user", async () => {
        const policy = await client.getPolicies("user-1");
        expect(policy.userId).toBe("user-1");
        expect(policy.permissions).toEqual({ install: ExtensionPolicyFlags.All, request: ExtensionPolicyFlags.All });
    });

    it("resolves a single request", async () => {
        expect(await client.resolveRequest("no", "pub", "ext", "user-1", ExtensionRequestState.Rejected)).toBe(1);
    });

    it("lists requested extensions", async () => {
        const requests = await client.getRequests();
        expect(requests).toBe(requestedExtensions);
        expect(requests.map(r => r.requestCount)).toEqual([1, 2]);
    });

    it("resolves every request of an extension", async () => {
        const target = requestedExtensions[1];
        expect(
            await client.resolveAllRequests(
                "",
                target.publisherName,
                target.extensionName,
                ExtensionRequestState.Accepted
            )
        ).toBe(2);
        expect(await client.resolveAllRequests("", "missing", "missing", ExtensionRequestState.Accepted)).toBe(1);
        expect(
            await client.resolveAllRequests("", "missing", target.extensionName, ExtensionRequestState.Accepted)
        ).toBe(1);
    });

    it("deletes a request", async () => {
        await expect(client.deleteRequest("pub", "ext")).resolves.toBeUndefined();
    });

    it("requests a known extension", async () => {
        const target = requestedExtensions[1];
        const requested = await client.requestExtension(target.publisherName, target.extensionName, "please");
        expect(requested.publisherDisplayName).toBe(target.publisherDisplayName);
        expect(requested.requestCount).toBe(1);
        expect(requested.extensionRequests.length).toBe(1);
        expect(requested.extensionRequests[0].requestMessage).toBe("please");
        expect(requested.extensionRequests[0].requestState).toBe(ExtensionRequestState.Open);
        expect(target.requestCount).toBe(2);
    });

    it("requests an unknown extension", async () => {
        const requested = await client.requestExtension("missing-publisher", "missing-extension", "please");
        expect(requested.publisherName).toBe("missing-publisher");
        expect(requested.extensionName).toBe("missing-extension");
        expect(requested.extensionRequests[0].requestMessage).toBe("please");
    });

    it("gets a token", async () => {
        const token = await client.getToken();
        expect(token).toMatch(/^[a-zA-Z0-9]{64}$/);
    });
});

describe("extension management fixtures", () => {
    it("makes an installed extension that owns its contributions", () => {
        const extension = makeInstalledExtension();
        const owner = extensionKey(extension.publisherId, extension.extensionId);
        for (const contribution of extension.contributions) {
            expect(contribution.id.startsWith(`${owner}.`)).toBe(true);
        }
        expect(extension.contributionTypes[0].id.startsWith(`${owner}.`)).toBe(true);
        expect(extension.eventCallbacks.postUpdate.uri).toBe(`${extension.baseUri}/events/post-update`);
        expect(extension.files[0].assetType).toBe(makeExtensionFile().assetType);
    });

    it("makes standalone manifest parts", () => {
        expect(makeContribution().id.split(".").length).toBe(2);
        expect(makeContributionType().indexed).toBe(false);
        expect(makeExtensionEventCallbackCollection().versionCheck.uri.endsWith("/events/version-check")).toBe(true);
        expect(makeInstalledExtensionState().flags).toBe(ExtensionStateFlags.None);
        expect(typeof makeInstalledExtensionStateIssue().message).toBe("string");
    });

    it("makes a state for the given extension", () => {
        const extension = makeInstalledExtension();
        const state = makeExtensionState(extension);
        expect(state.publisherName).toBe(extension.publisherId);
        expect(state.extensionName).toBe(extension.extensionId);
        expect(state.version).toBe(extension.version);
        expect(state.lastUpdated).toBe(extension.installState.lastUpdated);
        expect(makeExtensionState().lastVersionCheck).toBeInstanceOf(Date);
    });

    it("makes acquisition fixtures", () => {
        expect(makeAcquisitionOperation().operationState).toBe(AcquisitionOperationState.Allow);
        expect(makeAcquisitionOperation(AcquisitionOperationType.Buy).operationType).toBe(AcquisitionOperationType.Buy);
        expect(makeAcquisitionOptions().operations.length).toBe(2);
    });

    it("makes audit and authorization fixtures", () => {
        expect(makeExtensionAuditLogEntry().auditAction).toBe("Install");
        expect(makeExtensionAuditLog().entries.length).toBe(2);
        expect(makeExtensionAuthorization().scopes).toEqual(["vso.work", "vso.code"]);
    });

    it("makes an open request without resolution fields", () => {
        const request = makeExtensionRequest();
        expect(request.requestState).toBe(ExtensionRequestState.Open);
        expect(request.resolveDate).toBeUndefined();
        expect(request.resolvedBy).toBeUndefined();
        expect(request.rejectMessage).toBeUndefined();
    });

    it("makes a requested extension with the given number of requests", () => {
        expect(makeRequestedExtension().requestCount).toBe(1);
        const requested = makeRequestedExtension(3);
        expect(requested.requestCount).toBe(3);
        expect(requested.extensionRequests.length).toBe(3);
    });

    it("makes documents, collections and policies", () => {
        expect(makeExtensionDocument().__etag).toBe(1);
        expect(makeExtensionDataCollection().documents.length).toBe(1);
        expect(typeof makeUserExtensionPolicy().displayName).toBe("string");
    });

    it("seeds unique lookup keys", () => {
        const installed = installedExtensions.map(e => extensionKey(e.publisherId, e.extensionId));
        expect(new Set(installed).size).toBe(installed.length);
        const requested = requestedExtensions.map(r => extensionKey(r.publisherName, r.extensionName));
        expect(new Set(requested).size).toBe(requested.length);
        expect(new Set(documents.map(d => d.id)).size).toBe(documents.length);
        expect(extensionStates.length).toBe(installedExtensions.length);
    });
});
