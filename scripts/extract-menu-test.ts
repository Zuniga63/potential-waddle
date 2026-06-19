/**
 * Throwaway UAT runner for Phase 6 — calls AnthropicMenuExtractionService directly
 * against a local fixture file (no HTTP, no auth, no DB).
 *
 * Usage: npx ts-node -r tsconfig-paths/register scripts/extract-menu-test.ts [path]
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { readFileSync } from 'fs';
import { basename } from 'path';
import { ConfigService } from '@nestjs/config';
import { appConfig, EnvironmentVariables } from '../src/config/app-config';
import { GcpStorageService } from '../src/modules/documents/services/gcp-storage.service';
import { AnthropicMenuExtractionService } from '../src/modules/restaurants/services/anthropic-menu-extraction.service';

function mimeFor(path: string): string {
  const p = path.toLowerCase();
  if (p.endsWith('.pdf')) return 'application/pdf';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function main() {
  const filePath = process.argv[2] || 'src/modules/restaurants/fixtures/MENU.pdf';
  const buffer = readFileSync(filePath);
  const file = {
    buffer,
    originalname: basename(filePath),
    mimetype: mimeFor(filePath),
    size: buffer.length,
  } as Express.Multer.File;

  const config = appConfig();
  const configService = new ConfigService<EnvironmentVariables>(config);
  const gcp = new GcpStorageService();
  const svc = new AnthropicMenuExtractionService(configService, gcp);

  console.log(`\n[UAT] file=${file.originalname} mime=${file.mimetype} size=${(file.size / 1024 / 1024).toFixed(2)}MB`);
  console.log(`[UAT] model=${config.menuExtraction.model}\n`);

  const t0 = Date.now();
  const result = await svc.processMenuFile(file, { townSlug: 'dev', restaurantId: 'uat-test' });
  const ms = Date.now() - t0;

  const cats = result.data.categories || [];
  const itemCount = cats.reduce((n, c) => n + (c.products?.length || 0), 0);
  console.log(`[UAT] OK in ${ms}ms — categories=${cats.length} items=${itemCount}`);
  console.log(`[UAT] fileUrl=${result.fileUrl}`);
  console.log(`[UAT] overallConfidence=${result.overallConfidence} reviewFlags=${(result.reviewFlags || []).length}`);
  console.log('\n===== ExtractionResult =====\n');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(e => {
  console.error('\n[UAT] FAILED:', e?.message || e);
  if (e?.status) console.error('[UAT] http status:', e.status);
  process.exit(1);
});
