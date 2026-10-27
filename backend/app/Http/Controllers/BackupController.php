<?php

namespace App\Http\Controllers;

use App\Models\Backup;
use App\Services\BackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use ZipArchive;
use Illuminate\Support\Facades\Storage;

class BackupController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Backup::latest()->get()
        ]);
    }

    public function store(BackupService $backupService)
    {
        $backup = $backupService->create();

        return response()->json([
            'message' => 'Backup created successfully.',
            'data' => $backup
        ]);
    }

public function download($id)
{
    $backup = Backup::findOrFail($id);

    $path = app_path('backup/' . $backup->filename);

    if (!File::exists($path)) {
        abort(404, 'Backup file not found.');
    }

    return response()->download(
        $path,
        $backup->filename
    );
}

public function destroy($id)
{
    $backup = Backup::findOrFail($id);

    $path = app_path('backup') . DIRECTORY_SEPARATOR . $backup->filename;

    if (File::exists($path)) {
        File::delete($path);
    }

    $backup->delete();

    return response()->json([
        'message' => 'Backup deleted successfully.'
    ]);
}


public function restore(Request $request)
{
    try {

        $request->validate([
            'backup' => 'required|file|mimes:zip',
        ]);

        $restoreFolder = app_path('backup/restore_temp');

        if (File::exists($restoreFolder)) {
            File::deleteDirectory($restoreFolder);
        }

        File::makeDirectory($restoreFolder, 0755, true, true);

        $zip = new ZipArchive();

        $result = $zip->open($request->file('backup')->getRealPath());

        if ($result !== true) {
            return response()->json([
                'message' => 'Unable to open zip.',
                'code' => $result,
            ],500);
        }

        if (!$zip->extractTo($restoreFolder)) {

            return response()->json([
                'message' => 'Zip extract failed.'
            ],500);

        }

        $zip->close();

        return response()->json([
            'message' => 'Backup restored successfully.',
        ]);

    } catch (\Throwable $e) {

        return response()->json([
            'message' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile(),
        ],500);

    }
}
}
