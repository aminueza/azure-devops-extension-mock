import {
    BlobCompressionType,
    ContainerItemStatus,
    ContainerItemType,
    ContainerOptions,
    FileContainerItem,
    FileContainerRestClient
} from "azure-devops-extension-api/FileContainer";
import { getClient, getRegisteredMockClient, MockFileContainerRestClient } from "../azure-devops-extension-api";
import {
    containerItems,
    containers,
    makeContainerItemBlobReference,
    makeFileContainer,
    makeFileContainerFolder,
    makeFileContainerItem,
    makeFileContainerItems
} from "../azure-devops-extension-api/fileContainer/Data";

describe("FileContainerRestClient mock", () => {
    const client = getClient(FileContainerRestClient);
    const itemsOf = (containerId: number): FileContainerItem[] =>
        containerItems.filter(i => i.containerId === containerId);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(FileContainerRestClient)).toBe(MockFileContainerRestClient);
    });

    it("creates items echoing the posted objects in the container", async () => {
        const posted = [makeFileContainerItem(1, "drop/a.txt"), makeFileContainerFolder(1, "drop/sub")];
        const created = await client.createItems({ count: 2, value: posted }, 77, "scope");
        expect(created).toEqual(posted.map(item => ({ ...item, containerId: 77 })));
        expect(created[0]).not.toBe(posted[0]);
        expect(posted[0].containerId).toBe(1);
    });

    it("fills partially posted items from a fixture", async () => {
        const partial = { path: "drop/new.json", itemType: ContainerItemType.File } as FileContainerItem;
        const [created] = await client.createItems({ count: 1, value: [partial] }, 78);
        expect(created.path).toBe("drop/new.json");
        expect(created.containerId).toBe(78);
        expect(created.status).toBe(ContainerItemStatus.Created);
        expect(created.itemLocation.endsWith("/_apis/resources/Containers/78?itemPath=drop/new.json")).toBe(true);
        expect(created.dateCreated).toBeInstanceOf(Date);
    });

    it("creates nothing from an empty collection", async () => {
        expect(await client.createItems({ count: 0, value: [] }, 79)).toEqual([]);
    });

    it("deletes an item", async () => {
        await expect(client.deleteItem(containers[0].id, "drop", "scope")).resolves.toBeUndefined();
    });

    it("lists every container", async () => {
        expect(await client.getContainers()).toEqual(containers);
    });

    it("lists containers of a scope", async () => {
        expect(await client.getContainers(containers[1].scopeIdentifier)).toEqual([containers[1]]);
        expect(await client.getContainers("missing-scope")).toEqual([]);
    });

    it("lists containers filtered by artifact uris", async () => {
        const uris = `${containers[0].artifactUri},${containers[2].artifactUri},vstfs:///Build/Build/0`;
        expect(await client.getContainers(undefined, uris)).toEqual([containers[0], containers[2]]);
    });

    it("lists containers filtered by scope and artifact uris", async () => {
        const uris = `${containers[0].artifactUri},${containers[2].artifactUri}`;
        expect(await client.getContainers(containers[2].scopeIdentifier, uris)).toEqual([containers[2]]);
        expect(await client.getContainers(containers[1].scopeIdentifier, uris)).toEqual([]);
    });

    it("lists the items of a known container", async () => {
        const items = await client.getItems(containers[0].id);
        expect(items).toEqual(itemsOf(containers[0].id));
        expect(items.length).toBe(4);
        expect(items[0].itemType).toBe(ContainerItemType.Folder);
        for (const item of items) {
            expect(item.ticket).toBeUndefined();
            expect(item.blobMetadata).toBeUndefined();
        }
    });

    it("fabricates the items of an unknown container", async () => {
        const items = await client.getItems(999_999);
        expect(items.length).toBe(1);
        expect(items[0].containerId).toBe(999_999);
        expect(items[0].itemType).toBe(ContainerItemType.File);
    });

    it("lists the items under a folder path", async () => {
        const items = await client.getItems(containers[1].id, "scope", "drop");
        expect(items).toEqual(itemsOf(containers[1].id));
    });

    it("lists a single item by its path", async () => {
        const target = itemsOf(containers[1].id)[2];
        const items = await client.getItems(containers[1].id, undefined, target.path);
        expect(items).toEqual([target]);
    });

    it("does not match a path that only shares a prefix", async () => {
        expect(await client.getItems(containers[1].id, undefined, "dro")).toEqual([]);
        expect(await client.getItems(containers[1].id, undefined, "missing")).toEqual([]);
    });

    it("includes download tickets when asked to", async () => {
        const args = [undefined, undefined, undefined, undefined, undefined] as const;
        const items = await client.getItems(containers[2].id, ...args, true);
        for (const item of items) {
            expect(item.ticket).toMatch(/^[a-zA-Z0-9]{32}$/);
            expect(item.blobMetadata).toBeUndefined();
        }
        const without = await client.getItems(containers[2].id, ...args, false);
        expect(without.every(item => item.ticket === undefined)).toBe(true);
    });

    it("includes blob metadata when asked to", async () => {
        const args = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined] as const;
        const items = await client.getItems(containers[2].id, ...args, true, true, false);
        for (const item of items) {
            expect(item.blobMetadata.scopeIdentifier).toBe(containers[2].scopeIdentifier);
            expect(item.blobMetadata.compressionType).toBe(BlobCompressionType.GZip);
            expect(item.ticket).toBeUndefined();
        }
        const without = await client.getItems(containers[2].id, ...args, false);
        expect(without.every(item => item.blobMetadata === undefined)).toBe(true);
        expect(itemsOf(containers[2].id).every(item => item.blobMetadata === undefined)).toBe(true);
    });
});

