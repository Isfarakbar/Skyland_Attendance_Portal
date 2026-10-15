import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select('-password');
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        designation: user.designation,
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || '',
        bio: user.bio || '',
        emergencyContact: user.emergencyContact || '',
        emergencyRelation: user.emergencyRelation || 'Family',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || 'Unspecified',
        cnic: user.cnic || '',
        shiftTiming: user.shiftTiming || '09:00 AM - 06:00 PM',
        reportingManager: user.reportingManager || 'Department Lead',
        employmentType: user.employmentType || 'Full-time Permanent',
        bankName: user.bankName || 'Standard Chartered',
        accountNumber: user.accountNumber || '',
        iban: user.iban || '',
        devices: user.devices && user.devices.length > 0 ? user.devices : [
          {
            name: 'MacBook Air',
            model: 'Version M1',
            serialNumber: 'SKY-MBP-8921',
            assignedDate: '2024-01-15',
            status: 'Active',
          },
        ],
        pensionFund: user.pensionFund || {
          enrolled: true,
          contributionPercent: 8,
          monthlyAmount: Math.round((user.baseSalary || 30000) * 0.08),
        },
        baseSalary: user.baseSalary || 30000,
        workMode: user.workMode || 'OFFICE',
        leaveBalance: user.leaveBalance || { sick: 8, casual: 10, annual: 14 },
        joinDate: user.joinDate,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user session';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      phone,
      avatarUrl,
      bio,
      emergencyContact,
      emergencyRelation,
      address,
      dateOfBirth,
      gender,
      cnic,
      bankName,
      accountNumber,
      iban,
      devices,
      pensionFund,
      department,
      designation,
      shiftTiming,
      reportingManager,
      employmentType,
      workMode,
      baseSalary,
    } = body;

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ success: false, error: 'Name cannot be empty' }, { status: 400 });
    }

    await connectToDatabase();

    const updateFields: Record<string, unknown> = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl.trim();
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (emergencyContact !== undefined) updateFields.emergencyContact = emergencyContact.trim();
    if (emergencyRelation !== undefined) updateFields.emergencyRelation = emergencyRelation.trim();
    if (address !== undefined) updateFields.address = address.trim();
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth.trim();
    if (gender !== undefined) updateFields.gender = gender.trim();
    if (cnic !== undefined) updateFields.cnic = cnic.trim();
    if (bankName !== undefined) updateFields.bankName = bankName.trim();
    if (accountNumber !== undefined) updateFields.accountNumber = accountNumber.trim();
    if (iban !== undefined) updateFields.iban = iban.trim();
    if (devices !== undefined) updateFields.devices = devices;
    if (pensionFund !== undefined) updateFields.pensionFund = pensionFund;
    if (department !== undefined) updateFields.department = department.trim();
    if (designation !== undefined) updateFields.designation = designation.trim();
    if (shiftTiming !== undefined) updateFields.shiftTiming = shiftTiming.trim();
    if (reportingManager !== undefined) updateFields.reportingManager = reportingManager.trim();
    if (employmentType !== undefined) updateFields.employmentType = employmentType.trim();
    if (workMode !== undefined) updateFields.workMode = workMode;
    if (baseSalary !== undefined && !isNaN(Number(baseSalary))) updateFields.baseSalary = Number(baseSalary);

    const updatedUser = await User.findByIdAndUpdate(
      session.userId,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        employeeId: updatedUser.employeeId,
        department: updatedUser.department,
        designation: updatedUser.designation,
        phone: updatedUser.phone || '',
        avatarUrl: updatedUser.avatarUrl || '',
        bio: updatedUser.bio || '',
        emergencyContact: updatedUser.emergencyContact || '',
        emergencyRelation: updatedUser.emergencyRelation || 'Family',
        address: updatedUser.address || '',
        dateOfBirth: updatedUser.dateOfBirth || '',
        gender: updatedUser.gender || 'Unspecified',
        cnic: updatedUser.cnic || '',
        shiftTiming: updatedUser.shiftTiming || '09:00 AM - 06:00 PM',
        reportingManager: updatedUser.reportingManager || 'Department Lead',
        employmentType: updatedUser.employmentType || 'Full-time Permanent',
        bankName: updatedUser.bankName || 'Standard Chartered',
        accountNumber: updatedUser.accountNumber || '',
        iban: updatedUser.iban || '',
        devices: updatedUser.devices,
        pensionFund: updatedUser.pensionFund,
        baseSalary: updatedUser.baseSalary,
        workMode: updatedUser.workMode,
        leaveBalance: updatedUser.leaveBalance,
        joinDate: updatedUser.joinDate,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
