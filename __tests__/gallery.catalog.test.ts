import {
    AcquisitionAssignmentType,
    AcquisitionOperationState,
    AcquisitionOperationType,
    ExtensionAcquisitionRequest,
    ExtensionCategory,
    GalleryRestClient
} from "azure-devops-extension-api/Gallery";
import { getClient } from "../azure-devops-extension-api";
import {
    categories,
    makeExtensionCategory,
    makeReview,
    productCategories,
    userSettings
} from "../azure-devops-extension-api/gallery/Data";

describe("GalleryRestClient mock: categories, acquisition and settings", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GalleryRestClient);

    it("lists the category names", async () => {
        const names = ["Azure Boards", "Azure Repos", "Azure Pipelines", "Azure Test Plans", "Azure Artifacts"];
        expect(await client.getCategories()).toEqual(names);
        expect(await client.getCategories("en-us")).toEqual(names);
    });

    it("gets the details of a known category", async () => {
        const result = await client.getCategoryDetails("Azure Repos");
        expect(result.categories).toEqual([categories[1]]);
        expect(result.categories[0]).toBe(categories[1]);
    });

    it("fabricates the details of an unknown category", async () => {
        const result = await client.getCategoryDetails("Missing", "en-us", "vsts");
        expect(result.categories.length).toBe(1);
        expect(result.categories[0].categoryName).toBe("Missing");
        expect(result.categories[0].languageTitles).toEqual([{ lang: "en-us", lcid: 1033, title: "Missing" }]);
        expect(result.categories[0].parentCategoryName).toBeUndefined();
    });

    it("gets a root and a child of the category tree", async () => {
        expect(await client.getCategoryTree("vs", productCategories[0].id)).toBe(productCategories[0]);
        const child = productCategories[2].children[0];
        expect(await client.getCategoryTree("vs", child.id, 1033, "source", "17.0", "Pro", "sub", "x64")).toBe(child);
    });

    it("fabricates an unknown node of the category tree", async () => {
        const made = await client.getCategoryTree("vs", "missing-category");
        expect(made.id).toBe("missing-category");
        expect(made.children).toEqual([]);
        expect(made.hasChildren).toBe(false);
    });

    it("gets the root categories", async () => {
        const result = await client.getRootCategories("vs");
        expect(result.categories).toBe(productCategories);
        expect(result.categories.map(c => c.title)).toEqual(["Tools", "Controls", "Templates"]);
        expect(result.categories.map(c => c.hasChildren)).toEqual([true, false, true]);
        expect((await client.getRootCategories("vs", 1033, "source", "17.0", "Pro", "sub")).categories.length).toBe(3);
    });

    it("creates a category echoing the posted object", async () => {
        const posted: ExtensionCategory = { ...makeExtensionCategory("Posted"), associatedProducts: ["vs"] };
        const created = await client.createCategory(posted);
        expect(created).toEqual(posted);
        expect(created).not.toBe(posted);
        const partial = await client.createCategory({ categoryName: "Partial" } as ExtensionCategory);
        expect(partial.categoryName).toBe("Partial");
        expect(typeof partial.categoryId).toBe("number");
        expect(partial.language).toBe("en-us");
    });

    it("gets the acquisition options of an item", async () => {
        const options = await client.getAcquisitionOptions("pub.ext", "account");
        expect(options.itemId).toBe("pub.ext");
        expect(options.target).toBe("account");
        expect(options.defaultOperation.operationType).toBe(AcquisitionOperationType.Install);
        expect(options.defaultOperation.operationState).toBe(AcquisitionOperationState.Allow);
        expect(options.defaultOperation.reason).toBeUndefined();
        expect(options.operations[0]).toBe(options.defaultOperation);
        expect(options.operations.map(o => o.operationType)).toEqual([
            AcquisitionOperationType.Install,
            AcquisitionOperationType.Request
        ]);
        expect((await client.getAcquisitionOptions("pub.ext", "account", true, false)).itemId).toBe("pub.ext");
    });

    it("requests an acquisition echoing the posted request", async () => {
        const posted: ExtensionAcquisitionRequest = {
            assignmentType: AcquisitionAssignmentType.Me,
            billingId: "billing",
            itemId: "pub.ext",
            operationType: AcquisitionOperationType.Install,
            properties: {},
            quantity: 1,
            targets: ["account"]
        };
        const requested = await client.requestAcquisition(posted);
        expect(requested).toEqual(posted);
        expect(requested).not.toBe(posted);
    });

    it("creates a support request", async () => {
        await expect(
            client.createSupportRequest({
                displayName: "Reporter",
                emailId: "reporter@example.com",
                extensionName: "ext",
                extensionURL: "https://example.com/ext",
                message: "Help",
                publisherName: "pub",
                reason: "Other",
                reCaptchaToken: "token",
                reporterVSID: "vsid",
                review: makeReview(),
                sourceLink: "https://example.com"
            })
        ).resolves.toBeUndefined();
    });

    it("gets every user setting", async () => {
        const settings = await client.getGalleryUserSettings("me");
        expect(settings).toBe(userSettings);
        expect(settings).toEqual({ theme: "dark", pageSize: 50, showPreview: true });
    });

    it("gets one user setting", async () => {
        expect(await client.getGalleryUserSettings("me", "theme")).toEqual({ theme: "dark" });
        expect(await client.getGalleryUserSettings("me", "missing")).toEqual({});
    });

    it("sets the user settings without keeping them", async () => {
        await expect(client.setGalleryUserSettings({ theme: "light" }, "me")).resolves.toBeUndefined();
        expect(await client.getGalleryUserSettings("me", "theme")).toEqual({ theme: "dark" });
    });

    it("generates and gets a signing key", async () => {
        await expect(client.generateKey("vsix")).resolves.toBeUndefined();
        await expect(client.generateKey("vsix", 60)).resolves.toBeUndefined();
        expect(await client.getSigningKey("vsix")).toBe("vsix-signing-key");
    });
});
