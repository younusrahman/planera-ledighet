$file = "src\components\forms\DatabaseMaintenanceForm.tsx"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Replace loading state with mutation isPending  
$content = $content -replace 'disabled=\{loading\}', 'disabled={backupMutation.isPending || resetMutation.isPending || restoreMutation.isPending || deleteBackupMutation.isPending || uploadMutation.isPending}'

# Replace backup button
$content = $content -replace 'onClick=\{\(\) =>\s+executeAction\(databaseService\.backup, "Ny backup skapad"\)\s+\}', 'onClick={() => executeAction(async () => { await backupMutation.mutateAsync(); return true; }, "Ny backup skapad")}'

# Replace reset button
$content = $content -replace 'executeAction\(databaseService\.reset, "Systemet nollställt"\)', 'executeAction(async () => { await resetMutation.mutateAsync(); return true; }, "Systemet nollställt")'

# Replace restore functionality
$content = $content -replace 'executeAction\(databaseService\.restore\(manualPath\), "Databasen återställd från', 'executeAction(async () => { await restoreMutation.mutateAsync(manualPath); return true; }, "Databasen återställd från'

# Replace delete backup calls
$content = $content -replace 'onClick=\{\(\) => {[\s\S]*?executeAction\(databaseService\.deleteBackup\(backup\)',  'onClick={() => executeAction(async () => { await deleteBackupMutation.mutateAsync(backup); return true; }'

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "✅ Updated DatabaseMaintenanceForm to use TanStack mutations"
