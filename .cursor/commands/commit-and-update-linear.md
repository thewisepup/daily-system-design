# Commit and Update Linear Issues

## Overview
Stages all changes, commits with a message, pushes to remote, creates a pull request, and automatically updates all Linear issues currently in progress with a comment containing the pull request URL.

## Steps
1. **Check git status**
   - Verify there are uncommitted changes
   - Identify current branch
   - Determine the base branch (typically `main` or `master`)

2. **Stage and commit changes**
   - Run `git add -A` to stage all changes
   - Commit with a descriptive message
   - If no commit message is provided in the command, ask the user for one

3. **Push to remote**
   - Push the commit to the remote repository on the current branch
   - Get the commit SHA

4. **Create pull request**
   - Use GitHub API to create a pull request from the current branch to the base branch
   - Use the commit message as the PR title
   - Optionally use the commit message as the PR description
   - Get the pull request URL

5. **Update Linear issues**
   - Query Linear API for all issues assigned to the user that are "In Progress" or "Started"
   - Add a comment to each issue with the commit message and GitHub pull request URL
   - Display which issues were updated

6. **Output pull request URL**
   - Display the pull request URL prominently
   - Return the PR URL for use in other scripts or commands

## Implementation
Use the existing TypeScript script at `scripts/git-commit-and-update-linear.ts` which handles all the logic:

```bash
npx tsx scripts/git-commit-and-update-linear.ts "<commit-message>"
```

## Prerequisites
- `LINEAR_API_KEY` environment variable must be set
- `GITHUB_TOKEN` environment variable must be set (for creating pull requests)
- Git repository with a remote configured
- User must have Linear issues in "In Progress" or "Started" status
- Current branch must be different from the base branch (main/master)

## Example Usage
```
/commit-and-update-linear fix: resolve navigation bug in discover page
```

## Output
The script will:
- ✅ Stage all changes
- ✅ Commit with the provided message
- ✅ Push to remote
- ✅ Create a pull request from current branch to base branch
- ✅ Display the pull request URL
- ✅ List all in-progress Linear issues found
- ✅ Add a comment to each issue with the pull request URL
- ✅ Display success/failure for each Linear update

## Notes
- If no Linear issues are in progress, the script will complete successfully but still create the PR
- If LINEAR_API_KEY is not set, the script will warn but still complete the git operations and create the PR
- If GITHUB_TOKEN is not set, the script will fail when attempting to create the pull request
- The pull request URL follows the format: `https://github.com/platepost-video-menus/video-discovery/pull/<pr-number>`
- The script will output the PR URL to stdout for easy copying or use in other scripts

