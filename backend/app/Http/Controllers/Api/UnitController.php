<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index()
    {
        return response()->json([
            'success'=>true,
            'data'=>Unit::orderBy('name')->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'=>'required|unique:units'
        ]);

        $unit = Unit::create([
            'name'=>$request->name
        ]);

        return response()->json([
            'success'=>true,
            'data'=>$unit
        ]);
    }
}