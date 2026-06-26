<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\MarksController;
use App\Http\Controllers\ResultController;
use App\Http\Controllers\RecheckController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AuditController;

// ── Public ────────────────────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);

// ── Protected (Sanctum token required) ──────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::get('/exams',                 [ExamController::class, 'index']);
    Route::post('/exams',                [ExamController::class, 'store']);
    Route::put('/exams/{id}',            [ExamController::class, 'update']);
    Route::delete('/exams/{id}',         [ExamController::class, 'destroy']);
    Route::post('/exams/{id}/publish',   [ExamController::class, 'publish']);
    Route::get('/exams/{id}/schedules',  [ExamController::class, 'schedules']);
    Route::post('/exams/{id}/schedules', [ExamController::class, 'createSchedule']);

    Route::get('/classes',               [ClassController::class, 'index']);
    Route::post('/classes',              [ClassController::class, 'store']);
    Route::get('/classes/{id}/subjects', [ClassController::class, 'subjects']);
    Route::get('/classes/{id}/students', [ClassController::class, 'students']);

    Route::get('/students',              [StudentController::class, 'index']);
    Route::post('/students',             [StudentController::class, 'store']);
    Route::put('/students/{id}',         [StudentController::class, 'update']);
    Route::delete('/students/{id}',      [StudentController::class, 'destroy']);

    Route::get('/marks',                 [MarksController::class, 'sheet']);
    Route::post('/marks',                [MarksController::class, 'save']);
    Route::post('/marks/bulk',           [MarksController::class, 'saveBulk']);

    Route::get('/results',                   [ResultController::class, 'index']);
    Route::post('/results/compute/{examId}', [ResultController::class, 'compute']);
    Route::get('/results/card',              [ResultController::class, 'card']);

    Route::get('/rechecks',              [RecheckController::class, 'index']);
    Route::post('/rechecks',             [RecheckController::class, 'store']);
    Route::put('/rechecks/{id}/resolve', [RecheckController::class, 'resolve']);

    Route::get('/reports/performance', [ReportController::class, 'performance']);
    Route::get('/reports/export',      [ReportController::class, 'export']);

    Route::get('/audit', [AuditController::class, 'log']);
});
