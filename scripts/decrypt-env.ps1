param(
  [string]$ProtectedFile = "",
  [switch]$Help
)

if ($Help -or $ProtectedFile -eq "--help") {
  Write-Host @"
USAGE:
  .\scripts\decrypt-env.ps1                          <-- decrypts .env.protected and BACKEND\.env.protected
  .\scripts\decrypt-env.ps1 -ProtectedFile .env.protected  <-- decrypts specific file

Decrypts .env.protected files using Windows DPAPI.
Output: <original>.env (plaintext, readable)
The .env.protected file is kept (not deleted).
Only the same Windows user on this machine can decrypt.
"@
  exit 0
}

Add-Type -AssemblyName System.Security

function Decrypt-File {
  param([string]$InputPath)

  if (-not (Test-Path $InputPath)) {
    Write-Warning "Not found: $InputPath"
    return $false
  }

  $encryptedBytes = [System.IO.File]::ReadAllBytes($InputPath)
  $entropy = [System.Text.Encoding]::UTF8.GetBytes("fahad-ali-interior-v1")

  try {
    $plainBytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
      $encryptedBytes, $entropy,
      [System.Security.Cryptography.DataProtectionScope]::CurrentUser
    )

    $outputPath = $InputPath -replace '\.protected$', ''
    [System.IO.File]::WriteAllBytes($outputPath, $plainBytes)

    Write-Host "[OK] Decrypted: $InputPath -> $outputPath"
    return $true
  } catch {
    Write-Error "Decryption failed for $InputPath : $_"
    Write-Warning "Only the same Windows user who encrypted these files can decrypt them."
    return $false
  }
}

$targets = @()
if ($ProtectedFile) {
  $targets += $ProtectedFile
} else {
  $targets += Join-Path (Get-Location) ".env.protected"
  $targets += Join-Path (Join-Path (Get-Location) "BACKEND") ".env.protected"
}

$allOk = $true
foreach ($t in $targets) {
  if (-not (Decrypt-File $t)) { $allOk = $false }
}

if ($allOk) { Write-Host "`n.env files restored. Remember to re-encrypt after editing: 'scripts/encrypt-env.ps1'" }
