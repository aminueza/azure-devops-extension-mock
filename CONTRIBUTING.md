# Contributing

Thanks for helping. This page lists what a change needs before it can merge.

## Setup

```bash
npm ci
npm run lint
npm run format:check
npm test
npm run build
```

Node.js 20.19 or newer is required.

## Rules for a change

- **Tests ship with the change.** Every new mock method, fixture or fix has a test in the same pull request.
- **Coverage stays at 100%.** `npm test` fails below 100% statements, branches, functions and lines.
- **No comments in code.** Source, tests and config carry no comments or docstrings. Put the reasoning in the commit message and the pull request description. Bare lint directives are fine.
- **No type escapes in fixtures.** Do not write `as any` or `as unknown as`. Fill every required field so the compiler checks the fixture. A test fails if a new cast appears in shipped source.
- **Formatting is automatic.** Run `npm run format`; CI runs `npm run format:check`.

## Writing or changing a mock

- Mock methods copy the real client's signature: same parameter names, order, optionality and return type. Prefix a parameter the mock does not read with `_`. `registerMockClient` type-checks the mock class against the real client.
- Random data comes from `fake` in `azure-devops-extension-api/common/fixtures.ts`. Use `fake.number.id()` for numeric ids.
- Seed a list that is searched by name with `fake.helpers.distinct`, so two entries cannot share the name.
- Leave out a field the service only returns under a condition the fixture does not model, using `fake.helpers.absent()`. An open pull request has no `closedBy`.
- Run `npm run surface` and paste the table into the readme when the set of mocked methods changes. A test compares the two.

## Supported versions

The package must load and type-check against the oldest peers it declares, not only the newest.

- `npm run compat floor` installs the packed build next to the oldest supported `azure-devops-extension-api` and `azure-devops-extension-sdk`, and `npm run compat latest` does the same with the newest.
- In shipped source, import only types and enums that exist in the oldest supported `azure-devops-extension-api`. For a type that only a newer release has, declare its shape inline. For an enum value that only a newer release has, write the literal.
- Import a value from another `azure-devops-extension-api/<Area>` module only if that module loads in plain Node. `Identities` does not: it loads the real SDK.
- `npm run example` installs the packed build into the example extension under `examples/consumer` and runs its tests.

## Commits and pull requests

- Use a conventional prefix: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Say what changed and why. Mention anything you could not verify.
- Add an entry under `Unreleased` in `CHANGELOG.md` when the published package changes.

## Reporting a security problem

See [SECURITY.md](./SECURITY.md). Do not open a public issue for a vulnerability.
