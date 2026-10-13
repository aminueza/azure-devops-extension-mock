const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const EXAMPLE = path.join(ROOT, "examples", "consumer");

const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: "inherit" });

const check = () => {
    const consumer = fs.mkdtempSync(path.join(os.tmpdir(), "mock-example-"));
    fs.cpSync(EXAMPLE, consumer, { recursive: true, filter: source => !source.includes("node_modules") });
    run("npm", ["pack", "--silent", "--pack-destination", consumer], ROOT);
    const tarball = fs.readdirSync(consumer).find(name => name.endsWith(".tgz"));
    run("npm", ["install", "--no-audit", "--no-fund", "--silent"], consumer);
    run("npm", ["install", "--no-audit", "--no-fund", "--silent", "--no-save", `./${tarball}`], consumer);
    run("npx", ["tsc", "--noEmit"], consumer);
    run("npx", ["jest"], consumer);
    fs.rmSync(consumer, { recursive: true, force: true });
};

module.exports = { EXAMPLE };

if (require.main === module) {
    check();
}
