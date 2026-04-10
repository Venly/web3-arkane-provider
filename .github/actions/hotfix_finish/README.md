# Hotfix Node Application Finish

This GitHub Action concludes the hotfix process for a Node.js application. It finalizes the hotfix version, merges the hotfix into the production branch, tags the release, publishes the hotfix, and cleans up the hotfix branch.

## Inputs

| Input          | Description                         | Required |
|----------------|-------------------------------------|----------|
| `token`        | GitHub token for authentication.    | Yes      |
| `node_version` | Node Version to use (default: 18.x) | No       |

## Runs

This action operates using the "composite" run type and carries out the steps outlined below:

1. **Set HOME environment variable** to define a consistent workspace for the action.
2. **Setup Git Credentials** to ensure access to the repository for operations such as checkout, commit, and push.
3. **Checkout production branch** (main) to apply the hotfix.
4. **Setup Node.js environment** with the specified Node.js version (defaults to 18.x).
5. **Identify the hotfix branch** by fetching remote branches and filtering for the hotfix pattern.
6. **Switch to the hotfix branch** to finalize the version and prepare for merging.
7. **Bump Version and Create Tag** using npm to finalize the hotfix version and prepare for release.
8. **Get npm version for hotfix** to capture the new version number from `package.json`.
9. **Checkout and Merge to Production Branch** to apply the hotfix changes to the production codebase.
10. **Publish Hotfix** using GitHub Releases to distribute the hotfix version.
11. **Switch to Development Branch** to integrate the hotfix changes into the ongoing development work.
12. **Merge to Develop** to synchronize the development branch with the hotfix and production changes.
13. **Push Changes** to both develop and production branches to finalize the hotfix process.
14. **Cleanup Hotfix Branch** by deleting the hotfix branch to clean up the repository.

## Hotfix Flow Info

This action also provides detailed information about the hotfix process, including the workflow name, actor, repository, reference, hotfix version, commit SHA, run ID, and run number.

## Example Usage

```yaml
jobs:
  hotfix_finish_job:
    runs-on: ubuntu-latest
    name: Finish Hotfix Node Application
    steps:
      - name: Hotfix Node App Finish
        uses: ./.github/actions/hotfix_finish
        with:
          token: ${{ github.token }}
```
