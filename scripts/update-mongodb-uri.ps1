# Script to update MongoDB URI and DB_NAME in all API files
$oldUri = "mongodb://restorenUser:1234@localhost:27017/restoren"
$newUri = "mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin"
$oldDbName = "restoren"
$newDbName = "restaurant"

# Get all TypeScript files in app/api directory
$files = Get-ChildItem -Path "app\api" -Recurse -Filter "*.ts" -File

$updatedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace MONGO_URI
    $content = $content -replace [regex]::Escape($oldUri), $newUri
    
    # Replace DB_NAME
    $content = $content -replace "const DB_NAME = ['`"]$oldDbName['`"]", "const DB_NAME = '$newDbName'"
    $content = $content -replace "const DB_NAME = [`"']$oldDbName[`"']", "const DB_NAME = `"$newDbName`""
    
    # Replace db.db('restoren')
    $content = $content -replace "db\.db\(['`"]$oldDbName['`"]\)", "db.db('$newDbName')"
    $content = $content -replace "db\.db\([`"']$oldDbName[`"']\)", "db.db(`"$newDbName`")"
    
    # Replace client.db('restoren')
    $content = $content -replace "client\.db\(['`"]$oldDbName['`"]\)", "client.db('$newDbName')"
    $content = $content -replace "client\.db\([`"']$oldDbName[`"']\)", "client.db(`"$newDbName`")"
    
    # Replace mongoClient.db('restoren')
    $content = $content -replace "mongoClient\.db\(['`"]$oldDbName['`"]\)", "mongoClient.db('$newDbName')"
    $content = $content -replace "mongoClient\.db\([`"']$oldDbName[`"']\)", "mongoClient.db(`"$newDbName`")"
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $updatedCount++
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nTotal files updated: $updatedCount"

