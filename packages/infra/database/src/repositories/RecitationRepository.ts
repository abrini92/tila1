import { IRecitationRepository, Recitation, CreateRecitationData, UpdateRecitationData } from '@tilawa/domain-recitation';
import { prisma } from '../client';

export class RecitationRepository implements IRecitationRepository {
  async create(data: CreateRecitationData): Promise<Recitation> {
    const recitation = await prisma.recitation.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        surah: data.surah,
        verses: data.verses,
        language: data.language || 'ar',
        status: 'DRAFT',
      },
    });
    return recitation as Recitation;
  }

  async findById(id: string): Promise<Recitation | null> {
    const recitation = await prisma.recitation.findUnique({
      where: { id },
    });
    return recitation as Recitation | null;
  }

  async findByUserId(userId: string): Promise<Recitation[]> {
    const recitations = await prisma.recitation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return recitations as Recitation[];
  }

  async update(id: string, data: UpdateRecitationData): Promise<Recitation> {
    const recitation = await prisma.recitation.update({
      where: { id },
      data,
    });
    return recitation as Recitation;
  }

  async delete(id: string): Promise<void> {
    await prisma.recitation.delete({
      where: { id },
    });
  }
}
