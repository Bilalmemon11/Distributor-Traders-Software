<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">

    <style>

        body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; font-size: 13px; color: #333; margin: 0; padding: 30px; line-height: 1.4; }
        h1, h2, h3, h4, p { margin: 0; padding: 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        
        /* Headers and titles */
        .header { margin-bottom: 30px; }
        .header td { vertical-align: top; border: none; padding: 2px; }
        .header-center { text-align: center; margin-bottom: 30px; }
        
        .company-name, .title { font-size: 26px; font-weight: bold; color: #1e3a8a; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
        .subtitle { font-size: 13px; color: #475569; font-weight: normal; margin-bottom: 4px; }
        .invoice-title { font-size: 22px; font-weight: bold; color: #1e3a8a; text-align: right; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        
        .section-title { font-size: 15px; font-weight: bold; color: #1e3a8a; margin: 25px 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; text-transform: uppercase; }
        
        hr { border: none; border-top: 2px solid #e2e8f0; margin: 25px 0; }
        .section { margin-bottom: 25px; }

        /* Tables (Global) */
        th, td { border: 1px solid #cbd5e1; padding: 10px 12px; color: #1e293b; }
        th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            text-align: left;
            border: 1px solid #1e3a8a;
        }
        
        /* Zebra Striping for Items */
        .items tr:nth-child(even) td, tbody tr:nth-child(even) td { background-color: #f8fafc; }
        
        /* Avoid zebra striping on layout/summary tables */
        .header tr:nth-child(even) td, .summary tr:nth-child(even) td { background-color: transparent; }
        table[style*="border:none"] td { border: none; padding: 4px 0; }

        .text-center { text-align: center; }
        .text-right { text-align: right; }

        /* Summary section */
        table.summary { width: 45%; float: right; margin-top: 10px; border: none; }
        .summary td { padding: 10px 12px; border: 1px solid #cbd5e1; background-color: transparent; }
        .summary .title { font-weight: bold; background-color: #f1f5f9; color: #334155; width: 50%; }
        
        /* Badges */
        .paid { color: #16a34a; font-weight: bold; background: #dcfce7; padding: 4px 8px; border-radius: 4px; display: inline-block; font-size: 12px; }
        .pending { color: #dc2626; font-weight: bold; background: #fee2e2; padding: 4px 8px; border-radius: 4px; display: inline-block; font-size: 12px; }

        /* Signatures and Footer */
        .signature {
            width: 220px;
            border-top: 1px solid #64748b;
            text-align: center;
            float: right;
            margin-top: 80px;
            padding-top: 8px;
            font-weight: bold;
            color: #475569;
        }
        .sign { border-top: 1px solid #64748b; margin-top: 60px; padding-top: 8px; text-align: center; width: 220px; font-weight: bold; float: right; color: #475569;}
        
        .footer {
            text-align: center;
            margin-top: 120px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 11px;
            clear: both;
        }


        /* Additional helper classes for backwards compatibility */
        .no-border td, .no-border th, table.no-border { border: none !important; padding: 4px 0 !important; background: transparent !important; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .mt { margin-top: 20px; }
        .mt-40 { margin-top: 40px; }
        tfoot td { font-weight: bold; background-color: #f1f5f9; }

</style>

</head>

<body>

<div class="center">

<div class="title">
QADRI WHOLESALE & DISTRIBUTOR
</div>

<h2 class="subtitle">
Distributor & Wholesale
</h2>

<h3 class="subtitle">
FMCG • Cosmetics • General Trade
</h3>

<h3 class="subtitle">
Abdul Qadir : 0319-4083445
</h3>

<h3 class="subtitle">
Bilal Memon : 0316-3128491
</h3>

<h3 class="subtitle">
Memon Society, Qasimabad Hyderabad
</h3>

<h2 style="margin-top:15px;">
SUPPLIER PURCHASE RETURN
</h2>

</div>

<table class="no-border">

<tr>

<td width="50%">

<b>Return No:</b>
{{ $purchaseReturn->return_no }}

</td>

<td>

<b>Date:</b>
{{ \Carbon\Carbon::parse($purchaseReturn->date)->format('d-m-Y') }}

</td>

</tr>

<tr>

<td>

<b>Purchase Invoice:</b>
{{ $purchaseReturn->purchase->po_no }}

</td>

<td>

<b>Supplier:</b>
{{ $purchaseReturn->vendor->name }}

</td>

</tr>

<tr>

<td colspan="2">

<b>Return Reason:</b>

{{ $purchaseReturn->reason ?: '-' }}

</td>

</tr>

</table>


<table>

<thead>

<tr>

<th>#</th>

<th>Product</th>

<th>Qty</th>

<th>Purchase Rate</th>

<th>Total Amount</th>

</tr>

</thead>

<tbody>

@foreach($purchaseReturn->items as $item)

<tr>

<td>

{{ $loop->iteration }}

</td>

<td>

{{ $item->product->name }}

</td>

<td class="right">

{{ number_format($item->qty,2) }}

</td>

<td class="right">

Rs.
{{ number_format($item->unit_cost,2) }}

</td>

<td class="right">

Rs.
{{ number_format($item->total,2) }}

</td>

</tr>

@endforeach

</tbody>

<tfoot>

<tr>

<td colspan="4" class="right bold">

Total Return Amount

</td>

<td class="right bold">

Rs.
{{ number_format($purchaseReturn->total,2) }}

</td>

</tr>

</tfoot>

</table>


<div class="mt">

_________________________

<br>

Authorized By

</div>

<hr style="margin-top:40px;">

<div style="text-align:center;font-size:11px;color:#666;">
Thank You For Your Business
<br>
Qadri Distributor & Wholesale 
</div>

<div style="text-align: center; font-size: 9px; color: #64748b; margin-top: 20px; padding-top: 6px; border-top: 1px dotted #ccc;">
    Software Create by StackNova-Tech: +923-373375526
</div>

</body>

</html>