import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    const tokenPreview = process.env.BLOB_READ_WRITE_TOKEN 
      ? `${process.env.BLOB_READ_WRITE_TOKEN.substring(0, 10)}...` 
      : null;
    
    return NextResponse.json({
      hasToken,
      tokenPreview,
      message: hasToken 
        ? "BLOB_READ_WRITE_TOKEN is properly configured" 
        : "BLOB_READ_WRITE_TOKEN is not set. Please add it to your environment variables."
    });
  } catch (error) {
    console.error('Error checking blob config:', error);
    return NextResponse.json({ error: 'Failed to check configuration' }, { status: 500 });
  }
}