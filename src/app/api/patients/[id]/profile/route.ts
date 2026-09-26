import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const patientId = resolvedParams.id;
    const body = await request.json();

    // Calculate updated profile completion score (File Status)
    let score = 20; // Baseline registration score
    if (body.bloodGroup && body.bloodGroup !== '--' && body.bloodGroup.trim() !== '') score += 15;
    if (body.address && body.address.trim() !== '') score += 15;
    if (body.emergencyContact && body.emergencyContact.trim() !== '') score += 15;
    if (body.maritalStatus && body.maritalStatus.trim() !== '') score += 15;
    if (body.occupation && body.occupation.trim() !== '') score += 10;
    if (body.allergies && body.allergies.trim() !== '' && body.allergies !== 'None') score += 10;

    const fileStatus = `${Math.min(100, score)}%`;

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      patientId,
      fileStatus,
      updatedProfile: {
        ...body,
        fileStatus,
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
