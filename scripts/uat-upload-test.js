/**
 * Phase 7 UAT — runs the REAL seam against the live DB, from the COMPILED dist build
 * (entities glob is dist-based, so we must run compiled, not via ts-node).
 *
 * Build first: pnpm build
 * Run: node scripts/uat-upload-test.js <restaurantId> [filePath]
 */
require('dotenv').config();
const { readFileSync } = require('fs');
const { basename } = require('path');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const { MenuService } = require('../dist/src/modules/restaurants/services/menu.service');

function mimeFor(p) {
  p = p.toLowerCase();
  if (p.endsWith('.pdf')) return 'application/pdf';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

(async () => {
  const restaurantId = process.argv[2];
  const filePath = process.argv[3] || 'src/modules/restaurants/fixtures/menu-image.png';
  if (!restaurantId) throw new Error('Usage: node scripts/uat-upload-test.js <restaurantId> [filePath]');

  const buffer = readFileSync(filePath);
  const file = { buffer, originalname: basename(filePath), mimetype: mimeFor(filePath), size: buffer.length };

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const menuService = app.get(MenuService);

  console.log(`\n[UAT] engine=${process.env.EXTRACTION_ENGINE || 'anthropic(default)'} restaurant=${restaurantId}`);
  console.log(`[UAT] file=${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)\n`);

  const t0 = Date.now();
  const first = await menuService.processAndCreate(restaurantId, file);
  const cats = (first.data && first.data.categories) || [];
  const items = cats.reduce((n, c) => n + ((c.products && c.products.length) || 0), 0);
  const leak = JSON.stringify(first.data || {}).match(/item_confidence|overall_confidence|fileHash|file_hash/);
  console.log(`[UAT] call#1 menuId=${first.id} status=${first.status} in ${Date.now() - t0}ms`);
  console.log(`[UAT] call#1 categories=${cats.length} items=${items}`);
  console.log(`[UAT] call#1 fileUrl=${first.fileUrl}`);
  console.log(`[UAT] call#1 sidecar/hash leak in data? ${leak ? 'YES -> ' + leak[0] : 'no (clean)'}`);

  const t1 = Date.now();
  const second = await menuService.processAndCreate(restaurantId, file);
  const dt2 = Date.now() - t1;
  console.log(`\n[UAT] call#2 menuId=${second.id} status=${second.status} in ${dt2}ms`);
  console.log(`[UAT] idempotent? sameId=${first.id === second.id} fast=${dt2 < 1000} (expect both true)`);

  console.log('\n===== call#1 categories =====');
  cats.forEach(c => console.log(`  ${c.category_name}: ${(c.products || []).length} items`));

  await app.close();
  process.exit(0);
})().catch(e => {
  console.error('\n[UAT] FAILED:', (e && e.message) || e);
  process.exit(1);
});
