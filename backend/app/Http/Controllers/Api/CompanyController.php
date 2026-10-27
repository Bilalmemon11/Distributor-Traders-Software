<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    /**
     * Get Company Details
     */
    public function show()
    {
        $company = Company::first();

        if (!$company) {

            $company = Company::create([
                'company_name' => 'HASHMI FABRICS',
                'currency' => 'PKR',
                'invoice_prefix' => 'INV',
                'purchase_prefix' => 'PUR',
                'return_prefix' => 'RET',
            ]);

        }

        return response()->json([
            'success' => true,
            'data' => $company,
        ]);
    }

    /**
     * Save / Update Company
     */
    public function save(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'whatsapp' => 'nullable|string|max:50',
            'ntn' => 'nullable|string|max:100',
            'strn' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:20',
            'invoice_prefix' => 'nullable|string|max:20',
            'purchase_prefix' => 'nullable|string|max:20',
            'return_prefix' => 'nullable|string|max:20',
            'tax_percent' => 'nullable|numeric',
            'discount_percent' => 'nullable|numeric',
            'footer_text' => 'nullable|string',
            'terms' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        $company = Company::first();

        if (!$company) {
            $company = new Company();
        }

        $company->fill($request->except('logo'));

        if ($request->hasFile('logo')) {

            $path = $request->file('logo')->store('company', 'public');

            $company->logo = $path;
        }

        $company->save();

        return response()->json([
            'success' => true,
            'message' => 'Company settings saved successfully.',
            'data' => $company,
        ]);
    }
}