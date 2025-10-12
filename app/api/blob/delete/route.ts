// @ts-ignore
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }
    
    // Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    await del(path, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blob:', error);
    return NextResponse.json({ error: 'Failed to delete blob' }, { status: 500 });
  }
}