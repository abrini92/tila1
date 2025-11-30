import { processAudioAnalysis } from '../jobs/audio-analysis.job';
import { Job } from 'bullmq';

describe('Audio Worker', () => {
  describe('processAudioAnalysis', () => {
    it('should process audio analysis job successfully', async () => {
      const mockJob = {
        id: 'job-123',
        data: {
          recitationId: 'recitation-123',
          audioUrl: 'https://example.com/audio.mp3',
          metadata: {
            surah: '1',
            verses: '1-7',
          },
        },
        updateProgress: jest.fn(),
      } as unknown as Job;

      const result = await processAudioAnalysis(mockJob);

      expect(result).toMatchObject({
        recitationId: 'recitation-123',
        duration: expect.any(Number),
        quality: expect.stringMatching(/^(low|medium|high)$/),
        deepfakeScore: expect.any(Number),
        analysisCompleted: true,
      });

      expect(result.duration).toBeGreaterThan(0);
      expect(result.deepfakeScore).toBeGreaterThanOrEqual(0);
      expect(result.deepfakeScore).toBeLessThanOrEqual(1);
      expect(mockJob.updateProgress).toHaveBeenCalled();
    });

    it('should handle missing metadata gracefully', async () => {
      const mockJob = {
        id: 'job-456',
        data: {
          recitationId: 'recitation-456',
          audioUrl: 'https://example.com/audio2.mp3',
        },
        updateProgress: jest.fn(),
      } as unknown as Job;

      const result = await processAudioAnalysis(mockJob);

      expect(result).toMatchObject({
        recitationId: 'recitation-456',
        analysisCompleted: true,
      });
    });
  });
});
