import { TestResultsRestClient } from "azure-devops-extension-api/TestResults";
import { getClient, getRegisteredMockClient, MockTestResultsRestClient } from "../azure-devops-extension-api";
import { RestClientBase } from "../azure-devops-extension-api/common/RestClientBase";
import { attachments } from "../azure-devops-extension-api/test/Data";
import { blobStoreAttachments } from "../azure-devops-extension-api/testResults/Data";

const decode = (buffer: ArrayBuffer): string => new TextDecoder().decode(buffer);

describe("TestResultsRestClient mock attachments", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(TestResultsRestClient);

    it("is registered for the real client and re-exported", () => {
        expect(getRegisteredMockClient(TestResultsRestClient)).toBe(MockTestResultsRestClient);
        const direct = new MockTestResultsRestClient({});
        expect(direct).toBeInstanceOf(RestClientBase);
        expect(direct.TYPE).toBe(TestResultsRestClient);
    });

    const request = { attachmentType: "GeneralAttachment", comment: "log", fileName: "run.log", stream: "QUJD" };
    const metadata = {
        attachmentType: "GeneralAttachment",
        comment: "log",
        dedupId: "abc",
        domainId: "domain",
        fileName: "run.log",
        length: 3
    };

    const references: Array<[string, () => Promise<{ id: number; url: string }>]> = [
        ["createTestIterationResultAttachment", () => client.createTestIterationResultAttachment(request, "proj", 1, 2, 3, "path")],
        ["createTestResultAttachment", () => client.createTestResultAttachment(request, "proj", 1, 2)],
        ["createTestSubResultAttachment", () => client.createTestSubResultAttachment(request, "proj", 1, 2, 3)],
        ["createTestRunAttachment", () => client.createTestRunAttachment(request, "proj", 1)],
        ["createTestResultAttachmentMetadata", () => client.createTestResultAttachmentMetadata(metadata, "proj", 1, 2)],
        ["createTestSubResultAttachmentMetadata", () => client.createTestSubResultAttachmentMetadata(metadata, "proj", 1, 2, 3)],
        ["createTestRunAttachmentMetadata", () => client.createTestRunAttachmentMetadata(metadata, "proj", 1)]
    ];

    it.each(references)("%s resolves an attachment reference", async (_name, call) => {
        const reference = await call();
        expect(typeof reference.id).toBe("number");
        expect(typeof reference.url).toBe("string");
    });

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["deleteTestResultAttachment", () => client.deleteTestResultAttachment("proj", 1, 2, 3)],
        ["deleteTestRunAttachment", () => client.deleteTestRunAttachment("proj", 1, 3)]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    const buffers: Array<[string, () => Promise<ArrayBuffer>, string]> = [
        ["getTestIterationAttachmentContent", () => client.getTestIterationAttachmentContent("proj", 1, 2, 9, 4), "iteration-attachment-9"],
        ["getTestIterationAttachmentZip", () => client.getTestIterationAttachmentZip("proj", 1, 2, 9, 4), "iteration-attachment-zip-9"],
        ["getTestResultAttachmentContent", () => client.getTestResultAttachmentContent("proj", 1, 2, 9), "result-attachment-9"],
        ["getTestResultAttachmentZip", () => client.getTestResultAttachmentZip("proj", 1, 2, 9), "result-attachment-zip-9"],
        ["getTestSubResultAttachmentContent", () => client.getTestSubResultAttachmentContent("proj", 1, 2, 9, 4), "sub-attachment-9"],
        ["getTestSubResultAttachmentZip", () => client.getTestSubResultAttachmentZip("proj", 1, 2, 9, 4), "sub-attachment-zip-9"],
        ["getTestRunAttachmentContent", () => client.getTestRunAttachmentContent("proj", 1, 9), "run-attachment-9"],
        ["getTestRunAttachmentZip", () => client.getTestRunAttachmentZip("proj", 1, 9), "run-attachment-zip-9"]
    ];

    it.each(buffers)("%s resolves a buffer naming the attachment", async (_name, call, expected) => {
        const buffer = await call();
        expect(buffer).toBeInstanceOf(ArrayBuffer);
        expect(decode(buffer)).toBe(expected);
    });

    const lists: Array<[string, () => Promise<unknown>]> = [
        ["getTestResultAttachments", () => client.getTestResultAttachments("proj", 1, 2)],
        ["getTestSubResultAttachments", () => client.getTestSubResultAttachments("proj", 1, 2, 3)],
        ["getTestRunAttachments", () => client.getTestRunAttachments("proj", 1)]
    ];

    it.each(lists)("%s resolves the seeded attachments", async (_name, call) => {
        await expect(call()).resolves.toBe(attachments);
    });

    const queries: Array<[string, (prefix?: string, id?: number) => Promise<Array<{ id: number; fileName: string; dedupId: string; domainId: string }>>]> = [
        ["queryTestResultAttachmentsMetadata", (prefix, id) => client.queryTestResultAttachmentsMetadata("proj", 1, 2, "GeneralAttachment", prefix, id, true)],
        ["queryTestSubResultAttachmentsMetadata", (prefix, id) => client.queryTestSubResultAttachmentsMetadata("proj", 1, 2, 3, "GeneralAttachment", prefix, id, true)],
        ["queryTestRunAttachmentsMetadata", (prefix, id) => client.queryTestRunAttachmentsMetadata("proj", 1, "GeneralAttachment", prefix, id, true)]
    ];

    describe.each(queries)("%s", (_name, query) => {
        it("returns every seeded attachment without filters", async () => {
            const found = await query();
            expect(found).toEqual(blobStoreAttachments);
            for (const attachment of found) {
                expect(typeof attachment.dedupId).toBe("string");
                expect(typeof attachment.domainId).toBe("string");
            }
        });

        it("filters by file name prefix", async () => {
            const target = blobStoreAttachments[1];
            await expect(query(target.fileName)).resolves.toEqual([target]);
            await expect(query("no-such-prefix")).resolves.toEqual([]);
        });

        it("returns the seeded attachment with the requested id", async () => {
            const target = blobStoreAttachments[2];
            await expect(query(undefined, target.id)).resolves.toEqual([target]);
        });

        it("fabricates an attachment for an unknown id", async () => {
            const found = await query("ignored", 424242);
            expect(found.length).toBe(1);
            expect(found[0].id).toBe(424242);
            expect(typeof found[0].dedupId).toBe("string");
        });
    });

    it("gets upload details for the requested run", async () => {
        const details = await client.getTestRunAttachmentUploadDetails("proj", 77);
        expect(details.testRunId).toBe(77);
        expect(details.isBlobStoreUploadEnabled).toBe(true);
        expect(typeof details.domainId).toBe("string");
    });
});
