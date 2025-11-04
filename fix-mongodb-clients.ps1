# Script to fix MongoDB client TypeScript errors
# This script finds all files with the problematic pattern and fixes them

$files = @(
    "app/api/menu-items/status/route.ts",
    "app/api/menu-items/[id]/route.ts",
    "app/api/menu-items/route.ts",
    "app/api/beverages/[id]/route.ts",
    "app/api/beverages/route.ts",
    "app/api/desserts/[id]/route.ts",
    "app/api/desserts/route.ts",
    "app/api/main-courses/[id]/route.ts",
    "app/api/main-courses/route.ts",
    "app/api/pending-orders/status/route.ts",
    "app/api/pending-orders/[id]/route.ts",
    "app/api/pending-orders/route.ts",
    "app/api/delivery-orders/status/route.ts",
    "app/api/takeaway-orders/status/route.ts",
    "app/api/dine-in-orders/status/route.ts"
)

Write-Host "Found $($files.Count) files to check"

