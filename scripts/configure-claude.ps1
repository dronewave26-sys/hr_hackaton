$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$env:__VERCEL_NATIVE_DOWNLOAD = '0'
$statusPath = Join-Path (Get-Location) '.data/claude-setup-status.json'
[System.IO.Directory]::CreateDirectory((Split-Path -Parent $statusPath)) | Out-Null
function Set-SetupStatus($status) {
    [System.IO.File]::WriteAllText($statusPath, (@{status=$status; updatedAt=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json), [System.Text.UTF8Encoding]::new($false))
}
Set-SetupStatus 'waiting-for-input'
Write-Host 'SkillProof - Claude qurasdirilmasi'
Write-Host 'Acar gizli yazilacaq. Acar ve modeli chata gonderme.'
$secretInput = Read-Host 'Anthropic API acarini daxil et' -AsSecureString
$secretPointer = [IntPtr]::Zero
try {
    $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretInput)
    $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer).Trim()
    while (-not $apiKey.StartsWith('sk-ant-')) {
        Write-Host 'Anthropic API acari sk-ant- ile baslamalidir. Console-dan acarin ozunu kopyala (dirnaq isaresi olmadan).' -ForegroundColor Yellow
        if ($secretPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer); $secretPointer = [IntPtr]::Zero }
        $secretInput = Read-Host 'API acari' -AsSecureString
        $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretInput)
        $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer).Trim()
    }
    $model = (Read-Host 'Claude model ID daxil et (Console-da hesabina aciq olan model)').Trim()
    while ($model -notmatch '^[a-zA-Z0-9._:/-]+$') { $model = (Read-Host 'Bosluqsuz Claude model ID daxil et').Trim() }
    $localPath = Join-Path (Get-Location) '.env.local'
    $lines = @()
    if (Test-Path $localPath) { $lines = @([System.IO.File]::ReadAllLines($localPath) | Where-Object { $_ -notmatch '^ANTHROPIC_(API_KEY|MODEL)=' }) }
    $lines += 'ANTHROPIC_API_KEY=' + ($apiKey | ConvertTo-Json -Compress)
    $lines += 'ANTHROPIC_MODEL=' + ($model | ConvertTo-Json -Compress)
    [System.IO.File]::WriteAllLines($localPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Set-SetupStatus 'local-saved'
    Write-Host 'Lokal fayl saxlandi. Vercel-e gonderilir...'
    $vercelCommand = Join-Path $env:APPDATA 'npm/vercel.cmd'
    if (-not (Test-Path $vercelCommand)) { throw 'Vercel CLI missing' }
    foreach ($target in @('production,preview','development')) {
        $keyType = if ($target -eq 'development') { 'config' } else { 'secret' }
        $ErrorActionPreference = 'Continue'
        $apiKey | & $vercelCommand env add ANTHROPIC_API_KEY --environment $target --scope 4625 --project hr-hackaton --yes --force --type $keyType *> $null
        $ErrorActionPreference = 'Stop'
        if ($LASTEXITCODE -ne 0) { throw 'Vercel key update failed' }
        $ErrorActionPreference = 'Continue'
        $model | & $vercelCommand env add ANTHROPIC_MODEL --environment $target --scope 4625 --project hr-hackaton --yes --force --type config *> $null
        $ErrorActionPreference = 'Stop'
        if ($LASTEXITCODE -ne 0) { throw 'Vercel model update failed' }
    }
    Set-SetupStatus 'ready'
    Write-Host 'HAZIRDIR. Lokal ve Vercel ayarlari saxlandi. Chata hazirdir yaz.' -ForegroundColor Green
} catch {
    Set-SetupStatus 'failed'
    Write-Host 'Qurasdirilma tamamlanmadi. Acar/model formatini ve Vercel girisini yoxla. Sirrleri chata gonderme.' -ForegroundColor Yellow
} finally {
    if ($secretPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
    $apiKey = $null
    $secretInput = $null
}
