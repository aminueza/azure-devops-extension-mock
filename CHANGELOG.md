# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Hand-written mocks for the methods `azure-devops-extension-api` 5.280.1 adds: `AlertRestClient.submitTriageSignals` and `GalleryRestClient.activatePolicy`, `setExtensionDeprecation` and `removeExtensionDeprecation`.

### Changed

- The fixtures follow `azure-devops-extension-api` 5.280.1: alerts carry `epssScore` and `epssPercentile` (set on dependency alerts, absent elsewhere), published extensions carry `deprecation` (absent) and draft assets carry `isPayloadAsset`.

## [2.1.0] - 2026-10-13

### Added

- An opt-in stateful mode. After `stateful.enable()`, what a test creates, updates or deletes through `GitRestClient`, `WorkItemTrackingRestClient` or `BuildRestClient` is returned by later reads, and `stateful.reset()` restores the seeded data. The mode is off by default, so existing tests see no change. The readme lists the reads that do not follow writes.

### Changed

- The mock classes no longer use `any`. Parameters and return values that the real clients type as `any` are `unknown` in the `Mock*RestClient` classes. `getClient` still returns the real client's type, so code that goes through `getClient` is unaffected; code that calls a `Mock*RestClient` class directly may need a type annotation.

### Fixed

- `WorkItemTrackingRestClient.deleteWorkItem` returns a `WorkItemDelete` with the deleted work item in `resource`. It used to return `{ id, deleted: true }`, which is not the declared type.
- `BuildRestClient.getBuildLogs` is typed as `BuildLog[]`.
- `BuildRestClient.updateBuildProperties` and `updateDefinitionProperties` ignore a document that is not a list of operations; they used to throw.

## [2.0.0] - 2026-10-13

This release mocks every REST client in `azure-devops-extension-api` and lets the compiler check the fixtures. It is a major version because some mocks return different values than in 1.x and the supported peer range is narrower; both are listed under "Changed".

### Added

- Hand-written mocks for the last 19 `GitRestClient` methods: the Advanced Security enablement and billing methods and the ref favorite methods.
- Hand-written mocks for the last 48 `TaskAgentRestClient` methods: environments, Kubernetes resources, virtual machine groups, secure files, task groups, task definitions, packages, Azure subscriptions and management groups, endpoint queries and the YAML schema. Every method of the twelve mocked clients now returns fixtures.
- Hand-written mocks for six more clients, registered with `getClient` like the existing ones: `GraphRestClient` (40 methods), `PolicyRestClient` (12), `ServiceEndpointRestClient` (27), `TestPlanRestClient` (48), `TestResultsRestClient` (140) and `TfvcRestClient` (24). The mock classes are exported as `MockGraphRestClient`, `MockPolicyRestClient`, `MockServiceEndpointRestClient`, `MockTestPlanRestClient`, `MockTestResultsRestClient` and `MockTfvcRestClient`.
- Hand-written mocks for the remaining 19 clients of `azure-devops-extension-api`, so every REST client the package ships is registered with `getClient`: `AlertRestClient` (34 methods), `ContributionsRestClient` (4), `ExtensionManagementRestClient` (26), `FavoriteRestClient` (10), `FeatureAvailabilityRestClient` (5), `FeatureManagementRestClient` (9), `FileContainerRestClient` (4), `GalleryRestClient` (88), `LocationsRestClient` (10), `ManagementRestClient` (21), `NotificationRestClient` (24), `OperationsRestClient` (1), `ProfileRestClient` (12), `ProjectAnalysisRestClient` (4), `ReportingRestClient` from `AdvancedSecurity.Reporting` (13), `ResourceUsageRestClient` (2), `ServiceHooksRestClient` (23), `WorkItemTrackingProcessRestClient` (57) and `WorkItemTrackingProcessDefinitionsRestClient` (46). Each mock class is exported as `Mock<Name>RestClient`.
- `ReleaseRestClient.getTaskLog2` and `ReleaseRestClient.getTasks2`.

### Changed

