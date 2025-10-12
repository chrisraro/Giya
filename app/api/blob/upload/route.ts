// @ts-ignore
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { path, contentType } = await request.json();
    
    if (!path || !contentType) {
      return NextResponse.json({ error: 'Path and contentType are required' }, { status: 400 });
    }
    
    // Generate a signed URL for uploading
    const blob = await put(path, '', {
      access: 'public',
      contentType,
    });
    
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}