describe("file container fixtures", () => {
    it("makes a container", () => {
        const container = makeFileContainer();
        expect(typeof container.id).toBe("number");
        expect(container.options).toBe(ContainerOptions.None);
        expect(container.itemLocation.endsWith(`/_apis/resources/Containers/${container.id}`)).toBe(true);
        expect(container.contentLocation).toBe(container.itemLocation);
        expect(container.artifactUri.startsWith("vstfs:///Build/Build/")).toBe(true);
        expect(container.dateCreated).toBeInstanceOf(Date);
    });

    it("makes a blob reference", () => {
        expect(makeContainerItemBlobReference("scope-1").scopeIdentifier).toBe("scope-1");
        const reference = makeContainerItemBlobReference();
        expect(typeof reference.scopeIdentifier).toBe("string");
        expect(reference.artifactHash).toMatch(/^[0-9a-f]{40}$/);
    });

    it("makes a file item", () => {
        const item = makeFileContainerItem();
        expect(item.itemType).toBe(ContainerItemType.File);
        expect(item.path.startsWith("drop/")).toBe(true);
        expect(item.fileHash.length).toBe(16);
        expect(item.contentId.length).toBe(16);
        expect(item.fileLength).toBeGreaterThan(0);
        expect(item.lastModifiedBy).toBe(item.createdBy);
        expect(item.dateLastModified).toBe(item.dateCreated);
        expect(item.ticket).toBeUndefined();
        expect(item.blobMetadata).toBeUndefined();
    });

    it("makes a file item in the given container, path and scope", () => {
        const item = makeFileContainerItem(5, "logs/build.log", "scope-1");
        expect(item.containerId).toBe(5);
        expect(item.path).toBe("logs/build.log");
        expect(item.scopeIdentifier).toBe("scope-1");
    });

    it("makes a folder item without file details", () => {
        const folder = makeFileContainerFolder();
        expect(folder.itemType).toBe(ContainerItemType.Folder);
        expect(folder.path).toBe("drop");
        expect(folder.fileLength).toBe(0);
        expect(folder.fileEncoding).toBe(0);
        expect(folder.fileType).toBe(0);
        expect(folder.fileId).toBe(0);
        expect(folder.contentId).toEqual([]);
        expect(folder.fileHash).toBeUndefined();
        const placed = makeFileContainerFolder(6, "drop/sub", "scope-2");
        expect(placed.containerId).toBe(6);
        expect(placed.path).toBe("drop/sub");
        expect(placed.scopeIdentifier).toBe("scope-2");
    });

    it("makes a folder and distinct files for a container", () => {
        const container = makeFileContainer();
        const items = makeFileContainerItems(container, 5);
        expect(items.length).toBe(6);
        expect(items[0].itemType).toBe(ContainerItemType.Folder);
        expect(new Set(items.map(i => i.path)).size).toBe(6);
        for (const item of items) {
            expect(item.containerId).toBe(container.id);
            expect(item.scopeIdentifier).toBe(container.scopeIdentifier);
        }
    });

    it("seeds containers with unique ids and scopes", () => {
        expect(containers.length).toBe(3);
        expect(new Set(containers.map(c => c.id)).size).toBe(3);
        expect(new Set(containers.map(c => c.scopeIdentifier)).size).toBe(3);
        expect(new Set(containers.map(c => c.artifactUri)).size).toBe(3);
    });

    it("seeds items with a unique path inside each container", () => {
        expect(containerItems.length).toBe(12);
        const keys = containerItems.map(i => `${i.containerId}:${i.path}`);
        expect(new Set(keys).size).toBe(keys.length);
    });
});
