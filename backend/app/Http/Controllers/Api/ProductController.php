<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\InventoryTransaction;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\ProductVariant;

class ProductController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
      $products = Product::with([
      'category',
      'unit',
      'variants'
     ])
     ->orderBy('name')
     ->get();
        return $this->success($products);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',

            'category_id' => 'required|exists:categories,id',

            'brand' => 'nullable|string|max:255',

            'unit_id' => 'required|exists:units,id',

            'variants' => 'required|array|min:1',

            'variants.*.variant_name' => 'required|string|max:100',

            'variants.*.price' => 'required|numeric|min:0',

            'variants.*.cost_price' => 'required|numeric|min:0',

            'variants.*.stock_qty' => 'nullable|numeric|min:0',

            'variants.*.reorder_level' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
        ]);

return DB::transaction(function () use ($validated) {

    $lastId = (Product::max('id') ?? 0) + 1;

    $sku = 'HF-' . str_pad($lastId, 4, '0', STR_PAD_LEFT);

    $product = Product::create([
        'name' => $validated['name'],
        'category_id' => $validated['category_id'],
        'brand' => $validated['brand'] ?? null,
        'unit_id' => $validated['unit_id'],
        'description' => $validated['description'] ?? null,

        // Temporary (migration update ke baad remove kar denge)
        'sku' => $sku,
        'status' => true,
    ]);

    foreach ($validated['variants'] as $index => $variant) {

        $variantModel = ProductVariant::create([
            'product_id' => $product->id,

            'variant_name' => $variant['variant_name'],

            'sku' => $sku . '-' . ($index + 1),

            'price' => $variant['price'],

            'cost_price' => $variant['cost_price'],

            'stock_qty' => $variant['stock_qty'] ?? 0,

            'reorder_level' => $variant['reorder_level'] ?? 0,
        ]);

        if ($variantModel->stock_qty > 0) {

            InventoryTransaction::create([
                'product_id' => $product->id,
                'variant_id' => $variantModel->id,
                'type' => 'opening',
                'qty' => $variantModel->stock_qty,
                'stock_before' => 0,
                'stock_after' => $variantModel->stock_qty,
                'notes' => 'Opening Stock',
            ]);
        }
    }

    return $this->success(
        $product->fresh()->load([
            'category',
            'unit',
            'variants',
        ])
    );
});
            
    }

    public function show(Product $product): JsonResponse
    {
        return $this->success(
            $product->load(['category', 'unit','variants'])
        );
    }

    public function update(Request $request, Product $product): JsonResponse
{
    $validated = $request->validate([

        'name' => 'sometimes|required|string|max:255',

        'category_id' => 'sometimes|required|exists:categories,id',

        'brand' => 'nullable|string|max:255',

        'unit_id' => 'sometimes|required|exists:units,id',

        'status' => 'nullable|boolean',

        'description' => 'nullable|string',

        'variants' => 'sometimes|array',

        'variants.*.id' => 'nullable|integer|exists:product_variants,id',

        'variants.*.variant_name' => 'required|string|max:100',

        'variants.*.price' => 'required|numeric|min:0',

        'variants.*.cost_price' => 'required|numeric|min:0',

        'variants.*.stock_qty' => 'nullable|numeric|min:0',

        'variants.*.reorder_level' => 'nullable|integer|min:0',
    ]);

    return DB::transaction(function () use ($validated, $product) {

        $product->update([
            'name' => $validated['name'] ?? $product->name,
            'category_id' => $validated['category_id'] ?? $product->category_id,
            'brand' => $validated['brand'] ?? $product->brand,
            'unit_id' => $validated['unit_id'] ?? $product->unit_id,
            'status' => $validated['status'] ?? $product->status,
            'description' => $validated['description'] ?? $product->description,
        ]);

        if (isset($validated['variants'])) {

            $existingVariantIds = $product->variants()->pluck('id')->toArray();
            $incomingVariantIds = collect($validated['variants'])->pluck('id')->filter()->toArray();

            $variantsToDelete = array_diff($existingVariantIds, $incomingVariantIds);
            ProductVariant::whereIn('id', $variantsToDelete)->delete();

            foreach ($validated['variants'] as $index => $variant) {

                if (!empty($variant['id'])) {
                    ProductVariant::where('id', $variant['id'])->update([
                        'variant_name' => $variant['variant_name'],
                        'price' => $variant['price'],
                        'cost_price' => $variant['cost_price'],
                        'stock_qty' => $variant['stock_qty'] ?? 0,
                        'reorder_level' => $variant['reorder_level'] ?? 0,
                    ]);
                } else {
                    ProductVariant::create([
                        'product_id' => $product->id,

                        'variant_name' => $variant['variant_name'],

                        'sku' => $product->sku . '-' . ($index + 1),

                        'price' => $variant['price'],

                        'cost_price' => $variant['cost_price'],

                        'stock_qty' => $variant['stock_qty'] ?? 0,

                        'reorder_level' => $variant['reorder_level'] ?? 0,
                    ]);
                }
            }
        }

        return $this->success(
            $product->fresh()->load([
                'category',
                'unit',
                'variants',
            ]),
            'Product updated'
        );
    });
}

    public function destroy(Product $product): JsonResponse
    {
        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($product) {
                // Delete related purchase items to bypass SQLite ON DELETE NO ACTION constraint
                \App\Models\PurchaseItem::where('product_id', $product->id)->delete();
                $product->delete();
            });

            return $this->success(null, 'Product deleted');
        } catch (\Exception $e) {
            return $this->error('Cannot delete product: ' . $e->getMessage(), 400);
        }
    }
}
