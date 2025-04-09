# Release

We use [create-release-branch](https://github.com/MetaMask/create-release-branch) to create the releases, instead of the `create-release-pr` workflow in the module template.

For a monorepo we are using an "independent" versioning strategy, and release are trigger via the command line using create-release-branch tool.

Refer to the [usage documentation](https://github.com/MetaMask/create-release-branch/blob/main/docs/usage-monorepo-independent.md) when preparing a release. The tool needs to know two things:

1. Which packages you want to release and how to set the version for each package.
2. Whether or not you are creating a backport release as opposed to an "ordinary" release.
