@php
    $u = $r->user;
    $type = $r->documentType;
    $issued = ($r->approved_at ?? now());
    $validUntil = $issued->copy()->addMonths((int) config('barangay.validity_months'));
    $age = $u->birthdate ? $u->birthdate->age : null;
    $addr = trim($u->address . ($u->purok ? ', ' . $u->purok : '') . ', Barangay ' . config('barangay.name'));
    $details = $r->purpose_details;
    $purpose = strtolower($r->purpose) . ($details && $r->purpose !== 'Others' ? ' (' . $details . ')' : '');
    if ($r->purpose === 'Others' && $details) { $purpose = $details; }
@endphp
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page { margin: 36px 48px; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; line-height: 1.6; }
    .center { text-align: center; }
    .hdr { border-bottom: 3px double #1f4d3a; padding-bottom: 8px; margin-bottom: 18px; }
    .hdr div { line-height: 1.35; }
    .brgy { font-size: 20px; font-weight: bold; color: #1f4d3a; letter-spacing: 1px; }
    .office { font-size: 11px; font-weight: bold; margin-top: 4px; }
    h1 { text-align: center; font-size: 17px; letter-spacing: 2px; margin: 22px 0 18px; text-transform: uppercase; }
    p { margin: 0 0 12px; text-align: justify; text-indent: 36px; }
    p.plain { text-indent: 0; }
    .name { font-weight: bold; text-transform: uppercase; }
    .sign { width: 100%; margin-top: 56px; }
    .sign td { width: 50%; vertical-align: top; font-size: 11px; }
    .line { border-top: 1px solid #111; margin-top: 34px; padding-top: 3px; font-weight: bold; text-align: center; }
    .small { font-size: 10px; color: #444; }
    .meta { margin-top: 36px; border-top: 1px solid #999; padding-top: 6px; font-size: 10px; color: #444; }
    .card { border: 2px solid #1f4d3a; padding: 14px 18px; width: 380px; margin: 10px auto; }
    .card td { padding: 2px 0; font-size: 12px; }
    .card .k { color: #555; width: 110px; }
    .photo { border: 1px solid #777; width: 90px; height: 110px; text-align: center; font-size: 9px; color: #777; }
</style>
</head>
<body>
<div class="hdr center">
    <div>Republic of the Philippines</div>
    <div>Province of {{ config('barangay.province') }}</div>
    <div>{{ config('barangay.municipality') }}</div>
    <div class="brgy">BARANGAY {{ strtoupper(config('barangay.name')) }}</div>
    <div class="office">OFFICE OF THE PUNONG BARANGAY</div>
    @if(config('barangay.contact'))<div class="small">{{ config('barangay.address') }} | {{ config('barangay.contact') }}</div>@endif
</div>

<h1>{{ $type->name }}</h1>

@switch($type->template)
    @case('clearance')
        <p class="plain"><b>TO WHOM IT MAY CONCERN:</b></p>
        <p>This is to certify that <span class="name">{{ $u->name }}</span>@if($age), {{ $age }} years old,@endif {{ strtolower($u->civil_status ?? '') }}, is a bonafide resident of {{ $addr }}, and that based on the records of this office, has no derogatory record on file as of the date of issuance.</p>
        <p>This clearance is issued upon the request of the above-named person for <b>{{ $purpose }}</b> purposes.</p>
        @break
    @case('residency')
        <p class="plain"><b>TO WHOM IT MAY CONCERN:</b></p>
        <p>This is to certify that <span class="name">{{ $u->name }}</span>@if($age), {{ $age }} years old,@endif {{ strtolower($u->civil_status ?? '') }}, is a bonafide resident of {{ $addr }}.</p>
        <p>This certification is issued upon the request of the above-named person for <b>{{ $purpose }}</b> purposes.</p>
        @break
    @case('indigency')
        <p class="plain"><b>TO WHOM IT MAY CONCERN:</b></p>
        <p>This is to certify that <span class="name">{{ $u->name }}</span>@if($age), {{ $age }} years old,@endif {{ strtolower($u->civil_status ?? '') }}, a resident of {{ $addr }}, belongs to an indigent family in this barangay.</p>
        <p>This certification is issued upon the request of the above-named person for <b>{{ $purpose }}</b> purposes.</p>
        @break
    @case('good_moral')
        <p class="plain"><b>TO WHOM IT MAY CONCERN:</b></p>
        <p>This is to certify that <span class="name">{{ $u->name }}</span>@if($age), {{ $age }} years old,@endif {{ strtolower($u->civil_status ?? '') }}, a resident of {{ $addr }}, is known to this office to be a person of good moral character and a law-abiding member of the community.</p>
        <p>This certification is issued upon the request of the above-named person for <b>{{ $purpose }}</b> purposes.</p>
        @break
    @case('business')
        <p class="plain"><b>TO WHOM IT MAY CONCERN:</b></p>
        <p>This is to certify that <span class="name">{{ $u->name }}</span>, a resident of {{ $addr }}, has applied for barangay clearance for the following business: <b>{{ $details }}</b>.</p>
        <p>Having complied with the requirements of this office, the applicant is hereby granted clearance to operate the said business within Barangay {{ config('barangay.name') }}, subject to existing laws, ordinances and regulations. This clearance is issued for <b>{{ strtolower($r->purpose) }}</b> purposes.</p>
        @break
    @case('barangay_id')
        <p class="plain center">Barangay Identification Record</p>
        <table class="card">
            <tr><td class="k">ID / Ref. No.</td><td><b>{{ $r->reference_no }}</b></td><td rowspan="5"><div class="photo"><br><br>1x1<br>PHOTO</div></td></tr>
            <tr><td class="k">Name</td><td><b>{{ strtoupper($u->name) }}</b></td></tr>
            <tr><td class="k">Address</td><td>{{ $addr }}</td></tr>
            <tr><td class="k">Birthdate</td><td>{{ $u->birthdate?->format('F d, Y') }}</td></tr>
            <tr><td class="k">Civil status</td><td>{{ $u->civil_status }}</td></tr>
        </table>
        <p class="plain center small">Presented to the holder upon release of the printed Barangay ID.</p>
        @break
    @default
        <p class="plain"><b>TO WHOM IT MAY CONCERN:</b></p>
        <p>This is to certify that <span class="name">{{ $u->name }}</span>@if($age), {{ $age }} years old,@endif {{ strtolower($u->civil_status ?? '') }}, is a resident of {{ $addr }}.</p>
        <p>This certification is issued upon the request of the above-named person for <b>{{ $purpose }}</b> purposes.</p>
@endswitch

<p class="plain">Issued this {{ $issued->format('jS') }} day of {{ $issued->format('F, Y') }} at the Barangay Hall of {{ config('barangay.name') }}.</p>

<table class="sign">
    <tr>
        <td>
            Processed by:
            <div class="line">{{ $r->reviewer?->name ?? config('barangay.secretary_name') }}</div>
            <div class="center small">Barangay Staff</div>
        </td>
        <td>
            Approved by:
            <div class="line">{{ strtoupper($captain) }}</div>
            <div class="center small">Punong Barangay</div>
        </td>
    </tr>
</table>

<div class="meta">
    Reference No.: <b>{{ $r->reference_no }}</b> &nbsp;|&nbsp;
    Date issued: {{ $issued->format('M d, Y') }} &nbsp;|&nbsp;
    Valid until: {{ $validUntil->format('M d, Y') }}
    @if($r->fee_amount > 0) &nbsp;|&nbsp; Fee: PHP {{ number_format($r->fee_amount, 2) }}@if($r->or_number) (OR No. {{ $r->or_number }})@endif @endif
    <br>Not valid without the official dry seal of the barangay.
</div>
</body>
</html>
