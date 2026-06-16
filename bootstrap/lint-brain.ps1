<#
.SYNOPSIS
  Health-check a Monkey Brain's wiki: broken [[wikilinks]], orphan pages, page counts, stray files.

.PARAMETER Brain
  Path to a brain root (the folder containing wiki/ and raw-sources/). Defaults to:
    1. .\.brain if present, else
    2. the current directory if it contains a wiki/ folder.

.EXAMPLE
  .\lint-brain.ps1 -Brain "C:\code\myproduct\.brain"
.EXAMPLE
  .\lint-brain.ps1            # auto-detects .brain or a wiki/ in the cwd
#>
[CmdletBinding()]
param([string] $Brain)

$ErrorActionPreference = 'Stop'

if (-not $Brain) {
  if (Test-Path '.\.brain\wiki') { $Brain = (Resolve-Path '.\.brain').Path }
  elseif (Test-Path '.\wiki')    { $Brain = (Resolve-Path '.').Path }
  else { throw "No brain found. Pass -Brain <path> (folder containing wiki/)." }
}
$Brain = (Resolve-Path $Brain).Path
$wiki  = Join-Path $Brain 'wiki'
if (-not (Test-Path $wiki)) { throw "No wiki/ under $Brain" }

$scan = Get-ChildItem -Path $wiki -Recurse -Filter *.md
Write-Host "Brain: $Brain" -ForegroundColor Cyan
Write-Host "Total wiki pages: $($scan.Count)"
$scan | Group-Object { Split-Path $_.DirectoryName -Leaf } |
  Select-Object Name, Count | Format-Table -AutoSize | Out-String | Write-Host

# Build known link targets: basenames + folder-qualified paths + aliases
$known = New-Object System.Collections.Generic.HashSet[string]
foreach ($f in $scan) {
  [void]$known.Add($f.BaseName.ToLower())
  [void]$known.Add($f.FullName.Replace("$wiki\","").Replace("\","/").Replace(".md","").ToLower())
  $t = Get-Content $f.FullName -Raw
  if ($t -match '(?s)^---(.*?)---' -and $Matches[1] -match 'aliases:\s*\[(.*?)\]') {
    ($Matches[1] -split ',') | ForEach-Object {
      $a = $_.Trim().Trim('"').Trim("'").ToLower(); if ($a) { [void]$known.Add($a) }
    }
  }
}

# Broken links (code spans/fences excluded so literal [[examples]] don't count)
$broken = @{}
foreach ($f in $scan) {
  $t = Get-Content $f.FullName -Raw
  $t = [regex]::Replace($t, '(?s)```.*?```', '')
  $t = [regex]::Replace($t, '`[^`]*`', '')
  foreach ($m in [regex]::Matches($t, '\[\[([^\]]+)\]\]')) {
    $tg = (($m.Groups[1].Value -split '\|')[0] -split '#')[0].Trim().TrimEnd('\').ToLower()
    if ($tg -and -not $known.Contains($tg)) {
      if (-not $broken.ContainsKey($tg)) { $broken[$tg] = @() }
      $broken[$tg] += $f.Name
    }
  }
}
Write-Host "BROKEN LINKS:" -ForegroundColor Yellow
if ($broken.Count -eq 0) { Write-Host "  none" -ForegroundColor Green }
else { $broken.GetEnumerator() | Sort-Object Name | ForEach-Object {
  Write-Host ("  [[{0}]] <- {1}" -f $_.Key, (($_.Value | Select-Object -Unique) -join ', ')) -ForegroundColor Red } }

# Orphans (no inbound links); index/log/dashboard are roots
Write-Host "`nORPHANS:" -ForegroundColor Yellow
$roots = @('index','log','dashboard')
$orphans = @()
foreach ($f in $scan) {
  $slug = $f.BaseName.ToLower(); if ($slug -in $roots) { continue }
  $inbound = 0
  foreach ($g in $scan) {
    if ($g.FullName -eq $f.FullName) { continue }
    $gt = Get-Content $g.FullName -Raw
    if ($gt -match "\[\[$([regex]::Escape($f.BaseName))(\||\]|#)" -or
        $gt -match "\[\[$([regex]::Escape($slug))(\||\]|#)") { $inbound++; break }
  }
  if ($inbound -eq 0) { $orphans += $f.Name }
}
if ($orphans.Count -eq 0) { Write-Host "  none" -ForegroundColor Green }
else { Write-Host ("  " + ($orphans -join ', ')) -ForegroundColor Red }

# Stray root-level markdown (Obsidian sometimes materializes unresolved links as 0-byte files).
# README.md and the brain's CLAUDE.md are legitimate root files and are ignored.
Write-Host "`nROOT STRAY .md FILES (should be none):" -ForegroundColor Yellow
$stray = Get-ChildItem -Path $Brain -Filter *.md -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -notin @('README.md', 'CLAUDE.md') }
if ($stray) { $stray | ForEach-Object {
    $hint = if ($_.Length -eq 0) { ' — 0 bytes, likely an Obsidian artifact; delete it' } else { '' }
    Write-Host "  $($_.Name) ($($_.Length) bytes)$hint" -ForegroundColor Red } }
else { Write-Host "  none" -ForegroundColor Green }

$ok = ($broken.Count -eq 0 -and $orphans.Count -eq 0)
Write-Host ""
Write-Host ($(if ($ok) { "LINT CLEAN" } else { "LINT FOUND ISSUES (see above)" })) -ForegroundColor $(if ($ok) { 'Green' } else { 'Red' })
if (-not $ok) { exit 1 }
