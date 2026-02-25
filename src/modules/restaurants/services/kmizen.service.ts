import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { EnvironmentVariables } from 'src/config/app-config';
import * as FormData from 'form-data';

const SMALL_FILE_THRESHOLD = 4 * 1024 * 1024; // 4MB

@Injectable()
export class KmizenService {
  private readonly logger = new Logger(KmizenService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    const kmizen = this.configService.get('kmizen', { infer: true });
    this.apiKey = kmizen?.apiKey || '';
    this.baseUrl = kmizen?.baseUrl || '';
  }

  async processMenuFile(file: Express.Multer.File) {
    this.logger.log(`Processing menu file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);

    if (file.size > SMALL_FILE_THRESHOLD) {
      return this.processLargeFile(file);
    }

    return this.processSmallFile(file);
  }

  /**
   * Archivos < 4MB: un solo request con multipart/form-data
   */
  private async processSmallFile(file: Express.Multer.File) {
    this.logger.log('Using single-request flow (small file)');

    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    form.append('save', 'true');

    const { data } = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/api/public/extract/auto`,
        form,
        {
          headers: {
            'X-API-Key': this.apiKey,
            ...form.getHeaders(),
          },
          timeout: 120000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      ),
    );

    this.logger.log('Menu data extracted successfully (small file)');
    return { data, fileUrl: null };
  }

  /**
   * Archivos > 4MB: 3 requests (signed URL → upload → extract)
   */
  private async processLargeFile(file: Express.Multer.File) {
    this.logger.log('Using signed URL flow (large file)');

    // Paso 1: Obtener signed URL
    const { data: upload } = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/api/public/upload-url`,
        {
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
    this.logger.log('Got signed URL for upload');

    // Paso 2: Subir archivo a GCS
    await firstValueFrom(
      this.httpService.put(upload.signedUrl, file.buffer, {
        headers: { 'Content-Type': file.mimetype },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }),
    );
    this.logger.log('File uploaded to GCS');

    // Paso 3: Extraer datos
    const { data } = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/api/public/extract/auto`,
        {
          gcpPath: upload.gcpPath,
          publicUrl: upload.publicUrl,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          save: true,
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      ),
    );

    this.logger.log('Menu data extracted successfully (large file)');
    return { data, fileUrl: upload.publicUrl };
  }
}
