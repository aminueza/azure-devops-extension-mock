import { CoreRestClient } from "azure-devops-extension-api/Core";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { getClient } from "../azure-devops-extension-api";

const shapeDiff = require("../scripts/shape-diff") as {
    ENDPOINTS: Array<{ name: string; path: string; client: string }>;
    keyPaths(value: unknown, prefix?: string, depth?: number): string[];
    diffKeys(real: unknown, mock: unknown): { onlyInService: string[]; onlyInMock: string[] };
    endpointUrl(organizationUrl: string, project: string, endpointPath: string): string;
    readService(fetchImpl: unknown, url: string, token: string): Promise<unknown>;
    compare(
        options: Record<string, unknown>
    ): Promise<
        Array<{ name: string; error?: string; skipped?: boolean; onlyInService: string[]; onlyInMock: string[] }>
    >;
    render(results: unknown[]): string;
};

const respond = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });

describe("shape diff script", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("lists key paths without values, following the first array item", () => {
        const value = {
            id: 1,
            name: "secret-value",
            owner: { id: "a", gone: undefined },
            tags: [{ label: "x" }],
            empty: []
        };
        expect(shapeDiff.keyPaths(value)).toEqual(["id", "name", "owner", "owner.id", "tags", "tags[].label", "empty"]);
        expect(shapeDiff.keyPaths("text")).toEqual([]);
        expect(shapeDiff.keyPaths({ a: { b: { c: { d: 1 } } } })).toEqual(["a", "a.b", "a.b.c"]);
        expect(shapeDiff.keyPaths({ when: new Date() })).toEqual(["when"]);
    });

    it("reports the keys each side has alone", () => {
        expect(shapeDiff.diffKeys({ id: 1, url: "u" }, { id: 2, name: "n" })).toEqual({
            onlyInService: ["url"],
            onlyInMock: ["name"]
        });
    });

    it("builds a read-only url for the organization and project", () => {
        expect(
            shapeDiff.endpointUrl("https://dev.azure.com/org/", "My Project", "{project}/_apis/git/repositories")
        ).toBe("https://dev.azure.com/org/My%20Project/_apis/git/repositories?api-version=7.1&$top=1");
    });

    it("only issues GET requests and never puts the token in the url", async () => {
        const fetchImpl = jest.fn(async () => respond({ value: [{ id: "p" }] }));
        const item = await shapeDiff.readService(
            fetchImpl,
            "https://dev.azure.com/org/_apis/projects?api-version=7.1",
            "pat"
        );
        expect(item).toEqual({ id: "p" });
        const [url, options] = fetchImpl.mock.calls[0] as unknown as [
            string,
            { method: string; headers: Record<string, string> }
        ];
        expect(options.method).toBe("GET");
        expect(url).not.toContain("pat");
        expect(options.headers.Authorization).toBe(`Basic ${Buffer.from(":pat").toString("base64")}`);
    });

    it("reads a body that is not wrapped in a value list", async () => {
        const fetchImpl = jest.fn(async () => respond({ id: "single" }));
        await expect(shapeDiff.readService(fetchImpl, "https://x/_apis/y?z", "pat")).resolves.toEqual({ id: "single" });
    });

    it("fails with the status and without the query string", async () => {
        const fetchImpl = jest.fn(async () => respond({}, 401));
        await expect(shapeDiff.readService(fetchImpl, "https://x/_apis/y?api-version=7.1", "pat")).rejects.toThrow(
            "GET https://x/_apis/y answered 401"
        );
    });

    it("compares every endpoint against the mock and keeps going after a failure", async () => {
        const fetchImpl = jest.fn(async (url: string) => {
            if (url.includes("/_apis/projects")) {
                return respond({ value: [{ id: "p", name: "n", extraFromService: true }] });
            }
            if (url.includes("/git/repositories")) {
                return respond({ value: [] });
            }
            return respond({}, 404);
        });
        const clients = { CoreRestClient, GitRestClient };
        const results = await shapeDiff.compare({
            organizationUrl: "https://dev.azure.com/org",
            project: "proj",
            token: "pat",
            fetchImpl,
            getClient,
            clients
        });
        expect(results.map(result => result.name)).toEqual(shapeDiff.ENDPOINTS.map(endpoint => endpoint.name));
        expect(results[0].onlyInService).toEqual(["extraFromService"]);
        expect(results[0].onlyInMock).toContain("visibility");
        expect(results[1].skipped).toBe(true);
        expect(results[2].error).toContain("answered 404");
        const text = shapeDiff.render(results);
        expect(text).toContain("projects: 1 only in the service");
        expect(text).toContain("  service only: extraFromService");
        expect(text).toContain("  mock only:    visibility");
        expect(text).toContain("git repositories: the service returned no item to compare");
        expect(text).toContain("build definitions: could not compare (GET");
        expect(text).not.toContain("pat");
    });
});
