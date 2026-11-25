
import pako from 'pako';

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  savedBytes: number;
  savedPercentage: number;
}

class CompressionService {
  compressData(data: Uint8Array): Uint8Array {
    try {
      const compressed = pako.deflate(data, { level: 9 });
      console.log(`✅ Compressed: ${data.length} bytes → ${compressed.length} bytes`);
      return compressed;
    } catch (error) {
      console.error('Compression error:', error);
      throw new Error('Failed to compress data');
    }
  }

  decompressData(compressedData: Uint8Array): Uint8Array {
    try {
      const decompressed = pako.inflate(compressedData);
      console.log(`✅ Decompressed: ${compressedData.length} bytes → ${decompressed.length} bytes`);
      return decompressed;
    } catch (error) {
      console.error('Decompression error:', error);
      throw new Error('Failed to decompress data');
    }
  }

  async compressFile(file: File): Promise<{ compressed: Uint8Array; stats: CompressionStats }> {
    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      const compressed = this.compressData(uint8Array);

      const stats: CompressionStats = {
        originalSize: uint8Array.length,
        compressedSize: compressed.length,
        compressionRatio: (compressed.length / uint8Array.length) * 100,
        savedBytes: uint8Array.length - compressed.length,
        savedPercentage: 100 - (compressed.length / uint8Array.length) * 100,
      };

      console.log(`📊 Compression Stats:`, stats);

      return { compressed, stats };
    } catch (error) {
      console.error('File compression error:', error);
      throw error;
    }
  }

  compressedToBase64(compressedData: Uint8Array): string {
    const binary = String.fromCharCode.apply(null, Array.from(compressedData));
    return btoa(binary);
  }

  base64ToCompressed(base64String: string): Uint8Array {
    const binary = atob(base64String);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatFileSize(sizeInBytes: number): string {
    return this.formatBytes(sizeInBytes);
  }
}

export default new CompressionService();
