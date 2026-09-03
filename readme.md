# azure-devops-extension-mock

Jest mock for the [Azure DevOps Extension SDK](https://www.npmjs.com/package/azure-devops-extension-sdk) and [Azure DevOps Extension API](https://www.npmjs.com/package/azure-devops-extension-api). Lets you unit-test Azure DevOps web extensions without a live organization, project, or network.

[![npm](https://img.shields.io/npm/v/azure-devops-extension-mock)](https://www.npmjs.com/package/azure-devops-extension-mock)
[![Node.js CI](https://github.com/aminueza/azure-devops-extension-mock/actions/workflows/node.js.yml/badge.svg)](https://github.com/aminueza/azure-devops-extension-mock/actions/workflows/node.js.yml)
[![Security](https://github.com/aminueza/azure-devops-extension-mock/actions/workflows/security.yml/badge.svg)](https://github.com/aminueza/azure-devops-extension-mock/actions/workflows/security.yml)
[![CodeQL](https://github.com/aminueza/azure-devops-extension-mock/actions/workflows/codeql.yml/badge.svg)](https://github.com/aminueza/azure-devops-extension-mock/actions/workflows/codeql.yml)

## Install

```bash
npm install --save-dev azure-devops-extension-mock
```

The package has no runtime dependencies. Requires Node.js 20.19 or newer.

Peer dependencies (you almost certainly already have them):

- `azure-devops-extension-api` ≥ 4
- `azure-devops-extension-sdk` ≥ 4 (v5 supported)
- `jest` ≥ 29 (optional — only if you're testing with jest)

## Quick start

Mock the SDK by pointing jest's module resolver at it:

```js
// jest.config.js
module.exports = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^azure-devops-extension-sdk$": "azure-devops-extension-mock/sdk",
  },
};
```

Use the REST client mocks in your tests via `getClient`:

```ts
import { getClient } from "azure-devops-extension-mock";
import { GitRestClient } from "azure-devops-extension-api/Git";

const git = getClient(GitRestClient);
const repos = await git.getRepositories();
expect(repos.length).toBeGreaterThan(0);
```

## Coverage

The following REST clients ship with ready-made mocks and generated
fixtures. Every other Azure DevOps client is still callable through
`mockClient()` — methods will resolve to `undefined` unless you override them.

| Client                         | Mock                            | Covered methods                                                                                                                   |
| ------------------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `AccountsRestClient`           | `MockAccountsRestClient`        | `createAccount`, `getAccount`, `getAccounts`                                                                                      |
| `BoardsRestClient`             | `MockBoardsRestClient`          | boards, columns, rows, items, sync actions                                                                                        |
| `BuildRestClient`              | `MockBuildRestClient`           | `getBuilds/getBuild/queueBuild/updateBuild/deleteBuild`, definitions, artifacts, timeline, changes, logs                          |
| `CoreRestClient`               | `MockCoreRestClient`            | projects, teams, members, processes, queue create/delete/update project, identity MRU                                             |
| `DashboardRestClient`          | `MockDashboardRestClient`       | dashboards and widgets (`getDashboardsByProject`, `get/create/replace/deleteDashboard`, `get/create/update/replace/deleteWidget`) |
| `GitRestClient`                | `MockGitRestClient`             | repositories, refs, branches, commits, items, blobs, pushes, pull requests (get/create/update), comment threads                   |
| `PipelinesRestClient`          | `MockPipelinesRestClient`       | pipelines, runs, preview, artifacts, logs                                                                                         |
| `ReleaseRestClient`            | `MockReleaseRestClient`         | release definitions, releases, deployments, approvals, environments                                                               |
| `TaskAgentRestClient`          | `MockTaskAgentRestClient`       | pools, agents, queues, task groups, variable groups, deployment groups                                                            |
| `TestRestClient`               | `MockTestRestClient`            | test runs, test case results, results-by-build, attachments                                                                       |
| `WikiRestClient`               | `MockWikiRestClient`            | wikis, pages (CRUD), page batch                                                                                                   |
| `WorkItemTrackingRestClient`   | `MockWorkItemTrackingRestClient`| work items (CRUD, JSON-Patch aware), queries, WIQL, types, categories                                                             |

All SDK surface (`init`, `ready`, `getUser`, `getHost`, `getService`,
`register`, `resize`, tokens, theming, page/web/team/extension context, …)
is mocked in `azure-devops-extension-mock/sdk`.

## API

### `getClient(realClientClass, overrides?)`

Returns a mock instance for any Azure DevOps REST client class. If a
hand-written mock exists for the class it is returned directly; otherwise
the real class is auto-stubbed so every method resolves to `undefined`.

```ts
import { getClient } from "azure-devops-extension-mock";
import { BuildRestClient } from "azure-devops-extension-api/Build";

const build = getClient(BuildRestClient, {
  queueBuild: async () => ({ id: 42, status: 2 } as any),
});

const result = await build.queueBuild({} as any, "MyProject");
expect(result.id).toBe(42);
```

### `mockClient(realClientClass, overrides?, options?)`

Lower-level factory used by `getClient`. Returns a Proxy that merges the
registered hand-written mock (if any) with the caller's overrides.

### `registerMockClient(realClientClass, MockClass)`

Register a custom mock for a client not covered by this package. The
registered mock will be returned by all subsequent `getClient` calls.

### `getService(serviceId)` / `registerMockService(id, impl)`

Mocks for `CommonServiceIds.*` services: extension data, host navigation,
page layout, location, global messages, project page. Register your own
for unknown ids.

### `getPageContext`, `getUser`, `getHost`, …

Re-exported from `azure-devops-extension-mock/sdk`, matching the real SDK's
shape with randomly-generated fixture data.

### Deterministic fixtures

Fixture data is random by default. Call `seed` to make a test run
reproducible:

```ts
import { fake } from "azure-devops-extension-mock/fixtures";

beforeEach(() => fake.seed(1234));
```

## Using with jest

Two things to wire up when testing an extension:

1. Redirect the SDK import in `jest.config.js` (`moduleNameMapper`).
2. If your tests import from `azure-devops-extension-api/*` directly, add
   the AMD transformer that ships with this repo. The real package is
   published as AMD-only and jest needs help loading it under Node.

A ready-to-copy configuration:

```js
// jest.config.js
module.exports = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^azure-devops-extension-sdk$": "azure-devops-extension-mock/sdk",
  },
  transform: {
    "node_modules[\\\\/]azure-devops-extension-api[\\\\/].+\\.js$":
      "azure-devops-extension-mock/jest-helpers/amd-transformer",
  },
  transformIgnorePatterns: ["node_modules/(?!azure-devops-extension-api)"],
  setupFiles: ["azure-devops-extension-mock/jest-helpers/setup-globals"],
};
```

## Contributing

```bash
npm ci
npm test              # runs jest with coverage (90% threshold enforced)
npm run build         # emits dist/
npm run audit:prod    # production dependency audit
```

CI runs tests on Node 22 and 24 (`node.js.yml`), weekly `npm audit` and
Gitleaks scans (`security.yml`), and CodeQL analysis (`codeql.yml`).

## Releasing

1. Update the version in `package.json` and move the `Unreleased` notes in
   `CHANGELOG.md` under that version.
2. Merge to `main`, then push a tag matching the version: `git tag v1.2.3 && git push origin v1.2.3`.
3. `release.yml` builds, tests, audits, publishes to npm with provenance
   via [trusted publishing](https://docs.npmjs.com/trusted-publishers), and
   creates the GitHub release. No npm token is stored in the repository.

## License

MIT — see [license](./license).
