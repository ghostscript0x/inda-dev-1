import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromToken } from './auth'

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await getAdminFromToken(token)
  if (!admin) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  return admin
}