- The fixtures are now checked by the compiler. Almost every fixture maker used to end in a type cast, which hid missing required fields and, in some places, values of the wrong type. The casts are gone, every required field is filled, and `registerMockClient` checks each mock class against the real client it replaces. This changes what some mocks return:
  - **Test:** `outcome` on test results, points, action results and iteration details is the outcome name (`"Passed"`, `"Failed"`) instead of a number. A test run's `state` is `"Completed"` instead of `3`. An attachment's `attachmentType` is the `AttachmentType` enum value instead of the string `"GeneralAttachment"`.
  - **Release:** `ReleaseDefinition.environments` holds `ReleaseDefinitionEnvironment` objects (ranks 1 to 3, no `status`, `releaseId` or `deploySteps`) instead of release environments. Nested `release`, `releaseDefinition` and `releaseEnvironment` objects are full shallow references. `_links` is gone from release environments and approvals, which do not declare it.
  - **Git:** `getCommit` returns a `GitCommit` with `treeId`, `getRefs` returns a `PagedList<GitRef>` with a `continuationToken`, and `getBlob` returns a `GitBlobRef`. Pull requests, repositories, refs, commits, items, pushes and comment threads carry every declared field the service always returns.
  - **TaskAgent:** agents inside job requests and cloud requests are `TaskAgentReference` objects without the full agent fields. Pools, queues, task groups and deployment groups lose `_links`, which their types do not declare, and task groups carry the full task definition fields.
  - **Core, Dashboard and Pipelines:** a team's `identity` is an `Identity` instead of an identity reference. A pipeline's `configuration.type` is `ConfigurationType.Yaml` instead of the string `"yaml"`. A widget's `dashboard` is a dashboard with no widgets instead of `null`.
  - **Build:** builds carry every declared field the service always returns.
  - **Fields the service leaves out stay out.** A fixture does not set a field that only appears under a condition the fixture does not model: an active pull request has no `closedBy`, `autoCompleteSetBy` or `forkSource`, an unlocked ref has no `isLockedBy`, a repository that is not a fork has no `parentRepository`, an idle agent has no `assignedRequest`, and a build has no `triggeredByBuild`.
  - **Everywhere:** makers draw more random values than before, so the values produced under a fixed `fake.seed` differ from earlier releases.
- The peer range for `azure-devops-extension-api` is now `^5.273.0`. The previous range, `^4.0.0 || ^5.272.3`, claimed support that never worked: every 1.x release requires `azure-devops-extension-api/Pipelines`, which v4 and 5.271 do not ship, so the package failed to load there, and 5.272 lacks a type the TaskAgent mock imports.
- The peer range for `azure-devops-extension-sdk` is now `^4.0.2 || ^5.0.0`. Versions 4.0.0 and 4.0.1 are published without usable type declarations.

### Fixed

- `npm run surface` skipped client methods with a digit in their name, so `ReleaseRestClient.getTaskLog2` and `getTasks2` were missing from the mock while the table reported the client as complete.
- The seeded projects, teams, project collections and work item queries no longer repeat a name, and queries no longer repeat a path. Two entries could draw the same value, so a lookup by name, such as `CoreRestClient.getProject(name)`, returned the wrong entry in about 6% of runs for projects.
- The SDK mock's declarations import their types from `azure-devops-extension-sdk` instead of `azure-devops-extension-sdk/SDK`. The SDK does not export that subpath, so the old import failed to resolve under `bundler` and `node16` module resolution.

## [1.1.0] - 2026-10-01

### Added

- `WikiRestClient.getPagePaths`, new in `azure-devops-extension-api` 5.279, returns the `id`, `path` and `isParentPage` of every seeded wiki page.
- Seeded build definitions carry `priority: BuildDefinitionPriority.Normal`, the field 5.279 added to `BuildDefinition`.
- Seeded build definitions carry a continuous integration trigger and a pull request trigger with `suppressPipelineStatusComments: false`, the field 5.279 added to `PullRequestTrigger`.

### Fixed

- `makeBuildDefinition` fills every field of `BuildDefinition` without a type cast, so a field a future `azure-devops-extension-api` release makes required fails the build instead of going missing from the fixture. `Build.definition` is now a plain `DefinitionReference`, matching the real type.
- The seeded `PipelineGeneralSettings` sets `enforceEvenStricterJobAuthScopeInRunRelatedApis` to `false`, the field `azure-devops-extension-api` 5.279 made required, so the package builds against that release.

## [1.0.2] - 2026-09-23

### Removed

- The optional `jest` peer dependency. Nothing in the published package imports Jest, but the declaration made supply-chain scanners that resolve optional peers pull Jest's entire dependency tree, about 280 packages, into this package's analysis. The mocks work with any test runner; the helpers in `jest-helpers/` still target Jest 29 and 30. A test now fails if shipped source ever imports a test framework.

## [1.0.1] - 2026-09-23

