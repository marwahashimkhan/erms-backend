<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function performance(Request $request)
    {
        $examId  = $request->query('exam_id');
        $classId = $request->query('class_id');

        $results = DB::table('results as r')
            ->join('students as s', 'r.student_id', '=', 's.id')
            ->where('r.exam_id', $examId)->where('s.class_id', $classId)
            ->select('r.*', 's.student_name')
            ->orderByDesc('r.total_pct')->get();

        if ($results->isEmpty()) return response()->json(['message' => 'No results'], 404);

        $total    = $results->count();
        $passed   = $results->where('is_pass', 1)->count();
        $avg      = round($results->avg('total_pct'), 1);
        $passRate = $total ? round($passed / $total * 100, 1) : 0;

        $gradeDist = $results->groupBy('grade')->map->count();
        $top3      = $results->take(3)->values();

        $scheds = DB::table('exam_schedules as es')
            ->join('class_subjects as cs', 'es.cs_id', '=', 'cs.id')
            ->join('subjects as sub', 'cs.subject_id', '=', 'sub.id')
            ->where('es.exam_id', $examId)->where('cs.class_id', $classId)
            ->select('es.id as schedule_id', 'sub.subject_name')->get();

        $subjectAvgs = [];
        foreach ($scheds as $sched) {
            $avg2 = DB::table('marks_entries')->where('schedule_id', $sched->schedule_id)->avg('marks_obtained');
            $subjectAvgs[$sched->subject_name] = round((float)$avg2, 1);
        }

        return response()->json([
            'total' => $total, 'passed' => $passed, 'failed' => $total - $passed,
            'avg_percentage' => $avg, 'pass_rate' => $passRate,
            'grade_distribution' => $gradeDist, 'subject_averages' => $subjectAvgs,
            'top3' => $top3,
        ]);
    }

    public function export(Request $request)
    {
        $examId  = $request->query('exam_id');
        $classId = $request->query('class_id');
        $results = DB::table('results as r')
            ->join('students as s', 'r.student_id', '=', 's.id')
            ->join('grade_letters as gl', 'r.grade', '=', 'gl.letter')
            ->where('r.exam_id', $examId)->where('s.class_id', $classId)
            ->orderBy('r.class_rank')
            ->select('s.roll_number', 's.student_name', 'r.total_marks', 'r.total_pct', 'r.grade', 'gl.grade_point', 'r.class_rank', 'r.is_pass')
            ->get();

        $csv = "Roll No,Student Name,Total Marks,Percentage,Grade,GPA,Rank,Status\n";
        foreach ($results as $r) {
            $csv .= "\"{$r->roll_number}\",\"{$r->student_name}\",{$r->total_marks},{$r->total_pct}%,{$r->grade},{$r->grade_point},#{$r->class_rank}," . ($r->is_pass ? 'Pass' : 'Fail') . "\n";
        }
        return response($csv, 200, ['Content-Type' => 'text/csv', 'Content-Disposition' => 'attachment; filename="results.csv"']);
    }
}
