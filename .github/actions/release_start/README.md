# Release Node Application Start Action

## Description

The "Release Node Application Start" Action automates the start of the release process for Node.js applications. It creates a new release branch from develop and bumps the develop version.

## Inputs

| Input          | Description                         | Required |
| -------------- | ----------------------------------- | -------- |
| `token`        | GitHub token for authentication     | Yes      |
| `node_version` | Node Version to use (default: 18.x) | No       |

## Steps

1. **Set HOME environment variable**: Configures HOME for tooling.
2. **Setup Git Credentials**: Configures Git credentials for push operations.
3. **Setup Node.js**: Sets up the Node.js environment (18.x).
4. **Switch to develop**: Ensures the local develop branch is up-to-date.
5. **Read package version**: Reads the current version from package.json.
6. **Extract semantic version**: Extracts the major.minor.patch version.
7. **Create Release Branch**: Creates a `release-<version>` branch.
8. **Bump develop version**: Bumps the develop branch to the next SNAPSHOT preminor.

## Usage

```yaml
- name: Release Node Application Start
  uses: ./.github/actions/release_start
  with:
    token: ${{ github.token }}
```
