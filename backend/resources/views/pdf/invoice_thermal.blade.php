<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales Invoice - {{ $invoice->invoice_no }}</title>
    <style>
        @page {
            margin: 0;
        }
        body {
            font-family: 'Helvetica Neue', 'Helvetica', sans-serif;
            font-size: 11px;
            color: #000;
            margin: 0;
            padding: 10px;
            width: 100%;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        
        .header {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
        }
        .company-name {
            font-size: 14px;
            font-weight: bold;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .items th, .items td {
            padding: 4px 0;
            border-bottom: 1px dotted #000;
        }
        .items th {
            text-align: left;
            border-bottom: 1px solid #000;
        }
        
        .summary {
            margin-top: 10px;
            width: 100%;
        }
        .summary td {
            padding: 3px 0;
        }
        .totals-divider {
            border-top: 1px dashed #000;
        }
        .footer {
            margin-top: 15px;
            text-align: center;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 10px;
        }
    </style>
</head>
<body>

<div class="header text-center">
    <div class="company-name">QADRI DISTRIBUTOR</div>
    <div>FMCG | Cosmetics | General</div>
    <div>Cell: 0319-4083445 / 0316-3128491</div>
    <div>Qasimabad Hyderabad</div>
</div>

<div style="margin-bottom: 10px;">
    <table>
        <tr>
            <td class="font-bold">Inv #:</td>
            <td class="text-right">{{ $invoice->invoice_no }}</td>
        </tr>
        <tr>
            <td class="font-bold">Date:</td>
            <td class="text-right">{{ \Carbon\Carbon::parse($invoice->date)->format('d-m-Y') }}</td>
        </tr>
        <tr>
            <td class="font-bold">Shop:</td>
            <td class="text-right">{{ $invoice->customer->name }}</td>
        </tr>
    </table>
</div>

<table class="items">
    <thead>
        <tr>
            <th>Item</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($invoice->items as $item)
        <tr>
            <td>
                {{ Str::limit($item->product->name, 20) }}<br>
                <span style="font-size:9px;">@ {{ number_format($item->unit_price, 2) }}</span>
            </td>
            <td class="text-center" style="vertical-align: top;">{{ number_format($item->qty, 0) }}</td>
            <td class="text-right" style="vertical-align: top;">{{ number_format($item->total, 2) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<table class="summary">
    <tr>
        <td>Subtotal</td>
        <td class="text-right">{{ number_format($invoice->subtotal, 2) }}</td>
    </tr>
    <tr>
        <td>Discount</td>
        <td class="text-right">-{{ number_format($invoice->discount, 2) }}</td>
    </tr>
    <tr class="totals-divider">
        <td class="font-bold">Total</td>
        <td class="text-right font-bold">{{ number_format($invoice->total, 2) }}</td>
    </tr>
    <tr>
        <td>Paid</td>
        <td class="text-right">{{ number_format($invoice->paid, 2) }}</td>
    </tr>
    <tr>
        <td class="font-bold">Balance</td>
        <td class="text-right font-bold">{{ number_format($invoice->balance, 2) }}</td>
    </tr>
</table>

<div class="footer">
    Thank you for choosing<br>Qadri Distributor & Traders
</div>

</body>
</html>
