# Simple Git push helper — usage:
#   .\git_push_full.ps1 "commit message" origin main
# If run without args it will use defaults and determine current branch.

# defaults
$Message = "chore: update repository"
$Remote  = "origin"
$Branch  = ""

# override from arguments: [0]=message [1]=remote [2]=branch
if ($args.Count -ge 1) { $Message = $args[0] }
if ($args.Count -ge 2) { $Remote  = $args[1] }
if ($args.Count -ge 3) { $Branch  = $args[2] }

# Ensure we are inside a git working tree
if (-not (Test-Path ".git")) {
    Write-Error "No .git folder found. Run this script from the repository root."
    exit 1
}

# Determine current branch if not provided
if ([string]::IsNullOrWhiteSpace($Branch)) {
    $Branch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($Branch)) {
        Write-Error "Failed to determine current git branch. Provide branch as third argument."
        exit 1
    }
}

Write-Host "Branch: $Branch"
Write-Host "Remote: $Remote"
Write-Host "Commit message: $Message"

# Stage everything
Write-Host "Staging changes..."
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Error "git add failed."
    exit 1
}

# Only commit if there are staged changes
$porcelain = git status --porcelain
if ([string]::IsNullOrWhiteSpace($porcelain)) {
    Write-Host "No changes to commit."
} else {
    Write-Host "Committing changes..."
    git commit -m $Message
    if ($LASTEXITCODE -ne 0) {
        Write-Error "git commit failed."
        exit 1
    }
}

# Ensure remote exists
git remote get-url $Remote 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Remote '$Remote' not found. Add it with: git remote add $Remote <url>"
    exit 1
}

# Push (try normal push, then fallback to setting upstream)
Write-Host "Pushing to $Remote/$Branch ..."
git push $Remote $Branch
if ($LASTEXITCODE -ne 0) {
    Write-Warning "git push failed; attempting 'git push -u $Remote $Branch'..."
    git push -u $Remote $Branch
    if ($LASTEXITCODE -ne 0) {
        Write-Error "git push failed. Inspect output above."
        exit 1
    }
}

Write-Host "Push completed successfully."