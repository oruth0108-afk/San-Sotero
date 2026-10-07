<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page { margin: 28px 32px; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #111; }
    h2 { margin: 0; font-size: 14px; color: #1f4d3a; }
    .sub { color: #555; margin: 2px 0 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1f4d3a; color: #fff; text-align: left; padding: 4px 5px; }
    td { padding: 4px 5px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) td { background: #f5f7f6; }
</style>
</head>
<body>
<h2>Barangay {{ config('barangay.name') }} - Document Requests</h2>
<div class="sub">Generated {{ now()->format('M d, Y h:i A') }} by {{ $generatedBy }} | {{ $rows->count() }} record(s)</div>
<table>
    <thead><tr><th>Reference</th><th>Resident</th><th>Document</th><th>Purpose</th><th>Status</th><th>Fee</th><th>Pickup</th><th>Submitted</th></tr></thead>
    <tbody>
    @foreach($rows as $row)
        <tr>
            <td>{{ $row->reference_no }}</td>
            <td>{{ $row->user?->name }}</td>
            <td>{{ $row->documentType?->name }}</td>
            <td>{{ $row->purpose }}</td>
            <td>{{ ucwords(str_replace('_', ' ', $row->status)) }}</td>
            <td>{{ number_format($row->fee_amount, 2) }}{{ $row->is_paid ? ' (paid)' : '' }}</td>
            <td>{{ $row->pickup_date?->format('M d, Y') }}</td>
            <td>{{ $row->created_at->format('M d, Y') }}</td>
        </tr>
    @endforeach
    </tbody>
</table>
</body>
</html>
