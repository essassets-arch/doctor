import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, autoPopulateFromConsultation, doctorName = 'Dr. Arvind Shah', consultationFee = 500 } = body;

    const invoiceNumber = `INV-2026-${String(Math.floor(Math.random() * 900) + 94).padStart(4, '0')}`;

    const items = [
      {
        id: 'b-cons',
        name: `1. Standard Consultation Fee (${doctorName})`,
        unitPrice: consultationFee,
        quantity: 1,
        discount: 0,
        total: consultationFee,
      }
    ];

    const grossAmount = items.reduce((s, i) => s + i.total, 0);
    const netAmount = grossAmount;
    const balance = netAmount;

    return NextResponse.json({
      success: true,
      message: 'Bill auto-generated from consultation data',
      caseId,
      invoiceNumber,
      items,
      grossAmount,
      netAmount,
      balance,
      doctorFee: consultationFee,
      doctorName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to auto-generate bill' },
      { status: 500 }
    );
  }
}
