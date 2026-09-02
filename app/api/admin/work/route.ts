import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET() {
  const work = await prisma.work.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(work)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const data = await request.json()
  const work = await prisma.work.create({ data })
  return NextResponse.json(work)
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id, ...data } = await request.json()
  const work = await prisma.work.update({
    where: { id },
    data,
  })
  return NextResponse.json(work)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await request.json()
  await prisma.work.delete({ where: { id } })
  return NextResponse.json({ success: true })
}