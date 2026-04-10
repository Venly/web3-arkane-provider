# Release Node Application Finish Action

## Description

The "Release Node Application Finish" Action finalizes the release process for Node.js applications. It merges the release branch to main, merges back to develop, and cleans up the release branch.

## Inputs

| Input          | Description                         | Required |
| -------------- | ----------------------------------- | -------- |
| `token`        | GitHub token for authentication     | Yes      |
| `node_version` | Node Version to use (default: 18.x) | No       |

## Steps

1. **Set HOME environment variable**: Configures HOME for tooling.
2. **Setup Git Credentials**: Configures Git credentials for push operations.
3. **Setup Node.js**: Sets up the Node.js environment (18.x).
4. **Get Release Branch**: Identifies the release branch.
5. **Finalise version**: Bumps the minor version on the release branch.
6. **Merge to main**: Merges the release branch into main.
7. **Merge back to develop**: Merges main back into develop with version conflict avoidance.
8. **Push Changes**: Pushes tags and branches.
9. **Cleanup**: Deletes the release branch.

## Usage

```yaml
- name: Release Node Application Finish
  uses: ./.github/actions/release_finish
  with:
    token: ${{ github.token }}
```
