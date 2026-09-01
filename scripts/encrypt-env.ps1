param(
  [string]$EnvFile = "",
  [switch]$Help
)

if ($Help -or $EnvFile -eq "--help") {
  Write-Host @"
USAGE:
  .\scripts\encrypt-env.ps1                     <-- encrypts .env and BACKEND\.env
  .\scripts\encrypt-env.ps1 -EnvFile .env        <-- encrypts specific file

Encrypts .env files using Windows DPAPI.
Output: <original>.env.protected
The plaintext .env is REMOVED after encryption.
Only the same Windows user on this machine can decrypt.
"@
  exit 0
}

Add-Type -AssemblyName System.Security

function Encrypt-File {
  param([string]$InputPath)

  if (-not (Test-Path $InputPath)) {
    Write-Warning "Not found: $InputPath"
    return $false
  }

  $plainBytes = [System.IO.File]::ReadAllBytes($InputPath)
  $entropy = [System.Text.Encoding]::UTF8.GetBytes("fahad-ali-interior-v1")

  try {
    $encryptedBytes = [System.Security.Cryptography.ProtectedData]::Protect(
      $plainBytes, $entropy,
      [System.Security.Cryptography.DataProtectionScope]::CurrentUser
    )

    $outputPath = "$InputPath.protected"
    [System.IO.File]::WriteAllBytes($outputPath, $encryptedBytes)

    # Securely overwrite plaintext before deleting
    $fileInfo = Get-Item $InputPath
    $length = $fileInfo.Length
    $stream = [System.IO.File]::Open($InputPath, [System.IO.FileMode]::Open)
    $zeroBytes = New-Object byte[] $length
    $stream.Write($zeroBytes, 0, [Math]::Min($length, 65536))
    $stream.Flush()
    $stream.Close()
    Remove-Item $InputPath -Force

    Write-Host "[OK] Encrypted: $InputPath -> $outputPath (plaintext wiped)"
    return $true
  } catch {
    Write-Error "Encryption failed for $InputPath : $_"
    return $false
  }
}

$targets = @()
if ($EnvFile) {
  $targets += $EnvFile
} else {
  $targets += Join-Path (Get-Location) ".env"
  $targets += Join-Path (Join-Path (Get-Location) "BACKEND") ".env"
}

$allOk = $true
foreach ($t in $targets) {
  if (-not (Encrypt-File $t)) { $allOk = $false }
}

if ($allOk) { Write-Host "`nAll .env files encrypted. Run 'scripts/decrypt-env.ps1' to restore." }
