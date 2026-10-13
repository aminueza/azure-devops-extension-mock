const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const manifest = require(path.join(ROOT, "package.json"));

const PEERS = ["azure-devops-extension-api", "azure-devops-extension-sdk"];
const TARGETS = ["floor", "latest"];

const compareVersions = (a, b) => {
    const left = a.split(".").map(Number);
    const right = b.split(".").map(Number);
    for (let index = 0; index < 3; index += 1) {
        if (left[index] !== right[index]) {
            return left[index] - right[index];
        }
    }
    return 0;
};

const floorOf = range =>
    range
        .split("||")
        .map(part => part.trim().replace(/^[\^~]|^>=\s*/, ""))
        .sort(compareVersions)[0];

const peerVersions = (target, peers = manifest.peerDependencies) => {
    if (!TARGETS.includes(target)) {
        throw new Error(`Unknown target "${target}". Use one of: ${TARGETS.join(", ")}`);
    }
    return Object.fromEntries(PEERS.map(name => [name, target === "floor" ? floorOf(peers[name]) : "latest"]));
};

const TYPE_CHECK = `import { getClient } from "azure-devops-extension-mock";
import * as SDK from "azure-devops-extension-mock/sdk";
import { fake } from "azure-devops-extension-mock/fixtures";
import { BuildRestClient } from "azure-devops-extension-api/Build";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import { WikiRestClient } from "azure-devops-extension-api/Wiki";

export const clients = [
    getClient(BuildRestClient),
    getClient(GitRestClient),
    getClient(TaskAgentRestClient),
    getClient(WikiRestClient)
];
export const sdkVersion: number = SDK.sdkVersion;
export const seed = fake.seed;
`;

const SMOKE = `require("azure-devops-extension-mock/jest-helpers/setup-globals");
const assert = require("assert");
const { getClient } = require("azure-devops-extension-mock");
const SDK = require("azure-devops-extension-mock/sdk");
const { fake } = require("azure-devops-extension-mock/fixtures");
const { BuildRestClient } = require("azure-devops-extension-api/Build");
const { WikiRestClient } = require("azure-devops-extension-api/Wiki");

(async () => {
    fake.seed(1);
    const definitions = await getClient(BuildRestClient).getDefinitions("project");
    assert.ok(definitions.length > 0);
    const pages = await getClient(WikiRestClient).getPagePaths("project", "wiki");
    assert.ok(pages.length > 0);
    assert.strictEqual(typeof SDK.getUser().id, "string");
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
`;

const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: "inherit" });

const check = target => {
    const versions = peerVersions(target);
    const consumer = fs.mkdtempSync(path.join(os.tmpdir(), "mock-compat-"));
    run("npm", ["pack", "--silent", "--pack-destination", consumer], ROOT);
    const tarball = fs.readdirSync(consumer).find(name => name.endsWith(".tgz"));
    fs.writeFileSync(path.join(consumer, "package.json"), JSON.stringify({ name: "consumer", private: true }));
    fs.writeFileSync(path.join(consumer, "check.ts"), TYPE_CHECK);
    fs.writeFileSync(path.join(consumer, "smoke.js"), SMOKE);
    run(
        "npm",
        [
            "install",
            "--no-audit",
            "--no-fund",
            "--silent",
            "--legacy-peer-deps",
            `./${tarball}`,
            ...PEERS.map(name => `${name}@${versions[name]}`),
            `typescript@${manifest.devDependencies.typescript}`,
            `@types/node@${manifest.devDependencies["@types/node"]}`
        ],
        consumer
    );
    console.log(`Checking against ${PEERS.map(name => `${name}@${versions[name]}`).join(" and ")}`);
    run(
        "npx",
        [
            "tsc",
            "--noEmit",
            "--strict",
            "--module",
            "commonjs",
            "--moduleResolution",
            "bundler",
            "--esModuleInterop",
            "--types",
            "node",
            "--ignoreDeprecations",
            "6.0",
            "check.ts"
        ],
        consumer
    );
    run("node", ["smoke.js"], consumer);
    fs.rmSync(consumer, { recursive: true, force: true });
};

module.exports = { PEERS, TARGETS, compareVersions, floorOf, peerVersions };

if (require.main === module) {
    check(process.argv[2] ?? "floor");
}
