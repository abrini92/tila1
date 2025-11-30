import { prisma } from '../client';

export interface CreateAudioAnalysisData {
  recitationId: string;
  duration: number;
  quality: string;
  deepfakeScore: number;
}

export class AudioAnalysisRepository {
  async create(data: CreateAudioAnalysisData) {
    return prisma.audioAnalysis.create({
      data,
    });
  }

  async findByRecitationId(recitationId: string) {
    return prisma.audioAnalysis.findUnique({
      where: { recitationId },
    });
  }

  async update(recitationId: string, data: Partial<CreateAudioAnalysisData>) {
    return prisma.audioAnalysis.update({
      where: { recitationId },
      data,
    });
  }
}
