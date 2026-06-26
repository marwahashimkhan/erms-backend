<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalStudents   = DB::table('students')->count();
        $totalExams      = DB::table('exams')->count();
        $publishedExams  = DB::table('exams')->where('status', 'published')->count();
        $pendingRechecks = DB::table('recheck_requests')->where('status', 'pending')->count();

        $lastPub  = DB::table('exams')->where('status', 'published')->orderByDesc('id')->first();
        $passRate = '—';
        if ($lastPub) {
            $total  = DB::table('results')->where('exam_id', $lastPub->id)->count();
            $passed = DB::table('results')->where('exam_id', $lastPub->id)->where('is_pass', 1)->count();
            $passRate = $total ? round($passed / $total * 100) . '%' : '0%';
        }

        $recentExams = DB::table('exams')->orderByDesc('id')->limit(5)->get(['id', 'title', 'type', 'status']);

        $classes = DB::table('classes as c')
            ->selectRaw('c.class_name, c.section, COUNT(s.id) as student_count')
            ->leftJoin('students as s', 'c.id', '=', 's.class_id')
            ->groupBy('c.id', 'c.class_name', 'c.section')
            ->get();

        return response()->json(compact(
            'totalStudents', 'totalExams', 'publishedExams', 'pendingRechecks',
            'passRate', 'recentExams', 'classes'
        ));
    }
}
