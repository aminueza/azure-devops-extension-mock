import { WorkRestClient } from "azure-devops-extension-api/Work";
import { getClient, MockBoardsRestClient } from "../azure-devops-extension-api";

describe("WorkRestClient boards mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(WorkRestClient) as unknown as MockBoardsRestClient;

    it("is registered under the WorkRestClient type", () => {
        expect(client.TYPE).toBe(WorkRestClient);
    });

    it("creates a board", async () => {
        const res = await client.createBoard({ name: "Sprint", type: "backlog" }, "proj");
        expect(res).toHaveProperty("board");
        expect(typeof res.board.description).toBe("string");
        expect(res.eTag?.length).toBeGreaterThan(0);
    });

    it("deletes a board", async () => {
        await expect(client.deleteBoard("proj", 1)).resolves.toBeUndefined();
    });

    it("gets a board", async () => {
        const res = await client.getBoard("proj", 1);
        expect(res.board).toHaveProperty("_links");
    });

    it("lists boards with and without paging", async () => {
        const all = await client.getBoards("proj");
        expect(all.length).toBeGreaterThan(0);
        expect(all[0]).toHaveProperty("id");
        expect(all[0]).toHaveProperty("name");
        expect(all[0]).toHaveProperty("url");
        const paged = await client.getBoards("proj", 5, 2);
        expect(paged).toBe(all);
    });

    it("updates a board", async () => {
        const res = await client.updateBoard({ name: "Renamed" }, "proj", 1, "etag");
        expect(res).toHaveProperty("board");
    });

    it("creates a board column", async () => {
        const res = await client.createBoardColumn({ name: "Doing", columnType: "state" }, "proj", 1);
        expect(res.column).toHaveProperty("id");
        expect(res.column).toHaveProperty("url");
        expect(res.eTag?.length).toBeGreaterThan(0);
    });

    it("deletes a board column", async () => {
        await expect(client.deleteBoardColumn("proj", 1, "col", true)).resolves.toBeUndefined();
    });

    it("gets a board column", async () => {
        const res = await client.getBoardColumn("proj", 1, "col");
        expect(res.column).toHaveProperty("nextColumnId");
    });

    it("lists board columns", async () => {
        const res = await client.getBoardColumns("proj", 1);
        expect(res.columns.length).toBeGreaterThan(0);
        expect(res).toHaveProperty("_links");
    });

    it("updates a board column", async () => {
        const res = await client.updateBoardColumn({ name: "Done", width: 3 }, "proj", 1, "col", "etag");
        expect(res.column).toHaveProperty("id");
    });

    it("adds a board item", async () => {
        const res = await client.addBoardItem({ rowId: "r", columnId: "c", fields: {} }, "proj", 1);
        expect(res.item).toHaveProperty("boardId");
        expect(res.item).toHaveProperty("columnId");
        expect(res.item).toHaveProperty("rowId");
        expect(res.eTag?.length).toBeGreaterThan(0);
    });

    it("gets a board item", async () => {
        const res = await client.getBoardItem("proj", 1, "item");
        expect(res.item.sourceErrorMessages?.length).toBeGreaterThan(0);
    });

    it("lists board items", async () => {
        const res = await client.getBoardItems("proj", 1);
        expect(res.items.length).toBeGreaterThan(0);
        expect(res).toHaveProperty("_links");
    });

    it("removes a board item", async () => {
        await expect(client.removeBoardItem("proj", 1, "item")).resolves.toBeUndefined();
    });

    it("updates a board item", async () => {
        const res = await client.updateBoardItem({ state: "Done", fields: {} }, "proj", 1, "item", "etag");
        expect(res.item).toHaveProperty("boardId");
    });

    it("updates board items in batch", async () => {
        const res = await client.updateBoardItems(
            { operations: [{ id: "item", state: "Done", fields: {} }] },
            "proj",
            1
        );
        expect(res.items.length).toBeGreaterThan(0);
    });

    it("creates a board row", async () => {
        const res = await client.createBoardRow({ name: "Team A", type: "team" }, "proj", 1);
        expect(res.row).toHaveProperty("id");
        expect(res.row).toHaveProperty("url");
        expect(res.eTag?.length).toBeGreaterThan(0);
    });

    it("deletes a board row", async () => {
        await expect(client.deleteBoardRow("proj", 1, "row", false)).resolves.toBeUndefined();
    });

    it("gets a board row", async () => {
        const res = await client.getBoardRow("proj", 1, "row");
        expect(res.row).toHaveProperty("nextRowId");
    });

    it("lists board rows", async () => {
        const res = await client.getBoardRows("proj", 1);
        expect(res.rows.length).toBeGreaterThan(0);
        expect(res).toHaveProperty("_links");
    });

    it("updates a board row", async () => {
        const res = await client.updateBoardRow({ name: "Team B", color: "blue" }, "proj", 1, "row", "etag");
        expect(res.row).toHaveProperty("id");
    });

    it("creates a board sync action", async () => {
        const res = await client.createBoardSyncAction({ state: "Active", columnId: "col" }, "proj", 1, "col");
        expect(typeof res.id).toBe("string");
        expect(typeof res.itemType).toBe("string");
    });
});
