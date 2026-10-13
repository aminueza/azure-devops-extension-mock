import {
    ItemContentType,
    TfvcChangeset,
    TfvcItemRequestData,
    TfvcLabelRequestData,
    TfvcRestClient,
    TfvcShelvesetRequestData,
    TfvcVersionDescriptor,
    TfvcVersionOption,
    TfvcVersionType,
    VersionControlChangeType,
    VersionControlRecursionType
} from "azure-devops-extension-api/Tfvc";
import { getClient, getRegisteredMockClient, MockTfvcRestClient } from "../azure-devops-extension-api";
import * as data from "../azure-devops-extension-api/tfvc/Data";

const decode = (buffer: ArrayBuffer): string => new TextDecoder().decode(buffer);

const version: TfvcVersionDescriptor = {
    version: "1",
    versionOption: TfvcVersionOption.None,
    versionType: TfvcVersionType.Latest
};

const labelRequest: TfvcLabelRequestData = {
    includeLinks: false,
    itemLabelFilter: "",
    labelScope: "$/Project",
    maxItemCount: 10,
    name: "",
    owner: ""
};

const shelvesetRequest: TfvcShelvesetRequestData = {
    includeDetails: true,
    includeLinks: false,
    includeWorkItems: true,
    maxChangeCount: 10,
    maxCommentLength: 80,
    name: "",
    owner: ""
};

const itemRequest = (...paths: string[]): TfvcItemRequestData => ({
    includeContentMetadata: true,
    includeLinks: false,
    itemDescriptors: paths.map(path => ({
        path,
        recursionLevel: VersionControlRecursionType.None,
        version: "",
        versionOption: TfvcVersionOption.None,
        versionType: TfvcVersionType.Latest
    }))
});

