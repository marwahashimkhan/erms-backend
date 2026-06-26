<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResultController extends Controller
{
    public function index(Request $request)
    {
        $examId  = $request->query('exam_id');
        $classId = $request->query('class_id');

        $results = DB::table('results as r')
            ->join('students as s', 'r.student_id', '=', 's.id')
            ->join('grade_letters as gl', 'r.grade', '=', 'gl.letter')
            ->where('r.exam_id', $examId)
            ->where('s.class_id', $classId)
            ->select('r.*', 's.student_name', 's.roll_number', 'gl.grade_point')
            ->orderBy('r.class_rank')
            ->get();

        return response()->json($results);
    }

    public function compute(Request $request, $examId)
    {
        $this->computeForExam($examId);
        return response()->json(['message' => 'Results computed']);
    }

    public function computeForExam($examId)
    {
        $exam = DB::table('exams')->find($examId);
        if (!$exam) return;
        $ay = DB::table('academic_years')->find($exam->year_id);

        $schedules = DB::table('exam_schedules as es')
            ->join('class_subjects as cs', 'es.cs_id', '=', 'cs.id')
            ->where('es.exam_id', $examId)
            ->select('es.id as schedule_id', 'cs.class_id', 'cs.max_marks', 'cs.min_pass_marks')
            ->get();
        $classIds = $schedules->pluck('class_id')->unique();

        foreach ($classIds as $classId) {
            $classScheds = $schedules->where('class_id', $classId);
            $students    = DB::table('students')->where('class_id', $classId)->get();
            $class       = DB::table('classes')->find($classId);
            $gradeScales = DB::table('grade_scales')->where('year_id', $ay->id)->get();

            $computed = [];
            foreach ($students as $stu) {
                $total = 0; $maxTotal = 0; $subFail = false;
                foreach ($classScheds as $sched) {
                    $entry = DB::table('marks_entries')
                        ->where('schedule_id', $sched->schedule_id)
                        ->where('student_id', $stu->id)
                        ->first();
                    $marks = $entry ? (float)$entry->marks_obtained : 0;
                    $abs   = $entry ? (bool)$entry->is_absent : true;
                    $total    += $marks;
                    $maxTotal += $sched->max_marks;
                    if ($abs || $marks < $sched->min_pass_marks) $subFail = true;
                }
                $pct   = $maxTotal > 0 ? round($total / $maxTotal * 100, 2) : 0;
                $scale = $gradeScales->first(fn($g) => $pct >= $g->min_pct && $pct <= $g->max_pct);
                $grade = $scale?->letter_grade ?? 'F';
                $pass  = !$subFail && $pct >= $class->min_pass_pct;

                DB::table('results')->updateOrInsert(
                    ['exam_id' => $examId, 'student_id' => $stu->id],
                    ['total_marks' => $total, 'total_pct' => $pct, 'grade' => $grade, 'is_pass' => $pass ? 1 : 0, 'class_rank' => 0, 'computed_at' => now()]
                );
                $computed[] = ['student_id' => $stu->id, 'pct' => $pct];
            }

            usort($computed, fn($a, $b) => $b['pct'] <=> $a['pct']);
            $rank = 1;
            foreach ($computed as $i => $item) {
                if ($i > 0 && $item['pct'] < $computed[$i - 1]['pct']) $rank = $i + 1;
                DB::table('results')->where('exam_id', $examId)->where('student_id', $item['student_id'])->update(['class_rank' => $rank]);
            }
        }
    }

    public function card(Request $request)
    {
        $stuId  = $request->query('student_id');
        $examId = $request->query('exam_id');

        $result = DB::table('results as r')
            ->join('students as s', 'r.student_id', '=', 's.id')
            ->join('classes as c', 's.class_id', '=', 'c.id')
            ->join('exams as e', 'r.exam_id', '=', 'e.id')
            ->join('academic_years as ay', 'e.year_id', '=', 'ay.id')
            ->join('grade_letters as gl', 'r.grade', '=', 'gl.letter')
            ->where('r.student_id', $stuId)->where('r.exam_id', $examId)
            ->select('r.*', 's.student_name', 's.roll_number', 'c.class_name', 'c.section', 'e.title as exam_title', 'ay.label as year_label', 'gl.grade_point')
            ->first();

        if (!$result) return response()->json(['message' => 'Result not found'], 404);

        $school = DB::table('school')->first();
        $student = DB::table('students')->find($stuId);

        $schedules = DB::table('exam_schedules as es')
            ->join('class_subjects as cs', 'es.cs_id', '=', 'cs.id')
            ->join('subjects as sub', 'cs.subject_id', '=', 'sub.id')
            ->where('es.exam_id', $examId)
            ->where('cs.class_id', $student->class_id)
            ->select('es.id as schedule_id', 'sub.subject_name', 'cs.max_marks', 'cs.min_pass_marks')
            ->get();

        $exam = DB::table('exams')->find($examId);
        $gradeScales = DB::table('grade_scales')->where('year_id', $exam->year_id)->get();

        $subjectData = [];
        foreach ($schedules as $sched) {
            $entry = DB::table('marks_entries')->where('schedule_id', $sched->schedule_id)->where('student_id', $stuId)->first();
            $marks = $entry ? (float)$entry->marks_obtained : 0;
            $abs   = $entry ? (bool)$entry->is_absent : false;
            $pct   = $sched->max_marks > 0 ? round($marks / $sched->max_marks * 100, 1) : 0;
            $scale = $gradeScales->first(fn($g) => $pct >= $g->min_pct && $pct <= $g->max_pct);
            $subjectData[] = [
                'subject_name'   => $sched->subject_name,
                'max_marks'      => $sched->max_marks,
                'marks_obtained' => $marks,
                'pct'            => $pct,
                'grade'          => $scale?->letter_grade ?? 'F',
                'is_absent'      => $abs,
            ];
        }

        return response()->json([
            'student_name' => $result->student_name,
            'roll_number'  => $result->roll_number,
            'class_name'   => $result->class_name,
            'section'      => $result->section,
            'exam_title'   => $result->exam_title,
            'year_label'   => $result->year_label,
            'school_name'  => $school?->name ?? 'Beacon Public School',
            'total_marks'  => $result->total_marks,
            'total_pct'    => $result->total_pct,
            'grade'        => $result->grade,
            'grade_point'  => $result->grade_point,
            'is_pass'      => (bool)$result->is_pass,
            'class_rank'   => $result->class_rank,
            'subjects'     => $subjectData,
        ]);
    }
}
