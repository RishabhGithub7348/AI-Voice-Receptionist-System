import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { customerPhone, customerName } = await request.json();

    if (!customerPhone) {
      return NextResponse.json(
        { error: 'Customer phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[\d\s\(\)\-]{10,}$/;
    if (!phoneRegex.test(customerPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // In a real application, you might:
    // 1. Create or update customer record in database
    // 2. Create a call session record
    // 3. Log the session start
    // 4. Send notifications to supervisors

    const sessionId = Math.random().toString(36).slice(7);
    const sessionData = {
      sessionId,
      customerPhone,
      customerName: customerName || 'Anonymous Customer',
      startTime: new Date().toISOString(),
      status: 'active'
    };

    // For now, just return the session data
    return NextResponse.json({
      success: true,
      session: sessionData,
      message: 'Customer session created successfully'
    });

  } catch (error) {
    console.error('Customer session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const customerPhone = searchParams.get('customerPhone');

    if (!sessionId && !customerPhone) {
      return NextResponse.json(
        { error: 'Session ID or customer phone is required' },
        { status: 400 }
      );
    }

    // In a real application, you would query the database
    // For now, return mock data
    const sessionData = {
      sessionId: sessionId || 'mock-session',
      customerPhone: customerPhone || '+1 (555) 123-4567',
      customerName: 'Mock Customer',
      startTime: new Date().toISOString(),
      status: 'active',
      callDuration: Math.floor(Math.random() * 300), // Mock duration in seconds
    };

    return NextResponse.json({
      success: true,
      session: sessionData
    });

  } catch (error) {
    console.error('Customer session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer session' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, status, endTime } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // In a real application, you would update the session in the database
    const updatedSession = {
      sessionId,
      status: status || 'ended',
      endTime: endTime || new Date().toISOString(),
      updated: true
    };

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: 'Customer session updated successfully'
    });

  } catch (error) {
    console.error('Customer session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update customer session' },
      { status: 500 }
    );
  }
}