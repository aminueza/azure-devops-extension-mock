const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const API = path.join(ROOT, "node_modules", "azure-devops-extension-api");

const CLIENTS = [
    { area: "Accounts", real: "AccountsRestClient", mock: "accounts/Accounts.ts" },
    { area: "Work", real: "WorkRestClient", mock: "boards/Boards.ts" },
    { area: "Build", real: "BuildRestClient", mock: "build/Build.ts" },
    { area: "Core", real: "CoreRestClient", mock: "core/Core.ts" },
    { area: "Dashboard", real: "DashboardRestClient", mock: "dashboard/Dashboard.ts" },
    { area: "Git", real: "GitRestClient", mock: "git/Git.ts" },
    { area: "Pipelines", real: "PipelinesRestClient", mock: "pipelines/Pipelines.ts" },
    { area: "Release", real: "ReleaseRestClient", mock: "release/Release.ts" },
    { area: "TaskAgent", real: "TaskAgentRestClient", mock: "taskAgent/TaskAgent.ts" },
    { area: "Test", real: "TestRestClient", mock: "test/Test.ts" },
    { area: "Wiki", real: "WikiRestClient", mock: "wiki/Wiki.ts" },
    { area: "WorkItemTracking", real: "WorkItemTrackingRestClient", mock: "workItemTracking/WorkItemTracking.ts" }
];

const methodNames = (source) => {
    const names = new Set();
    for (const match of source.matchAll(/^ {4}([a-zA-Z]+)\(/gm)) {
        if (match[1] !== "constructor") {
            names.add(match[1]);
        }
    }
    return names;
};

const realMethods = (area) =>
    methodNames(fs.readFileSync(path.join(API, area, `${area}Client.d.ts`), "utf8"));

const mockMethods = (mock) =>
    methodNames(fs.readFileSync(path.join(ROOT, "azure-devops-extension-api", mock), "utf8"));

const report = () =>
    CLIENTS.map(({ area, real, mock }) => {
        const realSet = realMethods(area);
        const mockSet = mockMethods(mock);
        const implemented = [...mockSet].filter((name) => realSet.has(name));
        const phantom = [...mockSet].filter((name) => !realSet.has(name));
        const missing = [...realSet].filter((name) => !mockSet.has(name));
        return { area, real, implemented, phantom, missing, total: realSet.size };
    });

const markdown = (rows) => {
    const lines = [
        "| Client | Hand-written | Stubbed | Total |",
        "| --- | ---: | ---: | ---: |"
    ];
    for (const row of rows) {
        lines.push(`| \`${row.real}\` | ${row.implemented.length} | ${row.missing.length} | ${row.total} |`);
    }
    const implemented = rows.reduce((sum, row) => sum + row.implemented.length, 0);
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    lines.push(`| **All** | **${implemented}** | **${total - implemented}** | **${total}** |`);
    return lines.join("\n");
};

module.exports = { CLIENTS, methodNames, realMethods, mockMethods, report, markdown };

if (require.main === module) {
    const rows = report();
    console.log(markdown(rows));
    const phantom = rows.filter((row) => row.phantom.length > 0);
    if (phantom.length > 0) {
        console.error("\nMock methods that do not exist on the real client:");
        for (const row of phantom) {
            console.error(`  ${row.real}: ${row.phantom.join(", ")}`);
        }
        process.exit(1);
    }
}
