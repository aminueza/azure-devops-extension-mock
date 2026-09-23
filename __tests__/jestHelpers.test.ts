import * as fs from "fs";
import * as path from "path";

const transformer = require("../jest-helpers/amd-transformer") as {
    process(source: string, filename?: string): { code: string };
    getCacheKey(source: string, filename: string): string;
};

type Loaded = { exports: unknown; required: string[]; factoryArguments: unknown[] };

const AMD_SOURCE = [
    "\"use strict\";",
    "define([\"require\", \"exports\", \"module\", \"./Client\", \"../Common/RestClientBase.js\", \"azure-devops-extension-sdk\"], function (require, exports, module, client, rest, sdk) {",
    "    globalThis.__amdCapture = Array.prototype.slice.call(arguments);",
    "    exports.loaded = true;",
    "});"
].join("\n");

const load = (code: string): Loaded => {
    const required: string[] = [];
    const fakeRequire = (id: string): { id: string } => {
        required.push(id);
        return { id };
    };
    const module = { exports: {} as Record<string, unknown> };
    new Function("require", "module", "exports", code)(fakeRequire, module, module.exports);
    const capture = (globalThis as Record<string, unknown>).__amdCapture as unknown[];
    delete (globalThis as Record<string, unknown>).__amdCapture;
    return { exports: module.exports, required, factoryArguments: capture };
};

const prologueOf = (code: string, source: string): string => code.slice(0, code.length - source.length);

describe("amd-transformer", () => {
    it("returns commonjs modules unchanged", () => {
        const source = "\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.a = require(\"./b\");";
        expect(transformer.process(source).code).toBe(source);
    });

    it("returns every installed v5 module unchanged", () => {
        const root = path.join(__dirname, "..", "node_modules", "azure-devops-extension-api");
        const files = ["Git/GitClient.js", "Common/CommonServices.js", "Core/CoreClient.js"].map(file => path.join(root, file));
        for (const file of files) {
            const source = fs.readFileSync(file, "utf8");
            expect(transformer.process(source, file).code).toBe(source);
        }
    });

    it("requires every dependency through a string literal", () => {
        const { code } = transformer.process(AMD_SOURCE);
        const prologue = prologueOf(code, AMD_SOURCE);
        expect(prologue).not.toMatch(/require\(\s*[^"\s]/);
        expect(prologue).toContain("require(\"./Client.js\")");
        expect(prologue).toContain("require(\"../Common/RestClientBase.js\")");
        expect(prologue).toContain("require(\"azure-devops-extension-sdk\")");
    });

    it("resolves relative ids to js files and leaves package ids alone", () => {
        const { required } = load(transformer.process(AMD_SOURCE).code);
        expect(required).toEqual(["./Client.js", "../Common/RestClientBase.js", "azure-devops-extension-sdk"]);
    });

    it("passes require, exports and module through to the factory", () => {
        const { factoryArguments, exports } = load(transformer.process(AMD_SOURCE).code);
        expect(typeof factoryArguments[0]).toBe("function");
        expect(factoryArguments[1]).toBe(exports);
        expect((factoryArguments[2] as { exports: unknown }).exports).toBe(exports);
        expect(factoryArguments.slice(3)).toEqual([
            { id: "./Client.js" },
            { id: "../Common/RestClientBase.js" },
            { id: "azure-devops-extension-sdk" }
        ]);
        expect(exports).toEqual({ loaded: true });
    });

    it("replaces module.exports when the factory returns a value", () => {
        const source = "define([], function () { globalThis.__amdCapture = []; return { replaced: 1 }; });";
        expect(load(transformer.process(source).code).exports).toEqual({ replaced: 1 });
    });

    it("keeps exports when the factory returns nothing", () => {
        const source = "define([\"exports\"], function (exports) { globalThis.__amdCapture = []; exports.kept = 2; });";
        expect(load(transformer.process(source).code).exports).toEqual({ kept: 2 });
    });

    it("marks the local define as amd", () => {
        const source = "globalThis.__amdCapture = [typeof define.amd];\ndefine([], function () {});";
        expect(load(transformer.process(source).code).factoryArguments).toEqual(["object"]);
    });

    it("rejects dependencies that are not string literals", () => {
        expect(() => transformer.process("define([1], function () {});")).toThrow(/string literals/);
        expect(() => transformer.process("define([\"a\", b], function () {});")).toThrow(SyntaxError);
    });

    it("derives a stable cache key from the source and the filename", () => {
        const key = transformer.getCacheKey("a", "/x.js");
        expect(key).toMatch(/^[0-9a-f]{64}$/);
        expect(transformer.getCacheKey("a", "/x.js")).toBe(key);
        expect(transformer.getCacheKey("b", "/x.js")).not.toBe(key);
        expect(transformer.getCacheKey("a", "/y.js")).not.toBe(key);
    });
});

describe("setup-globals", () => {
    const globals = globalThis as Record<string, unknown>;
    const saved = { self: globals.self, fetch: globals.fetch };

    afterEach(() => {
        globals.self = saved.self;
        globals.fetch = saved.fetch;
    });

    it("defines self and a rejecting fetch when they are missing", async () => {
        delete globals.self;
        delete globals.fetch;
        jest.isolateModules(() => require("../jest-helpers/setup-globals"));
        expect(globals.self).toBe(globalThis);
        await expect((globals.fetch as () => Promise<unknown>)()).rejects.toThrow("fetch is not available in mock tests");
    });

    it("leaves existing globals untouched", () => {
        const self = {};
        const fetch = () => Promise.resolve();
        globals.self = self;
        globals.fetch = fetch;
        jest.isolateModules(() => require("../jest-helpers/setup-globals"));
        expect(globals.self).toBe(self);
        expect(globals.fetch).toBe(fetch);
    });
});