describe("TfvcRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TfvcRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(TfvcRestClient)).toBe(MockTfvcRestClient);
    });

    it("gets a known branch", async () => {
        const branch = await client.getBranch("$/Project/Main", "proj", true, true);
        expect(branch).toBe(data.branches[0]);
        expect(branch.children.map(c => c.path)).toEqual(["$/Project/Dev", "$/Project/Release"]);
        expect(branch.relatedBranches).toEqual([{ path: "$/Project/Dev" }, { path: "$/Project/Release" }]);
        expect(branch.parent).toEqual({ path: "$/Project" });
    });

    it("fabricates an unknown branch", async () => {
        const branch = await client.getBranch("$/Other/Feature");
        expect(branch.path).toBe("$/Other/Feature");
        expect(branch.parent).toEqual({ path: "$/Other" });
        expect(branch.children).toEqual([]);
        expect(branch.mappings).toEqual([{ depth: "Full", serverItem: "$/Other/Feature", type: "Map" }]);
        expect(branch.createdDate).toBeInstanceOf(Date);
        expect(typeof branch.owner.displayName).toBe("string");
        expect(branch.isDeleted).toBe(false);
    });

    it("lists branches without the deleted ones", async () => {
        const branches = await client.getBranches();
        expect(branches.map(b => b.path)).toEqual(["$/Project/Main", "$/Project/Dev", "$/Project/Release"]);
        expect(branches[1].parent).toEqual({ path: "$/Project/Main" });
    });

    it("lists branches including the deleted ones", async () => {
        const branches = await client.getBranches("proj", false, false, true, false);
        expect(branches.map(b => b.path)).toEqual([
            "$/Project/Main",
            "$/Project/Dev",
            "$/Project/Release",
            "$/Project/Archive"
        ]);
        expect(branches[3].isDeleted).toBe(true);
    });

    it("lists branch refs below a scope path", async () => {
        const refs = await client.getBranchRefs("$/Project/Re");
        expect(refs.map(r => r.path)).toEqual(["$/Project/Release"]);
    });

    it("lists deleted branch refs when asked", async () => {
        const refs = await client.getBranchRefs("$/Project/A", "proj", true, true);
        expect(refs.map(r => r.path)).toEqual(["$/Project/Archive"]);
        expect(await client.getBranchRefs("$/Project/A")).toEqual([]);
    });

    it("gets every change of a known changeset", async () => {
        const [first] = data.changesets;
        const page = await client.getChangesetChanges(first.changesetId);
        expect(Array.from(page)).toEqual(first.changes);
        expect(page.continuationToken).toBeNull();
        expect(page[0].changeType).toBe(VersionControlChangeType.Edit);
        expect(page[0].newContent.contentType).toBe(ItemContentType.RawText);
        expect(page[0].item.path).toBe(page[0].sourceServerItem);
    });

    it("pages the changes of a changeset", async () => {
        const [first] = data.changesets;
        const page = await client.getChangesetChanges(first.changesetId, 0, 2);
        expect(Array.from(page)).toEqual(first.changes.slice(0, 2));
        expect(page.continuationToken).toBe("2");
        const rest = await client.getChangesetChanges(first.changesetId, 2, 2);
        expect(Array.from(rest)).toEqual(first.changes.slice(2));
        expect(rest.continuationToken).toBeNull();
    });

    it("falls back to the seeded changes without a changeset id", async () => {
        const page = await client.getChangesetChanges();
        expect(Array.from(page)).toEqual(data.changes);
    });

    it("creates a changeset echoing the posted object", async () => {
        const posted: TfvcChangeset = { ...data.makeChangeset(), comment: "checked in" };
        const created = await client.createChangeset(posted, "proj");
        expect(created).toEqual(posted);
        expect(created.comment).toBe("checked in");
        expect(created.changesetId).toBe(posted.changesetId);
    });

    it("gets a known changeset", async () => {
        const [first] = data.changesets;
        const changeset = await client.getChangeset(first.changesetId, "proj", 10, true, true, 80, false, 0, 5, "id desc");
        expect(changeset).toBe(first);
        expect(changeset.changes.length).toBe(3);
        expect(changeset.checkinNotes[0].name).toBe("Code Reviewer");
        expect(changeset.policyOverride).toEqual({ comment: "", policyFailures: [] });
        expect(changeset.workItems.length).toBe(1);
        expect(changeset.teamProjectIds.length).toBe(1);
        expect(changeset.hasMoreChanges).toBe(false);
    });

    it("fabricates an unknown changeset", async () => {
        const changeset = await client.getChangeset(999_999);
        expect(changeset.changesetId).toBe(999_999);
        expect(typeof changeset.comment).toBe("string");
        expect(changeset.createdDate).toBeInstanceOf(Date);
    });

    it("lists changesets", async () => {
        const changesets = await client.getChangesets();
        expect(changesets).toEqual(data.changesets);
        expect(changesets.length).toBe(5);
        const ids = changesets.map(c => c.changesetId);
        expect(new Set(ids).size).toBe(5);
    });

    it("lists changesets with skip and top", async () => {
        const changesets = await client.getChangesets("proj", 80, 1, 2, "id desc");
        expect(changesets).toEqual(data.changesets.slice(1, 3));
    });

    it("gets batched changesets by id", async () => {
        const known = data.changesets[2];
        const batch = await client.getBatchedChangesets({
            changesetIds: [known.changesetId, 888_888],
            commentLength: 80,
            includeLinks: false
        });
        expect(batch.length).toBe(2);
        expect(batch[0]).toBe(known);
        expect(batch[1].changesetId).toBe(888_888);
    });

    it("gets the work items of a known changeset", async () => {
        const [first] = data.changesets;
        const found = await client.getChangesetWorkItems(first.changesetId);
        expect(found).toBe(first.workItems);
        expect(typeof found[0].id).toBe("number");
        expect(typeof found[0].title).toBe("string");
    });

    it("falls back to the seeded work items without a changeset id", async () => {
        const found = await client.getChangesetWorkItems();
        expect(found).toBe(data.workItems);
        expect(found.length).toBe(3);
        expect(new Set(found.map(w => w.id)).size).toBe(3);
    });

    it("gets a batch of items, one list per descriptor", async () => {
        const batch = await client.getItemsBatch(itemRequest("$/Project/Main/readme.md", "$/Missing/file.txt"), "proj");
        expect(batch.length).toBe(2);
        expect(batch[0]).toEqual([data.items.find(i => i.path === "$/Project/Main/readme.md")]);
        expect(batch[1][0].path).toBe("$/Missing/file.txt");
    });

    it("gets a batch of items as a zip", async () => {
        const zip = await client.getItemsBatchZip(itemRequest("$/Project/Main/readme.md", "$/Project/Main/src"), "proj");
        expect(zip).toBeInstanceOf(ArrayBuffer);
        expect(decode(zip)).toBe("$/Project/Main/readme.md\n$/Project/Main/src");
    });

    it("gets a known item", async () => {
        const item = await client.getItem(
            "$/Project/Main/src/app.ts",
            "proj",
            "app.ts",
            false,
            "$/Project",
            VersionControlRecursionType.None,
            version,
            true
        );
        expect(data.items).toContain(item);
        expect(item.isFolder).toBe(false);
        expect(item.contentMetadata.fileName).toBe("app.ts");
        expect(item.contentMetadata.extension).toBe("ts");
        expect(item.changeDate).toBeInstanceOf(Date);
        expect(item.size).toBeGreaterThan(0);
    });

    it("fabricates an unknown item", async () => {
        const item = await client.getItem("$/Missing/folder");
        expect(item.path).toBe("$/Missing/folder");
        expect(item.isFolder).toBe(true);
        expect(item.isBranch).toBe(false);
        expect(typeof item.hashValue).toBe("string");
    });

    it("gets item content", async () => {
        const item = await client.getItem("$/Project/Main/readme.md");
        const content = await client.getItemContent("$/Project/Main/readme.md", "proj", "readme.md", true);
        expect(content).toBeInstanceOf(ArrayBuffer);
        expect(decode(content)).toBe(item.content);
    });

    it("lists every item without a scope path", async () => {
        const items = await client.getItems();
        expect(items).toEqual(data.items);
        expect(items.map(i => i.path)).toEqual([
            "$/Project",
            "$/Project/Main",
            "$/Project/Main/src",
            "$/Project/Main/readme.md",
            "$/Project/Main/src/app.ts",
            "$/Project/Main/src/config.json"
        ]);
        expect(items[1].isBranch).toBe(true);
    });

    it("lists the items below a scope path", async () => {
        const items = await client.getItems("proj", "$/Project/Main/src", VersionControlRecursionType.Full, false, version);
        expect(items.map(i => i.path)).toEqual([
            "$/Project/Main/src",
            "$/Project/Main/src/app.ts",
            "$/Project/Main/src/config.json"
        ]);
    });

    it("gets item text for a known path", async () => {
        const text = await client.getItemText("$/Project/Main/readme.md");
        expect(text.startsWith("$/Project/Main/readme.md\n")).toBe(true);
    });

    it("fabricates item text for an unknown path", async () => {
        const text = await client.getItemText("$/Missing/notes.txt", "proj");
        expect(text.startsWith("$/Missing/notes.txt\n")).toBe(true);
    });

    it("gets an item zip", async () => {
        const item = await client.getItem("$/Project/Main/src/config.json");
        const zip = await client.getItemZip("$/Project/Main/src/config.json");
        expect(zip).toBeInstanceOf(ArrayBuffer);
        expect(decode(zip)).toBe(item.content);
    });

    it("gets the items of a known label", async () => {
        const [first] = data.labels;
        const items = await client.getLabelItems(String(first.id));
        expect(items).toEqual(first.items);
        expect(items.length).toBe(3);
    });

    it("gets the items of a label with top and skip", async () => {
        const [first] = data.labels;
        const items = await client.getLabelItems(String(first.id), 1, 1);
        expect(items).toEqual([first.items[1]]);
    });

    it("gets a known label", async () => {
        const second = data.labels[1];
        const label = await client.getLabel(String(second.id), labelRequest, "proj");
        expect(label).toBe(second);
        expect(label.name).toBe("v1.1");
        expect(label.labelScope).toBe("$/Project");
        expect(label.modifiedDate).toBeInstanceOf(Date);
    });

    it("fabricates a label for an unknown numeric id", async () => {
        const label = await client.getLabel("424242", labelRequest);
        expect(label.id).toBe(424_242);
        expect(label.name.startsWith("label-")).toBe(true);
    });

    it("fabricates a label named after a non-numeric id", async () => {
        const label = await client.getLabel("nightly", labelRequest);
        expect(label.name).toBe("nightly");
        expect(Number.isInteger(label.id)).toBe(true);
    });

    it("lists labels", async () => {
        const labels = await client.getLabels(labelRequest);
        expect(labels.map(l => l.name)).toEqual(["v1.0", "v1.1", "v2.0"]);
        expect(new Set(labels.map(l => l.id)).size).toBe(3);
    });

    it("lists labels with top and skip", async () => {
        const labels = await client.getLabels(labelRequest, "proj", 1, 2);
        expect(labels.map(l => l.name)).toEqual(["v2.0"]);
    });

    it("gets the changes of a known shelveset", async () => {
        const [first] = data.shelvesets;
        const changes = await client.getShelvesetChanges(first.id);
        expect(changes).toEqual(first.changes);
        expect(changes.length).toBe(3);
    });

    it("gets the changes of a shelveset with top and skip", async () => {
        const [first] = data.shelvesets;
        const changes = await client.getShelvesetChanges(first.id, 2, 1);
        expect(changes).toEqual(first.changes.slice(1, 3));
    });

    it("gets a known shelveset", async () => {
        const [first] = data.shelvesets;
        const shelveset = await client.getShelveset(first.id, shelvesetRequest);
        expect(shelveset).toBe(first);
        expect(shelveset.name).toBe("wip-login");
        expect(shelveset.id).toBe(`wip-login;${shelveset.owner.id}`);
        expect(shelveset.notes[0].name).toBe("Code Reviewer");
        expect(shelveset.policyOverride).toEqual({ comment: "", policyFailures: [] });
    });

    it("fabricates an unknown shelveset", async () => {
        const shelveset = await client.getShelveset("missing;owner");
        expect(shelveset.id).toBe("missing;owner");
        expect(shelveset.createdDate).toBeInstanceOf(Date);
        expect(shelveset.changes.length).toBe(3);
    });

    it("lists shelvesets", async () => {
        const shelvesets = await client.getShelvesets();
        expect(shelvesets.map(s => s.name)).toEqual(["wip-login", "hotfix-build", "review-refactor"]);
        expect(new Set(shelvesets.map(s => s.id)).size).toBe(3);
    });

    it("lists shelvesets with top and skip", async () => {
        const shelvesets = await client.getShelvesets(shelvesetRequest, 1, 1);
        expect(shelvesets.map(s => s.name)).toEqual(["hotfix-build"]);
    });

    it("gets the work items of a shelveset", async () => {
        const [first] = data.shelvesets;
        const found = await client.getShelvesetWorkItems(first.id);
        expect(found).toBe(first.workItems);
        expect(found.length).toBe(1);
        expect(typeof found[0].workItemType).toBe("string");
    });

    it("gets the statistics", async () => {
        const stats = await client.getTfvcStatistics("proj", "$/Project");
        expect(stats).toEqual({
            changesetId: data.changesets[data.changesets.length - 1].changesetId,
            fileCountTotal: 3
        });
    });
});
