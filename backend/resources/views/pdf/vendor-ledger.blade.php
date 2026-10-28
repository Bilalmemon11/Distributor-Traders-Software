<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    body {
        font-family: Arial, sans-serif;
        font-size: 11px;
        color: #000;
        margin: 0;
        padding: 10px;
    }
    .header-text {
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        color: #000080;
        margin-bottom: 10px;
        text-transform: uppercase;
    }
    .top-box {
        border: 2px solid #000080;
        border-radius: 6px;
        padding: 4px;
        width: 65%;
        float: left;
        min-height: 50px;
    }
    .top-box table {
        width: 100%;
        border-collapse: collapse;
    }
    .top-box td {
        padding: 1px 2px;
        vertical-align: top;
    }
    .label-col {
        width: 40px;
        font-weight: bold;
        color: #000080;
        font-size: 11px;
    }
    .colon-col {
        width: 10px;
        color: #000080;
    }
    .val-col {
        font-size: 11px;
    }
    .val-col.bold {
        font-size: 13px;
        font-weight: bold;
        color: #000080;
    }
    .right-box-wrapper {
        width: 33%;
        float: right;
        text-align: center;
    }
    .account-statement {
        font-size: 16px;
        font-weight: bold;
        color: #000080;
        margin-bottom: 3px;
    }
    .right-box {
        border: 2px solid #000080;
        border-radius: 6px;
        padding: 3px;
        font-size: 10px;
        font-weight: bold;
        color: #000080;
    }
    .clear {
        clear: both;
    }
    .ledger-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
    }
    .ledger-table th {
        background-color: #000080;
        color: white;
        padding: 4px;
        font-size: 12px;
        text-transform: uppercase;
        border: 1px solid #000080;
    }
    .ledger-table td {
        border-right: 1px solid #000080;
        border-left: 1px solid #000080;
        padding: 4px;
        vertical-align: top;
    }
    .ledger-table tr.item-row td {
        border-bottom: 1px dotted #000080;
    }
    .ledger-table tr.total-row td {
        border-top: 1px solid #000080;
        border-bottom: 1px solid #000080;
        font-weight: bold;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    .blue-line {
        border-top: 2px solid #000080;
        margin-bottom: 4px;
    }
</style>
</head>
<body>

@php
    $transactions = collect();
    $paymentsHandled = [];
    
    $totalDebit = 0;
    $totalCredit = 0;

    // For Vendors:
    // Purchase = We owe them more = Credit
    // Payment to Vendor = We owe them less = Debit
    // Purchase Return = We owe them less = Debit

    foreach($vendor->purchases as $pur) {
        $debit = 0; // Payment made exactly on the same day for this purchase?
        $linkedPayments = $vendor->payments->where('purchase_id', $pur->id);
        foreach($linkedPayments as $lp) {
            if (\Carbon\Carbon::parse($lp->date)->isSameDay(\Carbon\Carbon::parse($pur->date))) {
                $debit += $lp->amount;
                $paymentsHandled[] = $lp->id;
            }
        }
        
        $transactions->push([
            'date_obj' => \Carbon\Carbon::parse($pur->date),
            'date_str' => \Carbon\Carbon::parse($pur->date)->format('d-M-Y'),
            'time_str' => \Carbon\Carbon::parse($pur->created_at)->format('h:i:s A'),
            'type' => '1PI',
            'narration' => 'Purchases',
            'chq' => '',
            'ref' => $pur->purchase_no,
            'debit' => $debit, // Paid same day
            'credit' => $pur->total, // Total purchase added to balance
        ]);
    }
    
    foreach($vendor->payments as $pay) {
        if (!in_array($pay->id, $paymentsHandled)) {
            $transactions->push([
                'date_obj' => \Carbon\Carbon::parse($pay->date),
                'date_str' => \Carbon\Carbon::parse($pay->date)->format('d-M-Y'),
                'time_str' => '',
                'type' => '2PV',
                'narration' => 'PAYMENT SENT',
                'chq' => '',
                'ref' => 'PAY-'.str_pad($pay->id, 4, '0', STR_PAD_LEFT),
                'debit' => $pay->amount,
                'credit' => 0,
            ]);
        }
    }
    
    if (isset($vendor->purchaseReturns) && count($vendor->purchaseReturns) > 0) {
        foreach($vendor->purchaseReturns as $ret) {
            $transactions->push([
                'date_obj' => \Carbon\Carbon::parse($ret->date),
                'date_str' => \Carbon\Carbon::parse($ret->date)->format('d-M-Y'),
                'time_str' => \Carbon\Carbon::parse($ret->created_at)->format('h:i:s A'),
                'type' => 'PR',
                'narration' => 'Purchase Return ' . ($ret->reason ? '- '.$ret->reason : ''),
                'chq' => '',
                'ref' => $ret->return_no,
                'debit' => $ret->total,
                'credit' => 0,
            ]);
        }
    }
    
    $transactions = $transactions->sortBy(function($t) {
        return $t['date_obj']->timestamp;
    })->values();

    $startDate = $transactions->first() ? $transactions->first()['date_str'] : now()->format('d-M-Y');
    $endDate = now()->format('d-M-Y');

    $openingBalance = 0; 
    $runningBalance = $openingBalance;
@endphp

<div class="header-text">QADRI DISTRIBUTOR & Traders</div>

<div class="blue-line"></div>

<div>
    <div class="top-box">
        <table>
            <tr>
                <td class="label-col">I.D.</td>
                <td class="colon-col">:</td>
                <td class="val-col">V{{ $vendor->id }}</td>
            </tr>
            <tr>
                <td class="label-col">TITLE</td>
                <td class="colon-col">:</td>
                <td class="val-col bold">{{ strtoupper($vendor->name) }}</td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td class="val-col" style="color:#000080;">{{ strtoupper($vendor->company ?: 'VENDOR') }}</td>
            </tr>
        </table>
    </div>

    <div class="right-box-wrapper">
        <div class="account-statement">ACCOUNT STATMENT</div>
        <div class="right-box">
            Page 1 of 1<br>
            DATE {{ $startDate }} TO {{ $endDate }}
        </div>
    </div>
    <div class="clear"></div>
</div>

<table class="ledger-table">
    <thead>
        <tr>
            <th class="text-left" style="width:13%;">DATE</th>
            <th class="text-left" style="width:30%;">NARRATION</th>
            <th class="text-center" style="width:12%;">Chq. #</th>
            <th class="text-right" style="width:15%;">DEBIT</th>
            <th class="text-right" style="width:15%;">CREDIT</th>
            <th class="text-right" style="width:15%;">BALANCE</th>
        </tr>
    </thead>
    <tbody>
        <tr class="item-row">
            <td style="font-weight:bold;">{{ $startDate }}<br>------</td>
            <td style="font-weight:bold;">OB</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>

        @foreach($transactions as $t)
            @php
                // For vendors, Credit adds to balance, Debit reduces it.
                $runningBalance += $t['credit'];
                $runningBalance -= $t['debit'];

                $totalDebit += $t['debit'];
                $totalCredit += $t['credit'];

                $balStr = number_format(abs($runningBalance)) . ' ' . ($runningBalance >= 0 ? 'Cr' : 'Dr');
            @endphp
            <tr class="item-row">
                <td style="font-weight:bold;">
                    {{ $t['date_str'] }}<br>
                    <span style="font-weight:normal; color:#000080; font-size:10px;">{{ $t['ref'] }}</span>
                </td>
                <td>
                    <span style="font-weight:bold;">{{ $t['type'] }}</span> &nbsp;&nbsp;&nbsp; <span style="font-size:10px;">{{ $t['narration'] }} {{ $t['time_str'] }}</span>
                    @if($t['type'] == '1PI' || $t['type'] == 'PR')
                        <br><span style="color:#000080; font-size:10px; margin-left:25px;">{{ $t['ref'] }}</span>
                    @endif
                </td>
                <td>{{ $t['chq'] }}</td>
                <td class="text-right">{{ $t['debit'] > 0 ? number_format($t['debit']) : '' }}</td>
                <td class="text-right">{{ $t['credit'] > 0 ? number_format($t['credit']) : '' }}</td>
                <td class="text-right">{{ $balStr }}</td>
            </tr>
        @endforeach

        <tr class="total-row">
            <td></td>
            <td></td>
            <td></td>
            <td class="text-right">{{ number_format($totalDebit) }}</td>
            <td class="text-right">{{ number_format($totalCredit) }}</td>
            <td></td>
        </tr>
    </tbody>
</table>

<div style="text-align: center; font-size: 9px; color: #64748b; margin-top: 25px; padding-top: 6px; border-top: 1px dotted #ccc;">
    Software Create by StackNova-Tech: +923-373375526
</div>

</body>
</html>