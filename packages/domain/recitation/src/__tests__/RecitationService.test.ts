import { RecitationService } from '../services/RecitationService';
import { IRecitationRepository, IStorageService, IQueueService } from '../ports';
import { Recitation } from '../models';
import { ValidationError, NotFoundError, ForbiddenError } from '@tilawa/utils';
import { RecitationStatus } from '@tilawa/types';

describe('RecitationService', () => {
  let recitationService: RecitationService;
  let mockRecitationRepository: jest.Mocked<IRecitationRepository>;
  let mockStorageService: jest.Mocked<IStorageService>;
  let mockQueueService: jest.Mocked<IQueueService>;

  beforeEach(() => {
    mockRecitationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockStorageService = {
      uploadAudio: jest.fn(),
      deleteAudio: jest.fn(),
    };

    mockQueueService = {
      addJob: jest.fn(),
    };

    recitationService = new RecitationService(
      mockRecitationRepository,
      mockStorageService,
      mockQueueService
    );
  });

  describe('createDraft', () => {
    it('should successfully create a draft recitation', async () => {
      const createData = {
        userId: 'user-123',
        title: 'Test Recitation',
        description: 'Test description',
        surah: '1',
        verses: '1-7',
        language: 'ar',
      };

      const mockRecitation: Recitation = {
        id: 'recitation-123',
        ...createData,
        audioUrl: undefined,
        duration: undefined,
        status: RecitationStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: undefined,
      };

      mockRecitationRepository.create.mockResolvedValue(mockRecitation);

      const result = await recitationService.createDraft(createData);

      expect(result).toEqual(mockRecitation);
      expect(mockRecitationRepository.create).toHaveBeenCalledWith(createData);
    });

    it('should throw ValidationError for invalid surah number', async () => {
      const createData = {
        userId: 'user-123',
        title: 'Test',
        surah: '115', // Invalid: max is 114
        verses: '1-7',
      };

      await expect(
        recitationService.createDraft(createData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid verse range', async () => {
      const createData = {
        userId: 'user-123',
        title: 'Test',
        surah: '1',
        verses: 'invalid-range',
      };

      await expect(
        recitationService.createDraft(createData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('uploadAudio', () => {
    it('should successfully upload audio and enqueue processing job', async () => {
      const recitationId = 'recitation-123';
      const userId = 'user-123';
      const audioFile = Buffer.from('mock-audio-data');

      const mockRecitation: Recitation = {
        id: recitationId,
        userId,
        title: 'Test',
        surah: '1',
        verses: '1-7',
        language: 'ar',
        status: RecitationStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedRecitation: Recitation = {
        ...mockRecitation,
        audioUrl: 'https://s3.example.com/audio.mp3',
        status: RecitationStatus.UPLOADED,
      };

      mockRecitationRepository.findById.mockResolvedValue(mockRecitation);
      mockStorageService.uploadAudio.mockResolvedValue('https://s3.example.com/audio.mp3');
      mockRecitationRepository.update.mockResolvedValue(updatedRecitation);
      mockQueueService.addJob.mockResolvedValue(undefined);

      const result = await recitationService.uploadAudio(recitationId, userId, audioFile);

      expect(result.status).toBe(RecitationStatus.UPLOADED);
      expect(result.audioUrl).toBe('https://s3.example.com/audio.mp3');
      expect(mockStorageService.uploadAudio).toHaveBeenCalled();
      expect(mockQueueService.addJob).toHaveBeenCalledWith(
        'audio-process',
        'process-audio',
        expect.objectContaining({
          recitationId,
          audioUrl: 'https://s3.example.com/audio.mp3',
        })
      );
    });

    it('should throw NotFoundError if recitation does not exist', async () => {
      mockRecitationRepository.findById.mockResolvedValue(null);

      await expect(
        recitationService.uploadAudio('non-existent', 'user-123', Buffer.from('data'))
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user is not the owner', async () => {
      const mockRecitation: Recitation = {
        id: 'recitation-123',
        userId: 'other-user',
        title: 'Test',
        surah: '1',
        verses: '1-7',
        language: 'ar',
        status: RecitationStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRecitationRepository.findById.mockResolvedValue(mockRecitation);

      await expect(
        recitationService.uploadAudio('recitation-123', 'user-123', Buffer.from('data'))
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ValidationError if recitation is not in DRAFT status', async () => {
      const mockRecitation: Recitation = {
        id: 'recitation-123',
        userId: 'user-123',
        title: 'Test',
        surah: '1',
        verses: '1-7',
        language: 'ar',
        status: RecitationStatus.APPROVED, // Not DRAFT
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRecitationRepository.findById.mockResolvedValue(mockRecitation);

      await expect(
        recitationService.uploadAudio('recitation-123', 'user-123', Buffer.from('data'))
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getRecitationById', () => {
    it('should return recitation if it exists', async () => {
      const mockRecitation: Recitation = {
        id: 'recitation-123',
        userId: 'user-123',
        title: 'Test',
        surah: '1',
        verses: '1-7',
        language: 'ar',
        status: RecitationStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRecitationRepository.findById.mockResolvedValue(mockRecitation);

      const result = await recitationService.getRecitationById('recitation-123');

      expect(result).toEqual(mockRecitation);
    });

    it('should throw NotFoundError if recitation does not exist', async () => {
      mockRecitationRepository.findById.mockResolvedValue(null);

      await expect(
        recitationService.getRecitationById('non-existent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateRecitationStatus', () => {
    it('should update recitation status', async () => {
      const updatedRecitation: Recitation = {
        id: 'recitation-123',
        userId: 'user-123',
        title: 'Test',
        surah: '1',
        verses: '1-7',
        language: 'ar',
        status: RecitationStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRecitationRepository.update.mockResolvedValue(updatedRecitation);

      const result = await recitationService.updateRecitationStatus(
        'recitation-123',
        RecitationStatus.APPROVED
      );

      expect(result.status).toBe(RecitationStatus.APPROVED);
      expect(mockRecitationRepository.update).toHaveBeenCalledWith(
        'recitation-123',
        { status: RecitationStatus.APPROVED }
      );
    });
  });
});
