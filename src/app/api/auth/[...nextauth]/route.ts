// src/app/api/auth/[...nextauth]/route.ts
import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json(await auth());
}

export async function POST(request: Request) {
  return NextResponse.json(await auth());
}