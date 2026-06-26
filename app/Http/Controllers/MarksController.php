<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MarksController extends Controller
{
    public function sheet(Request $request)
    {
        $examId  = $request->query('exam_id');
        $classId = $request->query('class_id');

        $exam = DB::table('exams')->find($examId);
        if (!$exam) return response()->json(['message' => 'Exam not found'], 404);

        $class = DB::table('classes')->find($classId);

        $schedules = DB::table('exam_schedules as es')
            ->join('class_subjects as cs', 'es.cs_id', '=', 'cs.id')
            ->join('subjects as s', 'cs.subject_id', '=', 's.id')
            ->where('es.exam_id', $examId)
            ->where('cs.class_id', $classId)
            ->select('es.id as schedule_id', 's.subject_name', 's.subject_code', 'cs.max_marks', 'cs.min_pass_marks', 'cs.id as cs_id')
            ->get();

        $students = DB::table('students')->where('class_id', $classId)->orderBy('roll_number')->get();

        $scheduleIds = $schedules->pluck('schedule_id');
        $entries = DB::table('marks_entries')
            ->whereIn('schedule_id', $scheduleIds)
            ->get()
            ->keyBy(fn($e) => "{$e->schedule_id}_{$e->student_id}");

        $entriesList = [];
        foreach ($schedules as $sched) {
            foreach ($students as $stu) {
                $key   = "{$sched->schedule_id}_{$stu->id}";
                $entry = $entries->get($key);
                $entriesList[] = [
                    'schedule_id'    => $sched->schedule_id,
                    'student_id'     => $stu->id,
                    'marks_obtained' => $entry?->marks_obtained ?? '',
                    'is_absent'      => $entry?->is_absent ?? 0,
                ];
            }
        }

        return response()->json([
            'exam_title' => $exam->title,
            'class_name' => $class?->class_name,
            'section'    => $class?->section,
            'locked'     => $exam->status === 'published',
            'subjects'   => $schedules,
            'students'   => $students,
            'entries'    => $entriesList,
        ]);
    }

    public function save(Request $request)
    {
        $data = $request->validate([
            'schedule_id'    => 'required|exists:exam_schedules,id',
            'student_id'     => 'required|exists:students,id',
            'marks_obtained' => 'required|numeric|min:0',
            'is_absent'      => 'boolean',
        ]);

        $sched = DB::table('exam_schedules')->find($data['schedule_id']);
        $exam  = DB::table('exams')->find($sched->exam_id);
        if ($exam->status === 'published') return response()->json(['message' => 'Exam is published — use recheck workflow'], 422);

        $existing = DB::table('marks_entries')
            ->where('schedule_id', $data['schedule_id'])
            ->where('student_id', $data['student_id'])
            ->first();

        $staffId = $request->user()->id;

        if ($existing) {
            if ((float)$existing->marks_obtained !== (float)$data['marks_obtained']) {
                DB::table('audit_logs')->insert([
                    'entry_id'      => $existing->id,
                    'staff_id'      => $staffId,
                    'old_marks'     => $existing->marks_obtained,
                    'new_marks'     => $data['marks_obtained'],
                    'change_reason' => 'Manual correction via marks entry',
                    'changed_at'    => now(),
                ]);
            }
            DB::table('marks_entries')->where('id', $existing->id)->update([
                'marks_obtained' => $data['marks_obtained'],
                'is_absent'      => $data['is_absent'] ?? 0,
                'staff_id'       => $staffId,
            ]);
        } else {
            DB::table('marks_entries')->insert([
                'schedule_id'    => $data['schedule_id'],
                'student_id'     => $data['student_id'],
                'staff_id'       => $staffId,
                'marks_obtained' => $data['marks_obtained'],
                'is_absent'      => $data['is_absent'] ?? 0,
                'entered_at'     => now(),
            ]);
        }

        return response()->json(['message' => 'Saved']);
    }

    public function saveBulk(Request $request)
    {
        $request->validate(['entries' => 'required|array']);
        $staffId = $request->user()->id;

        foreach ($request->entries as $row) {
            $sched = DB::table('exam_schedules')->find($row['schedule_id'] ?? 0);
            if (!$sched) continue;
            $exam = DB::table('exams')->find($sched->exam_id);
            if (!$exam || $exam->status === 'published') continue;

            $existing = DB::table('marks_entries')
                ->where('schedule_id', $row['schedule_id'])
                ->where('student_id', $row['student_id'])
                ->first();

            if ($existing) {
                if ((float)$existing->marks_obtained !== (float)($row['marks_obtained'] ?? 0)) {
                    DB::table('audit_logs')->insert([
                        'entry_id'      => $existing->id,
                        'staff_id'      => $staffId,
                        'old_marks'     => $existing->marks_obtained,
                        'new_marks'     => $row['marks_obtained'],
                        'change_reason' => 'Bulk save via marks entry page',
                        'changed_at'    => now(),
                    ]);
                }
                DB::table('marks_entries')->where('id', $existing->id)->update([
                    'marks_obtained' => $row['marks_obtained'] ?? 0,
                    'is_absent'      => $row['is_absent'] ?? 0,
                    'staff_id'       => $staffId,
                ]);
            } else {
                DB::table('marks_entries')->insert([
                    'schedule_id'    => $row['schedule_id'],
                    'student_id'     => $row['student_id'],
                    'staff_id'       => $staffId,
                    'marks_obtained' => $row['marks_obtained'] ?? 0,
                    'is_absent'      => $row['is_absent'] ?? 0,
                    'entered_at'     => now(),
                ]);
            }
        }

        return response()->json(['message' => 'Bulk save complete']);
    }
}
