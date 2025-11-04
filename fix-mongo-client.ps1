# Script to fix MongoDB client initialization issues in add-sample-* routes
$files = Get-ChildItem -Path "app\api\add-sample-*" -Recurse -Filter "route.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file has the problematic pattern
    if ($content -match 'let client: MongoClient\s+let clientPromise: Promise<MongoClient>\s+if \(!client\)') {
        Write-Host "Fixing: $($file.FullName)"
        
        # Replace the problematic pattern
        $content = $content -replace 'let client: MongoClient', 'let client: MongoClient | undefined'
        $content = $content -replace 'let clientPromise: Promise<MongoClient>', 'let clientPromise: Promise<MongoClient> | undefined'
        $content = $content -replace 'if \(!client\) \{', 'if (!clientPromise) {'
        
        # Fix the function body
        if ($content -match 'const client = await clientPromise') {
            $content = $content -replace '(export async function POST\(request: NextRequest\) \{[\s\S]*?try \{[\s\S]*?)(const client = await clientPromise)', @"
`$1if (!clientPromise) {
      client = new MongoClient(MONGO_URI)
      clientPromise = client.connect()
    }
    const dbClient = await clientPromise
"@
            $content = $content -replace 'const client = await clientPromise', 'const dbClient = await clientPromise'
            $content = $content -replace 'const db = client\.db\(', 'const db = dbClient.db('
        }
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
    }
}

Write-Host "Done!"

