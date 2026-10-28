<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales Invoice - {{ $invoice->invoice_no }}</title>

    <style>
        body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; font-size: 13px; color: #000; margin: 0; padding: 20px; line-height: 1.4; }
        
        /* Headers and titles */
        .company-name { font-size: 24px; font-weight: bold; color: #000; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
        .city-name { font-size: 14px; text-align: center; text-transform: uppercase; margin-bottom: 20px; font-weight: bold; }

        /* Tables (Global) */
        table { width: 100%; border-collapse: collapse; }
        
        .box-table td { border: none; padding: 2px 4px; }
        
        /* Items Table */
        .items { margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #1e3a8a; }
        .items th {
            color: #1e3a8a;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            border-top: 2px solid #1e3a8a;
            border-bottom: 2px solid #1e3a8a;
            padding: 8px 5px;
            background: transparent;
        }
        .items td {
            padding: 6px 5px;
            font-size: 11px;
            border-right: 1px solid #ccc;
            border-bottom: 1px dashed #ccc;
        }
        .items td:last-child {
            border-right: none;
        }
        
        .footer-totals td {
            font-size: 12px;
            font-weight: bold;
            color: #1e3a8a;
            padding: 4px;
        }
        .footer-totals td.value {
            color: #000;
            text-align: right;
        }

        .bordered-box {
            border: 1px solid #000; 
            border-radius: 8px; 
            padding: 10px;
        }
        .erp-box {
            border: 2px solid #000;
            display: inline-block;
            padding: 4px 10px;
            background-color: #f1f5f9;
            margin-top: 30px;
            border-radius: 4px;
        }
        .erp-text {
            color: #047857;
            font-weight: 900;
            letter-spacing: 0.5px;
            font-size: 11px;
        }
    </style>
</head>
<body>

@php
function convertNumberToWord($num = false) {
    $num = str_replace(array(',', ' '), '' , trim($num));
    if(! $num) {
        return false;
    }
    
    $parts = explode('.', $num);
    $num = (int) $parts[0];
    $decimal = isset($parts[1]) ? (int) substr($parts[1], 0, 2) : 0;
    
    $words = array();
    $list1 = array('', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN',
        'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
    );
    $list2 = array('', 'TEN', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY', 'HUNDRED');
    $list3 = array('', 'THOUSAND', 'MILLION', 'BILLION', 'TRILLION');
    
    function parseNumToWords($number, $list1, $list2, $list3) {
        $num_length = strlen($number);
        $levels = (int) (($num_length + 2) / 3);
        $max_length = $levels * 3;
        $number = substr('00' . $number, -$max_length);
        $num_levels = str_split($number, 3);
        $words = array();
        for ($i = 0; $i < count($num_levels); $i++) {
            $levels--;
            $hundreds = (int) ($num_levels[$i] / 100);
            $hundreds = ($hundreds ? ' ' . $list1[$hundreds] . ' HUNDRED' . ' ' : '');
            $tens = (int) ($num_levels[$i] % 100);
            $singles = '';
            if ( $tens < 20 ) {
                $tens = ($tens ? ' ' . $list1[$tens] . ' ' : '' );
            } else {
                $tens = (int)($tens / 10);
                $tens = ' ' . $list2[$tens] . ' ';
                $singles = (int) ($num_levels[$i] % 10);
                $singles = ' ' . $list1[$singles] . ' ';
            }
            $words[] = $hundreds . $tens . $singles . ( ( $levels && ( int ) ( $num_levels[$i] ) ) ? ' ' . $list3[$levels] . ' ' : '' );
        }
        return trim(implode(' ', $words));
    }
    
    $main_words = parseNumToWords($num, $list1, $list2, $list3);
    
    if($decimal > 0) {
        $decimal_words = parseNumToWords($decimal, $list1, $list2, $list3);
        return $main_words . " AND " . $decimal_words . " PAISAS";
    }
    
    return $main_words;
}
$amountInWords = convertNumberToWord($invoice->total) . ' RUPEES ONLY.';
@endphp

<div class="company-name">{{ $company?->company_name ?? 'QADRI DISTRIBUTOR & TRADERS' }}</div>
<div class="city-name">
    {{ $company?->city ? strtoupper($company->city) . '.' : 'HYDERABAD.' }}
    @if($company?->phone)
        <span style="font-size: 11px; font-weight: normal; margin-left: 10px;">TEL: {{ $company->phone }}</span>
    @endif
    @if($company?->ntn)
        <span style="font-size: 11px; font-weight: normal; margin-left: 10px;">NTN: {{ $company->ntn }}</span>
    @endif
</div>

<table width="100%" style="margin-top: 10px; border: none;">
    <tr>
        <td width="48%" style="vertical-align: top; padding: 0;">
            <div class="bordered-box" style="min-height: 90px;">
                <table class="box-table" width="100%" style="font-size: 12px; font-weight: bold;">
                    <tr><td width="70">I.D.</td><td width="10">:</td><td>{{ $invoice->customer_id }}</td></tr>
                    <tr><td>M/s.</td><td>:</td><td>{{ strtoupper($invoice->customer->name) }}</td></tr>
                    <tr><td>ADDRESS</td><td>:</td><td>{{ strtoupper($invoice->customer->address ?? '-') }}</td></tr>
                    @if($company?->show_customer_area ?? true)
                    <tr><td>AREA</td><td>:</td><td>{{ strtoupper($invoice->customer->area?->name ?? 'HYDERABAD') }}</td></tr>
                    @endif
                    <tr><td>PHONE</td><td>:</td><td>{{ $invoice->customer->phone ?? '-' }}</td></tr>
                </table>
            </div>
        </td>
        <td width="2%"></td>
        <td width="50%" style="vertical-align: top; padding: 0;">
            <div class="bordered-box" style="min-height: 90px; padding: 0; display: table; width: 100%;">
                <div style="display: table-cell; width: 25%; text-align: center; vertical-align: middle; border-right: 1px solid #000; font-weight: bold; font-size: 15px; padding: 5px;">
                    SALE<br>INVOICE
                </div>
                <div style="display: table-cell; width: 75%; vertical-align: top; padding: 10px;">
                    <table class="box-table" width="100%" style="font-size: 12px; font-weight: bold;">
                        <tr><td width="70">INVOICE #</td><td width="10">:</td><td>{{ $invoice->invoice_no }}</td><td align="right">{{ \Carbon\Carbon::parse($invoice->date)->format('d-M-Y') }}</td></tr>
                        <tr><td>BOOKED BY</td><td>:</td><td colspan="2">{{ strtoupper($invoice->salesman?->name ?? 'ADMIN') }}</td></tr>
                        <tr><td>SUPPLY MAN</td><td>:</td><td colspan="2">{{ strtoupper($invoice->deliveryMan?->name ?? 'SELF / DIRECT') }}</td></tr>
                        <tr><td>PAYMENT</td><td>:</td><td colspan="2">{{ strtoupper($invoice->payment_type) }}</td></tr>
                        <tr><td>STATUS</td><td>:</td><td colspan="2">{{ $invoice->balance <= 0 ? 'PAID' : 'PENDING' }}</td></tr>
                    </table>
                </div>
            </div>
        </td>
    </tr>
</table>

<table class="items">
    <thead>
        <tr>
            <th width="5%" style="text-align: center; border-right: 1px solid #1e3a8a;">S#</th>
            <th width="50%" style="text-align: left; border-right: 1px solid #1e3a8a;">PRODUCTS DESCRIPTION</th>
            <th width="15%" style="text-align: center; border-right: 1px solid #1e3a8a;">QTY</th>
            <th width="15%" style="text-align: right; border-right: 1px solid #1e3a8a;">RATE</th>
            <th width="15%" style="text-align: right;">AMOUNT</th>
        </tr>
    </thead>
    <tbody>
        @foreach($invoice->items as $index=>$item)
        <tr>
            <td style="text-align: center;">{{ $index+1 }}</td>
            <td style="font-weight: bold;">
                {{ strtoupper($item->product->name) }} 
                {{ $item->variant_name ? '- ' . strtoupper($item->variant_name) : '' }}
            </td>
            <td style="text-align: center;">{{ number_format($item->qty, 2) }}</td>
            <td style="text-align: right;">{{ number_format($item->unit_price, 2) }}</td>
            <td style="text-align: right;">{{ number_format($item->total, 2) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<table width="100%" style="margin-top: 10px; border: none;">
    <tr>
        <td width="60%" style="vertical-align: top; border: none; padding-right: 20px;">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 10px;">
                # OF ITEMS: {{ count($invoice->items) }}
            </div>
            
            <div style="font-size: 11px; color: #333; line-height: 1.5; font-weight: bold;">
                {{ $amountInWords }}
            </div>
        </td>
        
        <td width="40%" style="vertical-align: top; border: none;">
            <table class="footer-totals" width="100%" style="border: none;">
                <tr>
                    <td style="border: none;">INVOICE TOTAL</td>
                    <td class="value" style="border: none;">{{ number_format($invoice->subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td style="border: none;">CHARGES</td>
                    <td class="value" style="border: none;">0.00</td>
                </tr>
                <tr>
                    <td style="border: none;">DISCOUNT</td>
                    <td class="value" style="border: none;">{{ number_format($invoice->discount, 2) }}</td>
                </tr>
                <tr>
                    <td style="border: none;">ADV. TAX</td>
                    <td class="value" style="border: none;">0.00</td>
                </tr>
                <tr>
                    <td style="border: none; padding-top: 10px; padding-bottom: 10px;">NET TOTAL</td>
                    <td style="border: none; text-align: right; padding-top: 10px; padding-bottom: 10px;">
                        <div style="border: 1px solid #000; padding: 6px 10px; display: inline-block; color: #000; min-width: 80px;">
                            {{ number_format($invoice->total, 2) }}
                        </div>
                    </td>
                </tr>
                @if($invoice->payment_type === 'split')
                <tr>
                    <td style="border: none;">CASH RECEIVED</td>
                    <td class="value" style="border: none;">{{ number_format($invoice->cash_paid ?? 0, 2) }}</td>
                </tr>
                <tr>
                    <td style="border: none;">ONLINE ({{ strtoupper($invoice->online_method ?? 'ONLINE') }})</td>
                    <td class="value" style="border: none;">{{ number_format($invoice->online_paid ?? 0, 2) }}</td>
                </tr>
                <tr>
                    <td style="border: none; font-weight: bold;">TOTAL RECEIVED</td>
                    <td class="value" style="border: none; font-weight: bold;">{{ number_format($invoice->paid, 2) }}</td>
                </tr>
                @else
                <tr>
                    <td style="border: none;">RECEIVED ({{ strtoupper($invoice->payment_type) }})</td>
                    <td class="value" style="border: none;">{{ number_format($invoice->paid, 2) }}</td>
                </tr>
                @endif
                @if($invoice->balance > 0)
                <tr>
                    <td style="border: none; color: #b91c1c; font-weight: bold;">THIS BILL UDHAR</td>
                    <td class="value" style="border: none; color: #b91c1c; font-weight: bold;">{{ number_format($invoice->balance, 2) }}</td>
                </tr>
                @endif
                @if(($company?->show_previous_balance ?? true) && $invoice->customer)
                @php
                    $prevUdhar = max(0, floatval($invoice->customer->balance) - floatval($invoice->balance));
                @endphp
                @if($prevUdhar > 0)
                <tr>
                    <td style="border: none; font-size: 11px; color: #475569;">PREVIOUS UDHAR</td>
                    <td class="value" style="border: none; font-size: 11px; color: #475569;">{{ number_format($prevUdhar, 2) }}</td>
                </tr>
                <tr>
                    <td style="border: none; font-size: 11px; font-weight: bold; color: #b91c1c;">TOTAL NET BALANCE</td>
                    <td class="value" style="border: none; font-size: 11px; font-weight: bold; color: #b91c1c;">{{ number_format($invoice->customer->balance, 2) }}</td>
                </tr>
                @endif
                @endif
            </table>
        </td>
    </tr>
</table>

@if($company?->terms)
<div style="font-size: 10px; margin-top: 15px; border-top: 1px dotted #ccc; padding-top: 6px; color: #475569;">
    <strong>TERMS & CONDITIONS:</strong> {!! nl2br(e($company->terms)) !!}
</div>
@endif

@if($company?->show_signatures ?? true)
<table width="100%" style="margin-top: 35px; border: none; text-align: center; font-size: 10px; font-weight: bold;">
    <tr>
        <td width="28%" style="border-top: 1px dashed #000; padding-top: 5px;">CUSTOMER SIGNATURE</td>
        <td width="8%"></td>
        <td width="28%" style="border-top: 1px dashed #000; padding-top: 5px;">DELIVERY BOY SIGN</td>
        <td width="8%"></td>
        <td width="28%" style="border-top: 1px dashed #000; padding-top: 5px;">AUTHORIZED SIGNATURE</td>
    </tr>
</table>
@endif

@if($company?->footer_text)
<div style="text-align: center; font-size: 11px; margin-top: 15px; font-weight: bold; color: #1e3a8a;">
    {{ $company->footer_text }}
</div>
@endif

<div style="text-align: center; font-size: 9px; color: #64748b; margin-top: 25px; padding-top: 6px; border-top: 1px dotted #ccc;">
    Software Create by StackNova-Tech: +923-373375526
</div>

</body>
</html>
