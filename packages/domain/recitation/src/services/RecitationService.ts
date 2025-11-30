import { IRecitationRepository, IStorageService, IQueueService } from '../ports';
import { Recitation, CreateRecitationData } from '../models';
import { ValidationError, NotFoundError, ForbiddenError } from '@tilawa/utils';
import { isValidSurahNumber, isValidVerseRange } from '@tilawa/utils';
import { RecitationStatus } from '@tilawa/types';

export class RecitationService {
  constructor(
    private recitationRepository: IRecitationRepository,
    private storageService: IStorageService,
    private queueService: IQueueService
  ) {}

  async createDraft(data: CreateRecitationData): Promise<Recitation> {
    // Validate surah and verses
    if (!isValidSurahNumber(data.surah)) {
      throw new ValidationError('Invalid surah number (must be 1-114)');
    }

    if (!isValidVerseRange(data.verses)) {
      throw new ValidationError('Invalid verse range format');
    }

    // Create recitation in DRAFT status
    const recitation = await this.recitationRepository.create({
      ...data,
      language: data.language || 'ar',
    });

    return recitation;
  }

  async uploadAudio(recitationId: string, userId: string, audioFile: Buffer): Promise<Recitation> {
    // Get recitation
    const recitation = await this.recitationRepository.findById(recitationId);
    if (!recitation) {
      throw new NotFoundError('Recitation not found');
    }

    // Check ownership
    if (recitation.userId !== userId) {
      throw new ForbiddenError('You can only upload audio to your own recitations');
    }

    // Check status
    if (recitation.status !== RecitationStatus.DRAFT) {
      throw new ValidationError('Can only upload audio to draft recitations');
    }

    // Upload to storage
    const filename = `${recitationId}-${Date.now()}.mp3`;
    const audioUrl = await this.storageService.uploadAudio(audioFile, filename);

    // Update recitation
    const updated = await this.recitationRepository.update(recitationId, {
      audioUrl,
      status: RecitationStatus.UPLOADED,
    });

    // Send to audio processing queue
    await this.queueService.addJob('audio-process', 'process-audio', {
      recitationId: updated.id,
      audioUrl: updated.audioUrl,
      metadata: {
        surah: updated.surah,
        verses: updated.verses,
      },
    });

    return updated;
  }

  async getRecitationById(id: string): Promise<Recitation> {
    const recitation = await this.recitationRepository.findById(id);
    if (!recitation) {
      throw new NotFoundError('Recitation not found');
    }
    return recitation;
  }

  async getUserRecitations(userId: string): Promise<Recitation[]> {
    return this.recitationRepository.findByUserId(userId);
  }

  async updateRecitationStatus(id: string, status: RecitationStatus, additionalData?: Partial<Recitation>): Promise<Recitation> {
    return this.recitationRepository.update(id, {
      status,
      ...additionalData,
    });
  }
}
