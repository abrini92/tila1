import { IStorageService } from '@tilawa/domain-recitation';

// Mock implementation for now
export class StorageService implements IStorageService {
  async uploadAudio(file: Buffer, filename: string): Promise<string> {
    // In production, this would upload to S3
    // For now, return a mock URL
    const mockUrl = `https://tilawa-storage.s3.amazonaws.com/recitations/${filename}`;
    console.log(`[Storage] Mock upload: ${filename} -> ${mockUrl}`);
    return mockUrl;
  }

  async deleteAudio(url: string): Promise<void> {
    console.log(`[Storage] Mock delete: ${url}`);
  }
}
