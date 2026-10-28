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
                'company_name' => 'QADRI DISTRIBUTOR & TRADERS',
                'owner_name' => 'Bilal Memon',
                'phone' => '0319-4083445 / 0316-3128491',
                'whatsapp' => '0319-4083445',
                'city' => 'HYDERABAD',
                'country' => 'PAKISTAN',
                'address' => 'Qasimabad, Hyderabad',
                'currency' => 'PKR',
                'invoice_prefix' => 'INV',
                'purchase_prefix' => 'PUR',
                'return_prefix' => 'RET',
                'default_invoice_size' => 'a4',
                'show_previous_balance' => true,
                'show_signatures' => true,
                'show_customer_area' => true,
                'low_stock_threshold' => 10,
                'expiry_alert_days' => 60,
                'allow_negative_stock' => false,
            ]);
        } elseif ($company->company_name === 'HASHMI FABRICS' && empty($company->phone)) {
            // Seed initial real profile details if still untouched default
            $company->update([
                'company_name' => 'QADRI DISTRIBUTOR & TRADERS',
                'phone' => '0319-4083445 / 0316-3128491',
                'whatsapp' => '0319-4083445',
                'city' => 'HYDERABAD',
                'country' => 'PAKISTAN',
                'address' => 'Qasimabad, Hyderabad',
                'default_invoice_size' => 'a4',
                'show_previous_balance' => true,
                'show_signatures' => true,
                'show_customer_area' => true,
                'low_stock_threshold' => 10,
                'expiry_alert_days' => 60,
                'allow_negative_stock' => false,
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
            'phone' => 'nullable|string|max:100',
            'whatsapp' => 'nullable|string|max:100',
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
            'default_invoice_size' => 'nullable|string|in:a4,thermal',
            'show_previous_balance' => 'nullable',
            'show_signatures' => 'nullable',
            'show_customer_area' => 'nullable',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'expiry_alert_days' => 'nullable|integer|min:1',
            'allow_negative_stock' => 'nullable',
        ]);

        $company = Company::first();

        if (!$company) {
            $company = new Company();
        }

        $data = $request->except('logo');

        // Handle boolean fields from FormData
        $boolFields = ['show_previous_balance', 'show_signatures', 'show_customer_area', 'allow_negative_stock'];
        foreach ($boolFields as $boolField) {
            if ($request->has($boolField)) {
                $data[$boolField] = filter_var($request->input($boolField), FILTER_VALIDATE_BOOLEAN);
            }
        }

        $company->fill($data);

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