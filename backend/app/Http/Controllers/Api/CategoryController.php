<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json([
            'success'=>true,
            'data'=>Category::orderBy('name')->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'=>'required|unique:categories'
        ]);

        $category = Category::create([
            'name'=>$request->name
        ]);

        return response()->json([
            'success'=>true,
            'data'=>$category
        ]);
    }
}