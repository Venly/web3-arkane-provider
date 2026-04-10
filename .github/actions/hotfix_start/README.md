# Hotfix Node Application Start

This GitHub Action initiates the hotfix process for a Node.js application. It sets up the environment, configures Git credentials, and prepares a new hotfix branch with a bumped version based on the semantic versioning from `package.json`.

## Inputs

| Input          | Description                         | Required |
|----------------|-------------------------------------|----------|
| `token`        | GitHub token for authentication.    | Yes      |
| `node_version` | Node Version to use (default: 18.x) | No       |

## Runs

This action utilizes the "composite" run type to execute the following steps:

1. **Set HOME environment variable** to help with tooling and scripts that might need a HOME directory.
2. **Setup Git Credentials** for subsequent Git operations within the action.
3. **Checkout production branch** (main) to start the hotfix process from the current production codebase.
4. **Setup Node.js environment** using the specified Node.js version (defaults to 18.x).
5. **Bump the application version** in `package.json` to a new prepatch version with `SNAPSHOT` preid, without creating a Git tag.
6. **Extract the semantic version** from `package.json` and prepare it for use in branch naming and tagging.
7. **Create a Hotfix Branch** with the new version and push it to the remote repository.
8. **Switch to the development branch** to prepare for the merge back into the development branch after the hotfix is finalized.
9. **Merge the hotfix changes back into the development branch** after adjusting versioning to avoid merge conflicts.
10. **Display Hotfix Process Info** with workflow name, actor, repository, reference, hotfix branch, commit SHA, run ID, and run number.

## Example Usage

```yaml
jobs:
  hotfix_start_job:
    runs-on: ubuntu-latest
    name: Start Hotfix Node Application
    steps:
      - name: Hotfix Node App Start
        uses: ./.github/actions/hotfix_start
        with:
          token: ${{ github.token }}
```
