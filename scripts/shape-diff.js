const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const API_VERSION = "7.1";

const ENDPOINTS = [
    { name: "projects", path: "_apis/projects", area: "Core", client: "CoreRestClient", call: c => c.getProjects() },
    {
        name: "git repositories",
        path: "{project}/_apis/git/repositories",
        area: "Git",
        client: "GitRestClient",
        call: (c, project) => c.getRepositories(project)
    },
    {
        name: "build definitions",
        path: "{project}/_apis/build/definitions",
        area: "Build",
        client: "BuildRestClient",
        call: (c, project) => c.getDefinitions(project)
    },
    {
        name: "test runs",
        path: "{project}/_apis/test/runs",
        area: "Test",
        client: "TestRestClient",
        call: (c, project) => c.getTestRuns(project)
    },
    {
        name: "work item types",
        path: "{project}/_apis/wit/workitemtypes",
        area: "WorkItemTracking",
        client: "WorkItemTrackingRestClient",
        call: (c, project) => c.getWorkItemTypes(project)
    },
    {
        name: "wikis",
        path: "{project}/_apis/wiki/wikis",
        area: "Wiki",
        client: "WikiRestClient",
        call: (c, project) => c.getAllWikis(project)
    },
    {
        name: "policy configurations",
        path: "{project}/_apis/policy/configurations",
        area: "Policy",
        client: "PolicyRestClient",
        call: (c, project) => c.getPolicyConfigurations(project)
    },
    {
        name: "agent pools",
        path: "_apis/distributedtask/pools",
        area: "TaskAgent",
        client: "TaskAgentRestClient",
        call: c => c.getAgentPools()
    }
];

const isRecord = value =>
    typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);

const keyPaths = (value, prefix = "", depth = 3) => {
    if (Array.isArray(value)) {
        return value.length > 0 ? keyPaths(value[0], `${prefix}[]`, depth) : [];
    }
    if (!isRecord(value) || depth === 0) {
        return [];
    }
    return Object.entries(value).flatMap(([key, child]) => {
        if (child === undefined) {
            return [];
        }
        const here = prefix ? `${prefix}.${key}` : key;
        return [here, ...keyPaths(child, here, depth - 1)];
    });
};

const diffKeys = (real, mock) => {
    const realKeys = new Set(keyPaths(real));
    const mockKeys = new Set(keyPaths(mock));
    return {
        onlyInService: [...realKeys].filter(key => !mockKeys.has(key)).sort(),
        onlyInMock: [...mockKeys].filter(key => !realKeys.has(key)).sort()
    };
};

const firstItem = value => (Array.isArray(value) ? value[0] : value);

const endpointUrl = (organizationUrl, project, endpointPath) => {
    const base = organizationUrl.replace(/\/+$/, "");
    const resolved = endpointPath.replace("{project}", encodeURIComponent(project));
    return `${base}/${resolved}?api-version=${API_VERSION}&$top=1`;
};

const readService = async (fetchImpl, url, token) => {
    const response = await fetchImpl(url, {
        method: "GET",
        headers: { Authorization: `Basic ${Buffer.from(`:${token}`).toString("base64")}`, Accept: "application/json" }
    });
    if (!response.ok) {
        throw new Error(`GET ${url.split("?")[0]} answered ${response.status}`);
    }
    const body = await response.json();
    return firstItem(Array.isArray(body.value) ? body.value : body);
};

const compare = async ({ organizationUrl, project, token, fetchImpl, getClient, clients }) => {
    const results = [];
    for (const endpoint of ENDPOINTS) {
        const url = endpointUrl(organizationUrl, project, endpoint.path);
        try {
            const real = await readService(fetchImpl, url, token);
            const mock = firstItem(await endpoint.call(getClient(clients[endpoint.client]), project));
            results.push({ name: endpoint.name, skipped: real === undefined, ...diffKeys(real, mock) });
        } catch (error) {
            results.push({ name: endpoint.name, error: error.message, onlyInService: [], onlyInMock: [] });
        }
    }
    return results;
};

const render = results =>
    results
        .map(result => {
            if (result.error) {
                return `${result.name}: could not compare (${result.error})`;
            }
            if (result.skipped) {
                return `${result.name}: the service returned no item to compare`;
            }
            const lines = [
                `${result.name}: ${result.onlyInService.length} only in the service, ${result.onlyInMock.length} only in the mock`
            ];
            result.onlyInService.forEach(key => lines.push(`  service only: ${key}`));
            result.onlyInMock.forEach(key => lines.push(`  mock only:    ${key}`));
            return lines.join("\n");
        })
        .join("\n");

module.exports = { ENDPOINTS, keyPaths, diffKeys, endpointUrl, readService, compare, render };

if (require.main === module) {
    const organizationUrl = process.env.AZURE_DEVOPS_ORG_URL;
    const project = process.env.AZURE_DEVOPS_PROJECT;
    const token = process.env.AZURE_DEVOPS_PAT;
    if (!organizationUrl || !project || !token) {
        console.error(
            "Set AZURE_DEVOPS_ORG_URL, AZURE_DEVOPS_PROJECT and AZURE_DEVOPS_PAT, then run npm run build first."
        );
        process.exit(1);
    }
    require(path.join(ROOT, "jest-helpers", "setup-globals.js"));
    const { getClient } = require(path.join(ROOT, "dist", "azure-devops-extension-api"));
    const clients = Object.fromEntries(
        ENDPOINTS.map(endpoint => [
            endpoint.client,
            require(require.resolve(`azure-devops-extension-api/${endpoint.area}`, { paths: [ROOT] }))[endpoint.client]
        ])
    );
    compare({ organizationUrl, project, token, fetchImpl: fetch, getClient, clients }).then(results => {
        console.log(render(results));
    });
}
