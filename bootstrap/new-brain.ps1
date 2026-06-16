<#
.SYNOPSIS
  Scaffold a Monkey Brain instance (.brain/) into a project, or refresh an existing one's schema.

.DESCRIPTION
  Copies the engine's schema/brain-template into <Project>/.brain, substituting {{PROJECT}} and
  {{DATE}} placeholders. Knowledge (wiki/, raw-sources/, memory/) is per-project and isolated.

  -Update refreshes only CLAUDE.md and templates/ from the engine; it never touches your wiki/,
  raw-sources/, or memory/.

.PARAMETER Project
  Path to the target project root. The brain is created at <Project>/.brain.

.PARAMETER Name
  Display name for the brain (defaults to the project folder's name).

.PARAMETER Update
  Refresh schema files in an existing .brain without overwriting accumulated knowledge.

.PARAMETER Force
  Overwrite an existing .brain entirely (knowledge included). Use with care.

.EXAMPLE
  .\new-brain.ps1 -Project "C:\code\myproduct"
.EXAMPLE
  .\new-brain.ps1 -Project "C:\code\myproduct" -Name "MyProduct"
.EXAMPLE
  .\new-brain.ps1 -Project "C:\code\myproduct" -Update
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string] $Project,
  [string] $Name,
  [switch] $Update,
  [switch] $Force
)

$ErrorActionPreference = 'Stop'
$engineRoot = Split-Path -Parent $PSScriptRoot          # ...\The-Monkey-Brain
$template   = Join-Path $engineRoot 'schema\brain-template'

if (-not (Test-Path $template)) { throw "Template not found at $template. Run from the engine repo." }
if (-not (Test-Path $Project))  { throw "Project path does not exist: $Project" }

$Project = (Resolve-Path $Project).Path
$brain   = Join-Path $Project '.brain'
if (-not $Name -or $Name.Trim() -eq '') { $Name = Split-Path $Project -Leaf }
$today = (Get-Date).ToString('yyyy-MM-dd')

function Expand-Placeholders([string]$path, [string]$name, [string]$date) {
  # Read and write as UTF-8 (no BOM) explicitly so multibyte chars (em-dashes, emoji) survive
  # the round-trip. Get-Content -Raw can mis-decode, so use .NET I/O on both ends.
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  $text = [System.IO.File]::ReadAllText($path, $utf8)
  $text = $text.Replace('{{PROJECT}}', $name).Replace('{{DATE}}', $date)
  [System.IO.File]::WriteAllText($path, $text, $utf8)
}

# ---- Update mode: refresh schema only -------------------------------------------------
if ($Update) {
  if (-not (Test-Path $brain)) { throw "No .brain at $brain to update. Run without -Update to create it." }
  Write-Host "Refreshing schema in $brain (knowledge left untouched)..." -ForegroundColor Cyan
  Copy-Item (Join-Path $template 'CLAUDE.md')   (Join-Path $brain 'CLAUDE.md')   -Force
  Copy-Item (Join-Path $template 'templates\*') (Join-Path $brain 'templates')   -Recurse -Force
  Expand-Placeholders (Join-Path $brain 'CLAUDE.md') $Name $today
  Write-Host "Done. CLAUDE.md + templates/ refreshed for '$Name'." -ForegroundColor Green
  return
}

# ---- Create mode ----------------------------------------------------------------------
if (Test-Path $brain) {
  if ($Force) {
    Write-Host "Removing existing .brain (-Force)..." -ForegroundColor Yellow
    Remove-Item $brain -Recurse -Force
  } else {
    throw ".brain already exists at $brain. Use -Update to refresh schema, or -Force to recreate."
  }
}

Write-Host "Scaffolding Monkey Brain '$Name' into $brain ..." -ForegroundColor Cyan
Copy-Item $template $brain -Recurse -Force

# Substitute placeholders in every text file
Get-ChildItem $brain -Recurse -File -Include *.md | ForEach-Object {
  Expand-Placeholders $_.FullName $Name $today
}

$pageCount = (Get-ChildItem (Join-Path $brain 'wiki') -Recurse -Filter *.md).Count
Write-Host ""
Write-Host "Created .brain for '$Name'  ($pageCount seed pages)" -ForegroundColor Green
Write-Host "Next:" -ForegroundColor Green
Write-Host "  1. cd `"$Project`"; claude        # .brain\CLAUDE.md loads automatically"
Write-Host "  2. Drop a doc in .brain\raw-sources\ (or Web-Clip into .brain\Clippings\, or paste in chat), say 'ingest this'"
Write-Host "  3. Open .brain\ as an Obsidian vault to browse the graph"
Write-Host ""
Write-Host "Note: when you launch claude from the project root, confirm the brain's CLAUDE.md"
Write-Host "loaded with /memory. If it didn't, run claude from inside .brain\, or add"
Write-Host "'@.brain/CLAUDE.md' to a root CLAUDE.md so it always loads." -ForegroundColor DarkGray
