<?php

namespace App\Services;

use App\Models\Backup;
use Illuminate\Support\Facades\File;
use ZipArchive;

class BackupService
{
    public function create()
    {
        /*
        |--------------------------------------------------------------------------
        | Create Backup Folder
        |--------------------------------------------------------------------------
        */

$backupFolder = app_path('backup');

        if (!File::exists($backupFolder)) {
            File::makeDirectory($backupFolder, 0755, true);
        }

        /*
        |--------------------------------------------------------------------------
        | Backup File Name
        |--------------------------------------------------------------------------
        */

        $fileName = 'backup_' . now()->format('Y_m_d_H_i_s') . '.zip';

        $zipPath = $backupFolder . DIRECTORY_SEPARATOR . $fileName;

        /*
        |--------------------------------------------------------------------------
        | Create ZIP
        |--------------------------------------------------------------------------
        */

        $zip = new ZipArchive();

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \Exception("Unable to create backup.");
        }

        /*
        |--------------------------------------------------------------------------
        | SQLite Database
        |--------------------------------------------------------------------------
        */

        $sqlite = database_path('database.sqlite');

        if (File::exists($sqlite)) {
            $zip->addFile($sqlite, 'database/database.sqlite');
        }

        /*
        |--------------------------------------------------------------------------
        | Company Logo
        |--------------------------------------------------------------------------
        */

        $companyFolder = public_path('storage/company');

        if (File::exists($companyFolder)) {
            $this->addFolderToZip($companyFolder, $zip, 'company');
        }

        /*
        |--------------------------------------------------------------------------
        | Uploads
        |--------------------------------------------------------------------------
        */

        $uploads = storage_path('app/public');

        if (File::exists($uploads)) {
            $this->addFolderToZip($uploads, $zip, 'uploads');
        }

        /*
        |--------------------------------------------------------------------------
        | backup.json
        |--------------------------------------------------------------------------
        */

        $backupInfo = [

            'software' => 'Qadri Distributor ERP',

            'version' => '1.0.0',

            'database' => File::exists($sqlite)
                ? 'SQLite'
                : 'Unknown',

            'created_at' => now()->toDateTimeString(),

            'backup_type' => 'Manual',

        ];

        $zip->addFromString(
            'backup.json',
            json_encode($backupInfo, JSON_PRETTY_PRINT)
        );

        /*
        |--------------------------------------------------------------------------
        | Finish
        |--------------------------------------------------------------------------
        */

        $zip->close();

        /*
        |--------------------------------------------------------------------------
        | Save Backup Record
        |--------------------------------------------------------------------------
        */

        return Backup::create([

            'filename' => $fileName,

            // Relative path save karenge
            'file_path' => $fileName,

            'file_size' => filesize($zipPath),

            'backup_type' => 'manual',

            'status' => 'success',

        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Add Folder To ZIP
    |--------------------------------------------------------------------------
    */

    protected function addFolderToZip($folder, ZipArchive $zip, $zipFolder)
    {
        $files = File::allFiles($folder);

        foreach ($files as $file) {

            $relative = str_replace(
                $folder . DIRECTORY_SEPARATOR,
                '',
                $file->getRealPath()
            );

            $zip->addFile(
                $file->getRealPath(),
                $zipFolder . '/' . $relative
            );
        }
    }
}