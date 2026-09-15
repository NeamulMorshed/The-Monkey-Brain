<#
.SYNOPSIS
  Scaffold a Monkey Brain instance (.brain/) into a project, or refresh an existing one's schema.

.DESCRIPTION
  A thin wrapper over the plugin's own scaffold script (plugin/skills/init/scripts/new-brain.js),
  so the bootstrap and /brain:init can never drift apart (v0.33.0). Needs Node.js >= 18.

  -Update refreshes CLAUDE.md, reference.md and templates/ and keeps the display name; it never
  touches your wiki/, raw-sources/, or memory/.

.PARAMETER Project
  Path to the target project root. The brain is created at <Project>/.brain.
.PARAMETER Name
  Display name for the brain (defaults to the project folder's name; -Update keeps the current one).
.PARAMETER Update
  Refresh schema files in an existing .brain without overwriting accumulated knowledge.
.PARAMETER Force
  Overwrite an existing .brain entirely (knowledge included). Use with care.

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
$engineRoot = Split-Path -Parent $PSScriptRoot
$script = Join-Path $engineRoot 'plugin\skills\init\scripts\new-brain.js'
if (-not (Test-Path $script)) { throw "Scaffold script not found at $script. Run from the engine repo." }
$nodeArgs = @($script, '--project', $Project)
if ($Name -and $Name.Trim() -ne '') { $nodeArgs += @('--name', $Name) }
if ($Update) { $nodeArgs += '--update' }
if ($Force)  { $nodeArgs += '--force' }
& node @nodeArgs
exit $LASTEXITCODE
