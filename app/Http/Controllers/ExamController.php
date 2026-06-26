<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    public function index()
    {
        return response()->json(DB::table('exams')->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'exam_title' => 'required|string|max:120',
            'exam_type'  => 'required|in:unit,midterm,final,annual',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);
        $ay = DB::table('academic_years')->where('is_active', 1)->first();
        $id = DB::table('exams')->insertGetId([
            'year_id'    => $ay?->id ?? 1,
            'title'      => $data['exam_title'],
            'type'       => $data['exam_type'],
            'start_date' => $data['start_date'],
            'end_date'   => $data['end_date'],
            'status'     => 'scheduled',
        ]);
        return response()->json(DB::table('exams')->find($id), 201);
    }

    public function update(Request $request, $id)
    {
        $exam = DB::table('exams')->find($id);
        if (!$exam) return response()->json(['message' => 'Not found'], 404);
        if ($exam->status === 'published') return response()->json(['message' => 'Cannot edit a published exam'], 422);

        $data = $request->validate([
            'exam_title' => 'string|max:120',
            'exam_type'  => 'in:unit,midterm,final,annual',
            'start_date' => 'date',
            'end_date'   => 'date',
        ]);
        $update = [];
        if (isset($data['exam_title'])) $update['title']      = $data['exam_title'];
        if (isset($data['exam_type']))  $update['type']       = $data['exam_type'];
        if (isset($data['start_date'])) $update['start_date'] = $data['start_date'];
        if (isset($data['end_date']))   $update['end_date']   = $data['end_date'];
        DB::table('exams')->where('id', $id)->update($update);
        return response()->json(DB::table('exams')->find($id));
    }

    public function destroy($id)
    {
        $exam = DB::table('exams')->find($id);
        if (!$exam) return response()->json(['message' => 'Not found'], 404);
        if ($exam->status === 'published') return response()->json(['message' => 'Cannot delete published exam'], 422);
        DB::table('exam_schedules')->where('exam_id', $id)->delete();
        DB::table('exams')->delete($id);
        return response()->json(['message' => 'Deleted']);
    }

    public function publish($id)
    {
        DB::table('exams')->where('id', $id)->update(['status' => 'published']);
        app(ResultController::class)->computeForExam($id);
        return response()->json(['message' => 'Published']);
    }

    public function schedules($id)
    {
        $scheds = DB::table('exam_schedules as es')
            ->join('class_subjects as cs', 'es.cs_id', '=', 'cs.id')
            ->join('classes as c', 'cs.class_id', '=', 'c.id')
            ->join('subjects as s', 'cs.subject_id', '=', 's.id')
            ->where('es.exam_id', $id)
            ->select('es.*', 'c.class_name', 'c.section', 's.subject_name')
            ->get();
        return response()->json($scheds);
    }

    public function createSchedule(Request $request, $id)
    {
        $data = $request->validate([
            'cs_id'     => 'required|exists:class_subjects,id',
            'exam_date' => 'required|date',
            'venue'     => 'nullable|string|max:80',
        ]);
        $existing = DB::table('exam_schedules')->where('exam_id', $id)->where('cs_id', $data['cs_id'])->first();
        if ($existing) {
            DB::table('exam_schedules')->where('id', $existing->id)->update([
                'exam_date' => $data['exam_date'],
                'venue'     => $data['venue'] ?? 'Main Hall',
            ]);
            return response()->json(DB::table('exam_schedules')->find($existing->id));
        }
        $sid = DB::table('exam_schedules')->insertGetId([
            'exam_id'   => $id,
            'cs_id'     => $data['cs_id'],
            'exam_date' => $data['exam_date'],
            'venue'     => $data['venue'] ?? 'Main Hall',
        ]);
        return response()->json(DB::table('exam_schedules')->find($sid), 201);
    }
}
