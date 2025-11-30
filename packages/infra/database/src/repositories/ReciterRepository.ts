import { IReciterRepository, Reciter, CreateReciterData, UpdateReciterData } from '@tilawa/domain-reciter';
import { prisma } from '../client';

export class ReciterRepository implements IReciterRepository {
  async create(data: CreateReciterData): Promise<Reciter> {
    const reciter = await prisma.reciter.create({
      data,
    });
    return reciter as Reciter;
  }

  async findById(id: string): Promise<Reciter | null> {
    const reciter = await prisma.reciter.findUnique({
      where: { id },
    });
    return reciter as Reciter | null;
  }

  async findByUserId(userId: string): Promise<Reciter | null> {
    const reciter = await prisma.reciter.findUnique({
      where: { userId },
    });
    return reciter as Reciter | null;
  }

  async update(id: string, data: UpdateReciterData): Promise<Reciter> {
    const reciter = await prisma.reciter.update({
      where: { id },
      data,
    });
    return reciter as Reciter;
  }

  async incrementStats(
    id: string,
    field: 'totalRecitations' | 'totalLikes' | 'totalFollowers'
  ): Promise<void> {
    await prisma.reciter.update({
      where: { id },
      data: {
        [field]: {
          increment: 1,
        },
      },
    });
  }
}
