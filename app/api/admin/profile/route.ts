import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET() {
  const profile = await prisma.profile.findFirst()
  return NextResponse.json(profile)
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const data = await request.json()
  const profile = await prisma.profile.findFirst()

  if (profile) {
    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data,
    })
    return NextResponse.json(updated)
  } else {
    const created = await prisma.profile.create({ data })
    return NextResponse.json(created)
  }
}