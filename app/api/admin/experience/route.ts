import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET() {
  const experience = await prisma.experience.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(experience)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const data = await request.json()
  const experience = await prisma.experience.create({ data })
  return NextResponse.json(experience)
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id, ...data } = await request.json()
  const experience = await prisma.experience.update({
    where: { id },
    data,
  })
  return NextResponse.json(experience)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await request.json()
  await prisma.experience.delete({ where: { id } })
  return NextResponse.json({ success: true })
}