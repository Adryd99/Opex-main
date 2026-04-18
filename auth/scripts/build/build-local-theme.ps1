param(
    [string]$MavenVersion = "3.9.14",
    [int]$KeycloakMajorVersion = 26,
    [switch]$RestartKeycloak
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\\..\\..")).Path
$keycloakifyDir = Join-Path $repoRoot "auth\\keycloakify"
$themesDir = Join-Path $repoRoot "auth\\themes"
$distKeycloakDir = Join-Path $keycloakifyDir "dist_keycloak"
$targetJarPath = Join-Path $themesDir "keycloak-theme-opex.jar"
$libDir = Join-Path (Split-Path -Parent $PSScriptRoot) "lib"
. (Join-Path $libDir "KeycloakContainer.ps1")

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Remove-PathIfExists {
    param(
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        return
    }

    Remove-Item -LiteralPath $Path -Recurse -Force
}

function Ensure-MavenAvailable {
    param(
        [string]$ProjectDir,
        [string]$Version
    )

    $mavenCommand = Get-Command mvn -ErrorAction SilentlyContinue
    if ($null -ne $mavenCommand) {
        return
    }

    $toolsDir = Join-Path $ProjectDir ".tools"
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

function Install-ThemeDependencies {
    param(
        [string]$ProjectDir
    )

    $yarnLockPath = Join-Path $ProjectDir "yarn.lock"
    $packageLockPath = Join-Path $ProjectDir "package-lock.json"

    if (Test-Path $yarnLockPath) {
        $yarnCommand = Get-Command yarn -ErrorAction SilentlyContinue
        if ($null -ne $yarnCommand) {
            yarn install --frozen-lockfile
            return
        }

        $corepackCommand = Get-Command corepack -ErrorAction SilentlyContinue
        if ($null -ne $corepackCommand) {
            corepack yarn install --frozen-lockfile
            return
        }

        throw "A yarn.lock file is present but neither 'yarn' nor 'corepack' is available."
    }

    if (Test-Path $packageLockPath) {
        npm ci
        return
    }

    npm install --no-package-lock
}

function Clear-ThemeBuildArtifacts {
    param(
        [string]$ProjectDir
    )

    Remove-PathIfExists -Path (Join-Path $ProjectDir "dist")
    Remove-PathIfExists -Path (Join-Path $ProjectDir "dist_keycloak")
}

function Select-ThemeJar {
    param(
        [System.IO.FileInfo[]]$JarFiles,
        [int]$TargetKeycloakMajorVersion
    )

    foreach ($jar in $JarFiles) {
        if ($jar.Name -match 'kc-(\d+)-to-(\d+)') {
            $minVersion = [int]$Matches[1]
            $maxVersion = [int]$Matches[2]

            if ($TargetKeycloakMajorVersion -ge $minVersion -and $TargetKeycloakMajorVersion -le $maxVersion) {
                return $jar
            }
        }
    }

    $fallbackJar = $JarFiles | Where-Object { $_.Name -match 'all-other-versions' } | Select-Object -First 1
    if ($null -ne $fallbackJar) {
        return $fallbackJar
    }

    return $JarFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

Ensure-Directory -Path $themesDir
Ensure-MavenAvailable -ProjectDir $keycloakifyDir -Version $MavenVersion

Push-Location $keycloakifyDir
try {
    if (-not (Test-Path (Join-Path $keycloakifyDir "node_modules"))) {
        Write-Host "Installing theme dependencies..." -ForegroundColor Cyan
        Install-ThemeDependencies -ProjectDir $keycloakifyDir
        if ($LASTEXITCODE -ne 0) {
            throw "Dependency installation failed"
        }
    }

    Clear-ThemeBuildArtifacts -ProjectDir $keycloakifyDir

    Write-Host "Building Keycloak theme..." -ForegroundColor Cyan
    npm run build-keycloak-theme
    if ($LASTEXITCODE -ne 0) {
        throw "Theme build failed"
    }
}
finally {
    Pop-Location
}

$jarFiles = Get-ChildItem -Path $distKeycloakDir -Filter *.jar -File

if ($null -eq $jarFiles -or $jarFiles.Count -eq 0) {
    throw "No jar file found in $distKeycloakDir"
}

$builtJar = Select-ThemeJar -JarFiles $jarFiles -TargetKeycloakMajorVersion $KeycloakMajorVersion

if ($null -eq $builtJar) {
    throw "No jar file found in $distKeycloakDir"
}

Copy-Item -Path $builtJar.FullName -Destination $targetJarPath -Force
Write-Host "Updated theme jar: $targetJarPath" -ForegroundColor Green

if ($RestartKeycloak) {
    Write-Host "Restarting local Keycloak container to reload the updated theme jar..." -ForegroundColor Cyan
    Restart-KeycloakComposeService -ContainerName "keycloak" -ComposeServiceName "keycloak"
}
