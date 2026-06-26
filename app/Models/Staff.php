<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Staff extends Authenticatable
{
    use HasApiTokens;

    protected $table    = 'staff';
    protected $fillable = ['school_id', 'name', 'email', 'password', 'role'];
    protected $hidden   = ['password'];
}
