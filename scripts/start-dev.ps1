# PowerShell script to start dev server properly
Write-Host "`n🚀 شروع سرور توسعه...`n" -ForegroundColor Green

# Stop any existing Node processes
Write-Host "⏹️  متوقف کردن processهای قبلی..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Remove .next folder
Write-Host "🗑️  حذف cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Start dev server
Write-Host "`n✅ شروع سرور...`n" -ForegroundColor Green
Write-Host "📋 لینک‌ها:" -ForegroundColor Cyan
Write-Host "   - صفحه سفارش: http://localhost:3000/order" -ForegroundColor White
Write-Host "   - صفحه اصلی: http://localhost:3000/" -ForegroundColor White
Write-Host "   - صفحه ورود: http://localhost:3000/login`n" -ForegroundColor White
Write-Host "💡 بعد از 'Ready' شدن، چند ثانیه صبر کنید تا build کامل شود`n" -ForegroundColor Yellow

npm run dev

