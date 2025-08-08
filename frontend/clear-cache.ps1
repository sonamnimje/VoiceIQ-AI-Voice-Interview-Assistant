Write-Host "Clearing React cache files..." -ForegroundColor Green
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cache cleared successfully!" -ForegroundColor Green
Write-Host "Starting development server..." -ForegroundColor Yellow
npm start 