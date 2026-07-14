param(
    [string]$EnvFile = ".env"
)

if (!(Test-Path $EnvFile)) {
    Write-Host ":x: Error: $EnvFile not found."
    exit 1
}

Write-Host "Updating environment file..."

Copy-Item $EnvFile backend/.env -Force
Copy-Item $EnvFile scripts/.env -Force
Copy-Item $EnvFile frontend/.env -Force


if (!(Test-Path scraper/.env) -and (Test-Path scraper/.env.example)) {
    Copy-Item scraper/.env.example scraper/.env
}


Write-Host "Generating frontend env files..."


$envContent = Get-Content $EnvFile

$backendDev = ($envContent | Select-String "^BACKEND_URL_DEV=").ToString().Split("=")[1]
$backendProd = ($envContent | Select-String "^BACKEND_URL_PROD=").ToString().Split("=")[1]


"NEXТ_PUBLIC_MESSAGING_API_URL=$backendDev" |
    Out-File frontend/.env.development -Encoding utf8


"NEXТ_PUBLIC_MESSAGING_API_URL=$backendProd" |
    Out-File frontend/.env.production -Encoding utf8


Write-Host ":white_check_mark: Environment files updated successfully."