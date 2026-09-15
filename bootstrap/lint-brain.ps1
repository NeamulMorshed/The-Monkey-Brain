<#
.SYNOPSIS
  Health-check a Monkey Brain's wiki: broken [[wikilinks]], orphan pages, frontmatter, index drift, stray files.

.DESCRIPTION
  A thin wrapper over the plugin's own mechanical lint (plugin/skills/lint/scripts/lint.js), so this
  script and /brain:lint always agree (v0.33.0). Needs Node.js >= 18.

.PARAMETER Brain
  Path to a brain root (the folder containing wiki/). Defaults to .\.brain, else the current
  directory when it contains a wiki/ folder.
.PARAMETER Strict
  Exit 1 when any issue is found (for CI).

.EXAMPLE
  .\lint-brain.ps1 -Brain "C:\code\myproduct\.brain"
#>
[CmdletBinding()]
param([string] $Brain, [switch] $Strict)

$ErrorActionPreference = 'Stop'
$engineRoot = Split-Path -Parent $PSScriptRoot
$script = Join-Path $engineRoot 'plugin\skills\lint\scripts\lint.js'
if (-not $Brain) {
  if (Test-Path '.\.brain\wiki') { $Brain = '.\.brain' }
  elseif (Test-Path '.\wiki')    { $Brain = '.' }
  else { throw "No brain found. Pass -Brain <path> (folder containing wiki/)." }
}
$nodeArgs = @($script, '--brain', (Resolve-Path $Brain).Path)
if ($Strict) { $nodeArgs += '--strict' }
& node @nodeArgs
exit $LASTEXITCODE
