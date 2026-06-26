<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    public function index()
    {
        $students = DB::table('students as s')
            ->join('classes as c', 's.class_id', '=', 'c.id')
            ->select('s.*', 'c.class_name', 'c.section')
            ->orderBy('c.class_name')->orderBy('s.roll_number')
            ->get();
        return response()->json($students);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'class_id'      => 'required|exists:classes,id',
            'student_name'  => 'required|string|max:100',
            'roll_number'   => 'required|string|max:20',
            'date_of_birth' => 'nullable|date',
        ]);
        $id = DB::table('students')->insertGetId($data);
        return response()->json(DB::table('students')->find($id), 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'class_id'      => 'exists:classes,id',
            'student_name'  => 'string|max:100',
            'roll_number'   => 'string|max:20',
            'date_of_birth' => 'nullable|date',
        ]);
        DB::table('students')->where('id', $id)->update($data);
        return response()->json(DB::table('students')->find($id));
    }

    public function destroy($id)
    {
        $hasMarks = DB::table('marks_entries')->where('student_id', $id)->exists();
        if ($hasMarks) return response()->json(['message' => 'Cannot delete — student has marks records'], 422);
        DB::table('students')->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
