<#
.SYNOPSIS
  One-shot: install Git if missing, then commit the engine and push to GitHub.

.DESCRIPTION
  Claude Code could not run this itself because (a) git is not installed on this machine and
  (b) pushing needs YOUR GitHub credentials. This script does the whole thing for you.

  Run it from a normal PowerShell window:
      powershell -ExecutionPolicy Bypass -File .\bootstrap\push-to-github.ps1

  The remote 'origin' is already set to https://github.com/NeamulMorshed/The-Monkey-Brain.git
  in this repo's .git/config, so no remote wiring is needed.

.NOTES
  When 'git push' runs, GitHub will prompt for authentication — a browser window
  (Git Credential Manager) or a Personal Access Token used as the password. That step
  is interactive and only you can complete it.
#>
[CmdletBinding()]
param(
  [string] $RepoPath = (Split-Path -Parent $PSScriptRoot),  # the engine repo (parent of bootstrap/)
  [string] $Branch   = 'main'
)

$ErrorActionPreference = 'Stop'

function Have-Git { [bool](Get-Command git.exe -ErrorAction SilentlyContinue) }

Write-Host "== The Monkey Brain -> GitHub ==" -ForegroundColor Cyan
Write-Host "Repo: $RepoPath" -ForegroundColor DarkGray

# 1. Ensure git exists -------------------------------------------------------------------
if (-not (Have-Git)) {
  Write-Host "git not found. Installing via winget..." -ForegroundColor Yellow
  if (-not (Get-Command winget.exe -ErrorAction SilentlyContinue)) {
    throw "winget is not available. Install Git manually from https://git-scm.com/download/win then re-run."
  }
  winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements
  # winget updates the machine PATH, but not this process. Add the default install bin so we can use git now.
  $gitBin = "C:\Program Files\Git\cmd"
  if (Test-Path "$gitBin\git.exe") { $env:Path = "$gitBin;$env:Path" }
  if (-not (Have-Git)) {
    throw "Git was installed but isn't on this session's PATH. Close and reopen PowerShell, then re-run this script."
  }
  Write-Host "git installed: $((Get-Command git.exe).Source)" -ForegroundColor Green
} else {
  Write-Host "git present: $((Get-Command git.exe).Source)" -ForegroundColor Green
}

Set-Location $RepoPath

# 2. Identity (only set if missing) ------------------------------------------------------
if (-not (git config user.name))  { git config user.name  "Neamul Morshed" }
if (-not (git config user.email)) { git config user.email "neamul.morshed.nahid@gmail.com" }

# 3. Confirm the remote ------------------------------------------------------------------
$origin = (git remote get-url origin 2>$null)
if (-not $origin) {
  git remote add origin "https://github.com/NeamulMorshed/The-Monkey-Brain.git"
  $origin = (git remote get-url origin)
}
Write-Host "origin: $origin" -ForegroundColor DarkGray

# 4. Stage + commit (skip commit if nothing changed) -------------------------------------
git add -A
$pending = (git status --porcelain)
if ($pending) {
  $msg = @"
feat: The Monkey Brain - reusable LLM knowledge engine

- bootstrap/ (new-brain.ps1/.sh scaffold .brain instances; lint-brain.ps1; this push script)
- schema/ (canonical CLAUDE.md operating manual + brain-template + page templates)
- examples/claude-code-brain/ - worked sample: 12 sources compiled into 60
  cross-linked, lint-clean wiki pages (Mermaid index, Dataview dashboard, Marp deck)
- README documents the engine-vs-instances model
"@
  git commit -m $msg
  Write-Host "Committed." -ForegroundColor Green
} else {
  Write-Host "Nothing to commit (working tree clean)." -ForegroundColor DarkGray
}

# 5. Push (handles the 'remote already has commits' case) --------------------------------
Write-Host "Pushing to origin/$Branch ... (GitHub will prompt for login)" -ForegroundColor Cyan
git branch -M $Branch
$pushOk = $true
try { git push -u origin $Branch }
catch { $pushOk = $false }

if (-not $pushOk) {
  Write-Host "Push rejected - remote may already have commits. Reconciling with rebase..." -ForegroundColor Yellow
  git pull --rebase origin $Branch
  git push -u origin $Branch
}

Write-Host ""
Write-Host "Done. View it at https://github.com/NeamulMorshed/The-Monkey-Brain" -ForegroundColor Green
