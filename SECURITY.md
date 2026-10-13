# Security policy

## Supported versions

Security fixes go into the latest major version published on npm.

## Reporting a vulnerability

Please report a vulnerability privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. That creates a private advisory only the maintainers can see.

Do not open a public issue or pull request for a vulnerability.

Include what you can:

- the version of `azure-devops-extension-mock` you use;
- what an attacker could do;
- steps or a small project that reproduces it.

You should get a first answer within a week. Once a fix is released, the advisory is published with credit to the reporter unless you ask otherwise.

## Scope

This package is a development dependency: it runs in tests and never in a deployed extension. It has no runtime dependencies and issues no network requests. The fixtures contain no real credentials; values shaped like secrets are the placeholder `"***"`.
