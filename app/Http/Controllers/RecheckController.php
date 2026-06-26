<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecheckController extends Controller
{
    public function index()
    {
        $reqs = DB::table('recheck_requests as rr')
            ->join('students as s', 'rr.student_id', '=', 's.id')
            ->join('marks_entries as me', 'rr.entry_id', '=', 'me.id')
            ->select('rr.*', 's.student_name', 'me.marks_obtained as original_marks')
            ->orderByDesc('rr.id')->get();
        return response()->json($reqs);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'reason'     => 'required|string',
        ]);
        $entry = DB::table('marks_entries')->where('student_id', $data['student_id'])->orderByDesc('id')->first();
        if (!$entry) return response()->json(['message' => 'No marks entry found for this student'], 422);

        $id = DB::table('recheck_requests')->insertGetId([
            'entry_id'     => $entry->id,
            'student_id'   => $data['student_id'],
            'reason'       => $data['reason'],
            'status'       => 'pending',
            'requested_at' => now(),
        ]);
        return response()->json(DB::table('recheck_requests')->find($id), 201);
    }

    public function resolve(Request $request, $id)
    {
        $data = $request->validate(['revised_marks' => 'required|numeric|min:0']);
        $req  = DB::table('recheck_requests')->find($id);
        if (!$req) return response()->json(['message' => 'Not found'], 404);

        $entry = DB::table('marks_entries')->find($req->entry_id);
        if ($entry && (float)$data['revised_marks'] !== (float)$entry->marks_obtained) {
            DB::table('audit_logs')->insert([
                'entry_id'      => $entry->id,
                'staff_id'      => $request->user()->id,
                'old_marks'     => $entry->marks_obtained,
                'new_marks'     => $data['revised_marks'],
                'change_reason' => "Recheck Request #{$id} resolved",
                'changed_at'    => now(),
            ]);
            DB::table('marks_entries')->where('id', $entry->id)->update(['marks_obtained' => $data['revised_marks']]);

            $sched = DB::table('exam_schedules')->find($entry->schedule_id);
            if ($sched) app(ResultController::class)->computeForExam($sched->exam_id);
        }
        DB::table('recheck_requests')->where('id', $id)->update([
            'status'        => 'resolved',
            'revised_marks' => $data['revised_marks'],
            'resolved_at'   => now(),
        ]);
        return response()->json(['message' => 'Resolved']);
    }
}
