<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditController extends Controller
{
    public function log(Request $request)
    {
        $entryId = $request->query('entry_id');
        $logs = DB::table('audit_logs as al')
            ->join('staff as s', 'al.staff_id', '=', 's.id')
            ->where('al.entry_id', $entryId)
            ->select('al.*', 's.name as staff_name')
            ->orderByDesc('al.changed_at')->get();
        return response()->json($logs);
    }
}
