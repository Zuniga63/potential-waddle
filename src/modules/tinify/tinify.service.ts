import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config';
import * as tinify from 'tinify';
import { CompressionStateDto } from './dtos/compression-state.dto';

@Injectable()
export class TinifyService implements OnModuleInit {
  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {}

  private logger = new Logger(TinifyService.name);

  async onModuleInit() {
    const apiKey = this.configService.get('tinify.apiKey', { infer: true });

    if (!apiKey) {
      this.logger.warn('Tinify API key is not set');
      return;
    }

    (tinify as any).key = apiKey;
  }

  async compressImageFromUrl(imageUrl: string) {
    const source = tinify.fromUrl(imageUrl);
    const compressed = await source.toBuffer();
    return compressed;
  }

  async compressImageFromBuffer(imageBuffer: Buffer): Promise<Buffer> {
    const isEnabled = this.configService.get('tinify.enabled', { infer: true });
    if (!isEnabled) return imageBuffer;

    const source = tinify.fromBuffer(imageBuffer);
    const converted = source.convert({ type: ['image/webp', 'image/jpeg'] });
    const compressed = await converted.toBuffer();
    return Buffer.from(compressed);
  }

  async getCompresionCount(): Promise<CompressionStateDto> {
    const count = tinify.compressionCount || 0;

    return {
      currentCompressions: count,
      maxCompressions: 500,
      remainingCompressions: 500 - count,
    };
  }
}
