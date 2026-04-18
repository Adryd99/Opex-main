param(
    [string]$MavenVersion = "3.9.14",
    [switch]$RestartKeycloak
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\\..\\..")).Path
$moduleDir = Join-Path $repoRoot "auth\\extensions\\keycloak-onboarding-actions"
$themesDir = Join-Path $repoRoot "auth\\themes"
$targetJarPath = Join-Path $themesDir "keycloak-onboarding-actions.jar"
$libDir = Join-Path (Split-Path -Parent $PSScriptRoot) "lib"
. (Join-Path $libDir "KeycloakContainer.ps1")

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Ensure-MavenAvailable {
    param(
        [string]$RepoRoot,
        [string]$Version
    )

    $mavenCommand = Get-Command mvn -ErrorAction SilentlyContinue
    if ($null -ne $mavenCommand) {
        return
    }

    $toolsDir = Join-Path $RepoRoot "auth\\keycloakify\\.tools"
    $mavenHome = Join-Path $toolsDir "apache-maven-$Version"
    $mavenBin = Join-Path $mavenHome "bin"
    $mavenCmd = Join-Path $mavenBin "mvn.cmd"

    if (-not (Test-Path $mavenCmd)) {
        Ensure-Directory -Path $toolsDir

        $archiveName = "apache-maven-$Version-bin.zip"
        $archivePath = Join-Path $toolsDir $archiveName
        $archiveUrl = "https://archive.apache.org/dist/maven/maven-3/$Version/binaries/$archiveName"

        Write-Host "Downloading Apache Maven $Version..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $archiveUrl -OutFile $archivePath

        if (Test-Path $mavenHome) {
            Remove-Item -Recurse -Force $mavenHome
        }

        Expand-Archive -LiteralPath $archivePath -DestinationPath $toolsDir -Force
    }

    $env:Path = "$mavenBin;$env:Path"
}

Ensure-Directory -Path $themesDir
Ensure-MavenAvailable -RepoRoot $repoRoot -Version $MavenVersion

Push-Location $moduleDir
try {
    Write-Host "Building onboarding provider jar..." -ForegroundColor Cyan
    mvn -q -DskipTests package
    if ($LASTEXITCODE -ne 0) {
        throw "Provider build failed"
    }
}
finally {
    Pop-Location
}

$builtJar = Get-ChildItem -Path (Join-Path $moduleDir "target") -Filter *.jar -File |
    Where-Object { $_.Name -notmatch 'sources|javadoc' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if ($null -eq $builtJar) {
    throw "No provider jar was produced in target"
}

Copy-Item -Path $builtJar.FullName -Destination $targetJarPath -Force
Write-Host "Updated provider jar: $targetJarPath" -ForegroundColor Green

if ($RestartKeycloak) {
    Write-Host "Restarting local Keycloak container to reload the updated provider jar..." -ForegroundColor Cyan
    Restart-KeycloakComposeService -ContainerName "keycloak" -ComposeServiceName "keycloak"
}