### Fixed

- `jest-helpers/amd-transformer` no longer injects a `define` shim that calls `require()` with a computed path. It reads the dependency list of the AMD `define([...])` call at transform time and emits one string-literal `require()` per dependency, so neither the helper nor the code it generates contains a dynamic require. Modules that do not call `define`, which includes every module of `azure-devops-extension-api` v5, are returned unchanged instead of being wrapped in an unused shim. The cache key changes, so Jest re-transforms on the first run after upgrading.
- The shipped Jest helpers no longer carry comments; their usage is documented in the readme.

## [1.0.0] - 2026-09-08

First release on npm.

### Added

- Hand-written mocks for `AccountsRestClient`, `WorkRestClient` (boards), `BuildRestClient`, `CoreRestClient`, `DashboardRestClient`, `GitRestClient`, `PipelinesRestClient`, `ReleaseRestClient`, `TaskAgentRestClient`, `TestRestClient`, `WikiRestClient` and `WorkItemTrackingRestClient`.
- `getClient`, `mockClient`, `registerMockClient` and `getRegisteredMockClient` for resolving and overriding REST client mocks.
- `getService` and `registerMockService` for `CommonServiceIds` services.
- Full `azure-devops-extension-sdk` surface under `azure-devops-extension-mock/sdk`.
- Jest helpers `amd-transformer` and `setup-globals` for loading the AMD-only real package under Node.
- Internal, dependency-free fixture generator with a `seed()` function for deterministic test data.
- Every method of every registered REST client is callable through `getClient`; methods without a hand-written implementation resolve to `undefined` and can be pinned with overrides.
- `sdkVersion` and `getService` on the SDK mock, completing the real SDK export list.
- `scripts/surface.js` and a test that compare the mocks with the real `.d.ts` declarations, so no mock method can drift away from the real client.
- Release workflow publishing to npm with provenance via trusted publishing.

### Changed

- Fixture data is now generated by an internal module instead of `@faker-js/faker`; the package has no runtime dependencies.
- `azure-devops-extension-sdk` peer range now accepts v4 and v5.
- `MockExtensionDataManager.setValue` returns the value it was given, and `queryCollections` echoes the collections passed in.
- `MockBoardsRestClient`, `MockCoreRestClient`, `MockDashboardRestClient` and `MockWikiRestClient` now implement the full real client surface with the real signatures. The old Boards preview methods (`createBoard`, `addBoardItem`, …), `MockWikiRestClient.getPage/deletePage/createOrUpdatePage`, `MockCoreRestClient.getProjectsPaged` and `MockTaskAgentRestClient.getVariableGroupsPaged` did not exist on the real clients and were removed.
- `MockReleaseRestClient`, `MockTestRestClient` and `MockWorkItemTrackingRestClient` are complete, and `MockBuildRestClient`, `MockGitRestClient` and `MockTaskAgentRestClient` cover most of their surface. See the table in the readme for the current counts; the remaining methods still resolve to `undefined` and accept overrides.

### Fixed

- `MockExtensionDataManager.getValue`, `setValue`, `getDocument`, `getDocuments`, `queryCollections`, `queryCollectionsByName` and `MockExtensionDataService.getExtensionDataManager` returned promises that never settled.
- `mockClient` bound the real methods of an unregistered client class, so calling one issued a live HTTP request instead of resolving to `undefined`.
- `MockTaskAgentRestClient.getAgentQueue` had its parameters reversed relative to the real client, and `MockBuildRestClient.getBuildLog` returned an `ArrayBuffer` where the real client returns a `string`.
- Fixture ids were drawn at random from a small range, so two entries in a seeded list could collide and a lookup by id would return the wrong entry. Ids now come from a sequential generator (`fake.number.id()`) and cannot repeat.

[2.1.0]: https://github.com/aminueza/azure-devops-extension-mock/releases/tag/v2.1.0
[2.0.0]: https://github.com/aminueza/azure-devops-extension-mock/releases/tag/v2.0.0
[1.1.0]: https://github.com/aminueza/azure-devops-extension-mock/releases/tag/v1.1.0
[1.0.2]: https://github.com/aminueza/azure-devops-extension-mock/releases/tag/v1.0.2
[1.0.1]: https://github.com/aminueza/azure-devops-extension-mock/releases/tag/v1.0.1
[1.0.0]: https://github.com/aminueza/azure-devops-extension-mock/releases/tag/v1.0.0
