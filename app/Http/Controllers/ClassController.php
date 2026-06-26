<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClassController extends Controller
{
    public function index()
    {
        $classes = DB::table('classes as c')
            ->join('academic_years as ay', 'c.year_id', '=', 'ay.id')
            ->select('c.*', 'ay.label as year_label')
            ->orderBy('c.class_name')->orderBy('c.section')
            ->get();
        return response()->json($classes);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'class_name'   => 'required|string|max:50',
            'section'      => 'required|string|max:5',
            'min_pass_pct' => 'numeric|min:0|max:100',
        ]);
        $ay = DB::table('academic_years')->where('is_active', 1)->first();
        $data['year_id'] = $ay?->id ?? 1;
        $id = DB::table('classes')->insertGetId($data);
        return response()->json(DB::table('classes')->find($id), 201);
    }

    public function subjects($id)
    {
        $subjects = DB::table('class_subjects as cs')
            ->join('subjects as s', 'cs.subject_id', '=', 's.id')
            ->where('cs.class_id', $id)
            ->select('cs.id as cs_id', 's.id as subject_id', 's.subject_name', 's.subject_code', 'cs.max_marks', 'cs.min_pass_marks')
            ->get();
        return response()->json($subjects);
    }

    public function students($id)
    {
        return response()->json(DB::table('students')->where('class_id', $id)->orderBy('roll_number')->get());
    }
}
