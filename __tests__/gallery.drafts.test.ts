import {
    DraftPatchOperation,
    DraftStateType,
    ExtensionDraftPatch,
    GalleryRestClient,
    UnpackagedExtensionData
} from "azure-devops-extension-api/Gallery";
import { getClient } from "../azure-devops-extension-api";
import { extensions } from "../azure-devops-extension-api/gallery/Data";

const decode = (buffer: ArrayBuffer): string => new TextDecoder().decode(buffer);

const extensionData: UnpackagedExtensionData = {
    categories: ["Azure Repos"],
    description: "description",
    displayName: "Display",
    draftId: "draft-1",
    extensionName: "ext",
    installationTargets: [],
    isConvertedToMarkdown: false,
    isPreview: false,
    pricingCategory: "Free",
    product: "vsts",
    publisherName: "pub",
    qnAEnabled: true,
    referralUrl: "",
    repositoryUrl: "",
    tags: [],
    version: "1.0.0",
    vsixId: "pub.ext"
};

const patchOf = (operation: DraftPatchOperation): ExtensionDraftPatch => ({
    extensionData,
    operation,
    reCaptchaToken: "token"
});

describe("GalleryRestClient mock: drafts and assets", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GalleryRestClient);
    const known = extensions[0];
    const publisherName = known.publisher.publisherName;

    it("creates a draft to edit an extension", async () => {
        const draft = await client.createDraftForEditExtension("pub", "ext");
        expect(draft.publisherName).toBe("pub");
        expect(draft.extensionName).toBe("ext");
        expect(draft.draftState).toBe(DraftStateType.Unpublished);
        expect(draft.assets.length).toBe(1);
        expect(draft.validationErrors).toEqual([]);
        expect(draft.validationWarnings).toEqual([]);
        expect(draft.payload.isValid).toBe(true);
    });

    it("publishes and cancels a draft of an existing extension", async () => {
        const published = await client.performEditExtensionDraftOperation(
            patchOf(DraftPatchOperation.Publish),
            "pub",
            "ext",
            "draft-1"
        );
        expect(published.id).toBe("draft-1");
        expect(published.publisherName).toBe("pub");
        expect(published.extensionName).toBe("ext");
        expect(published.draftState).toBe(DraftStateType.Published);
        const cancelled = await client.performEditExtensionDraftOperation(
            patchOf(DraftPatchOperation.Cancel),
            "pub",
            "ext",
            "draft-2"
        );
        expect(cancelled.id).toBe("draft-2");
        expect(cancelled.draftState).toBe(DraftStateType.Cancelled);
    });

    it("updates the payload of a draft of an existing extension", async () => {
        const named = await client.updatePayloadInDraftForEditExtension("vsix", "pub", "ext", "draft-1", "new.vsix");
        expect(named.id).toBe("draft-1");
        expect(named.extensionName).toBe("ext");
        expect(named.payload.fileName).toBe("new.vsix");
        const unnamed = await client.updatePayloadInDraftForEditExtension("vsix", "pub", "ext", "draft-1");
        expect(unnamed.id).toBe("draft-1");
        expect(unnamed.payload.fileName.endsWith(".vsix")).toBe(true);
    });

    it("adds an asset to a draft", async () => {
        const edit = await client.addAssetForEditExtensionDraft("content", "pub", "ext", "draft-1", "Icon");
        expect(edit.assetType).toBe("Icon");
        expect(edit.language).toBe("en-us");
        expect(edit.source.endsWith("/Icon")).toBe(true);
        const fresh = await client.addAssetForNewExtensionDraft("content", "pub", "draft-1", "Screenshot");
        expect(fresh.assetType).toBe("Screenshot");
    });

    it("creates a draft for a new extension", async () => {
        const named = await client.createDraftForNewExtension("vsix", "pub", "vs", "first.vsix");
        expect(named.publisherName).toBe("pub");
        expect(named.product).toBe("vs");
        expect(named.payload.fileName).toBe("first.vsix");
        const unnamed = await client.createDraftForNewExtension("vsix", "pub", "vscode");
        expect(unnamed.product).toBe("vscode");
        expect(typeof unnamed.extensionName).toBe("string");
    });

    it("publishes and cancels a draft of a new extension", async () => {
        const published = await client.performNewExtensionDraftOperation(
            patchOf(DraftPatchOperation.Publish),
            "pub",
            "draft-3"
        );
        expect(published.id).toBe("draft-3");
        expect(published.draftState).toBe(DraftStateType.Published);
        const cancelled = await client.performNewExtensionDraftOperation(
            patchOf(DraftPatchOperation.Cancel),
            "pub",
            "draft-3"
        );
        expect(cancelled.draftState).toBe(DraftStateType.Cancelled);
    });

    it("updates the payload of a draft of a new extension", async () => {
        const named = await client.updatePayloadInDraftForNewExtension("vsix", "pub", "draft-4", "next.vsix");
        expect(named.id).toBe("draft-4");
        expect(named.payload.fileName).toBe("next.vsix");
        const unnamed = await client.updatePayloadInDraftForNewExtension("vsix", "pub", "draft-4");
        expect(unnamed.id).toBe("draft-4");
        expect(unnamed.publisherName).toBe("pub");
    });

    it("gets an asset from a draft", async () => {
        const edit = await client.getAssetFromEditExtensionDraft("pub", "draft-1", "Icon", "ext");
        expect(edit).toBeInstanceOf(ArrayBuffer);
        expect(decode(edit)).toBe("pub/ext/draft-1/Icon");
        expect(decode(await client.getAssetFromNewExtensionDraft("pub", "draft-1", "Icon"))).toBe("pub/draft-1/Icon");
    });

    it("gets an asset by name", async () => {
        const asset = await client.getAssetByName("pub", "ext", "1.0.0", "Manifest");
        expect(asset).toBeInstanceOf(ArrayBuffer);
        expect(decode(asset)).toBe("pub/ext/1.0.0/Manifest");
        expect(decode(await client.getAssetByName("pub", "ext", "1.0.0", "Icon", "token", true, "header"))).toBe(
            "pub/ext/1.0.0/Icon"
        );
    });

    it("gets an asset by extension id", async () => {
        const asset = await client.getAsset(known.extensionId, "2.0.0", "Manifest");
        expect(decode(asset)).toBe(`${publisherName}/${known.extensionName}/2.0.0/Manifest`);
        const unknown = await client.getAsset("missing-id", "2.0.0", "Manifest", "token", false, "header");
        expect(decode(unknown).endsWith("/2.0.0/Manifest")).toBe(true);
    });

    it("gets an authenticated asset and an asset with a token", async () => {
        expect(decode(await client.getAssetAuthenticated("pub", "ext", "1.0.0", "Manifest"))).toBe(
            "pub/ext/1.0.0/Manifest"
        );
        expect(decode(await client.getAssetAuthenticated("pub", "ext", "1.0.0", "Icon", "token", "header"))).toBe(
            "pub/ext/1.0.0/Icon"
        );
        expect(decode(await client.getAssetWithToken("pub", "ext", "1.0.0", "Manifest"))).toBe(
            "pub/ext/1.0.0/Manifest"
        );
        expect(
            decode(await client.getAssetWithToken("pub", "ext", "1.0.0", "Icon", "asset", "token", true, "header"))
        ).toBe("pub/ext/1.0.0/Icon");
    });

    it("gets the package of a version", async () => {
        const vsix = await client.getPackage("pub", "ext", "1.0.0");
        expect(vsix).toBeInstanceOf(ArrayBuffer);
        expect(decode(vsix)).toBe("pub/ext/1.0.0/package.vsix");
        expect(decode(await client.getPackage("pub", "ext", "1.1.0", "token", true, "header"))).toBe(
            "pub/ext/1.1.0/package.vsix"
        );
    });

    it("gets the certificate of a version", async () => {
        expect(decode(await client.getCertificate("pub", "ext", "1.0.0"))).toBe("pub/ext/1.0.0/certificate");
        expect(decode(await client.getCertificate(publisherName, known.extensionName))).toBe(
            `${publisherName}/${known.extensionName}/2.0.0/certificate`
        );
    });

    it("gets the verification log of a version", async () => {
        expect(decode(await client.getVerificationLog("pub", "ext", "1.0.0"))).toBe(
            "pub/ext/1.0.0/universal/verification.log"
        );
        expect(decode(await client.getVerificationLog("pub", "ext", "1.0.0", "linux-x64"))).toBe(
            "pub/ext/1.0.0/linux-x64/verification.log"
        );
    });
});
