# Menu Extraction UAT Fixtures

This directory holds real Colombian restaurant menu files used for manual UAT of the `AnthropicMenuExtractionService`.

**Binary menu files are NOT committed to git** — they are local UAT inputs only.
This README is the committed artifact so the path and instructions are reproducible.

> **PII policy:** Do not place menus containing real customer data, personal contact info, or any sensitive PII here. Menu content (dish names, prices) is fine; owner/staff personal data is not.

---

## Required Fixture Files (place them here before UAT)

| Filename | Type | Purpose | UAT Requirement |
|---|---|---|---|
| `menu-photo.jpg` | JPEG photo | Single/multi-column photo taken at angle or flat | EXTRACT-01, EXTRACT-04 |
| `menu-pdf.pdf` | Native multi-page PDF | A real PDF with 2+ pages of categories and products | EXTRACT-02 |
| `menu-columns.jpg` | JPEG photo (or PNG/WebP) | Menu with multiple columns or prominent section headers | EXTRACT-04 |

At least **three files** should be present before running UAT:
1. One **JPEG/PNG/WebP photo** of a real Colombian restaurant menu
2. One **native multi-page PDF** (not a scanned/image PDF — native text layer so Claude can read page 2+)
3. One **multi-column or section-headed menu** (can overlap with 1 or 2)

---

## Prereqs Before Running UAT

1. Set env vars in `binntu-nest/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...          # Anthropic Console → API Keys
   ANTHROPIC_MODEL=claude-haiku-4-5     # or leave unset (service defaults to claude-haiku-4-5)
   GCP_BUCKET_NAME=binntu-documents     # already required for existing document uploads
   GOOGLE_APPLICATION_CREDENTIALS_JSON=<base64 or path>
   ```
2. Obtain a valid **restaurant UUID** and a **bearer token** for an authorized user from the running API.
3. Start the backend dev server:
   ```bash
   pnpm start:dev
   ```
4. Place the 3 fixture files above in this directory (`src/modules/restaurants/fixtures/`).

---

## UAT Commands (curl)

Replace `<RESTAURANT_UUID>` and `<TOKEN>` in every command below.

### Step 1 — IMAGE (EXTRACT-01)

```bash
curl -X POST \
  "http://localhost:3000/restaurants/<RESTAURANT_UUID>/menus/extract-test?townSlug=dev" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@src/modules/restaurants/fixtures/menu-photo.jpg"
```

**Expect:** `data.categories[]` is populated; `product_price` values are plain integers in realistic COP (e.g. `25000`, not `25` or `25.0`); response shape matches `ExtractionResult` (`data`, `fileUrl`, `overallConfidence`, `reviewFlags`). No `item_confidence` inside `data`.

---

### Step 2 — PDF MULTI-PAGE (EXTRACT-02)

```bash
curl -X POST \
  "http://localhost:3000/restaurants/<RESTAURANT_UUID>/menus/extract-test?townSlug=dev" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@src/modules/restaurants/fixtures/menu-pdf.pdf"
```

**Expect:** Categories and items from ALL pages of the PDF are present — no page silently dropped.

---

### Step 3 — MULTI-COLUMN / SECTIONS (EXTRACT-04)

```bash
curl -X POST \
  "http://localhost:3000/restaurants/<RESTAURANT_UUID>/menus/extract-test?townSlug=dev" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@src/modules/restaurants/fixtures/menu-columns.jpg"
```

**Expect:** Every column and section header appears as a `category_name`; no items missing; price-less items have `product_price: null`.

---

### Step 4 — ANTI-HALLUCINATION (EXTRACT-05)

Use any of the above fixtures that contain items without descriptions or prices.

**Expect:** `product_description` is `null` (not invented) for items without a visible description. `currency`, `notes`, `restaurant_name` are `null` when not visible on the menu.

---

### Step 5 — CONFIDENCE FLAGS

Use a blurry, angled, or partially-legible menu photo.

**Expect:** `reviewFlags` contains entries for low-confidence items; `overallConfidence` is lower than for a clean, flat menu photo.

---

### Step 6 — FILE URL (EXTRACT-07)

For any call above, check `fileUrl` in the response:

```bash
# Verify the URL points to binntu-documents and is reachable:
curl -I "<fileUrl from response>"
```

**Expect:** `fileUrl` contains `binntu-documents` in the URL and returns HTTP 200.

---

## Recording UAT Results

After completing each step, record the outcome in `.planning/phases/06-standalone-anthropic-menu-extractor/06-03-SUMMARY.md` under the UAT Results table. The phase is considered complete only when all steps pass and the user types "approved" as the resume signal.

---

## Notes

- This endpoint (`POST .../menus/extract-test`) is **temporary** — it is marked `TODO(Phase 7)` in `menu.controller.ts` and will be removed/replaced during Phase 7 seam wiring.
- Phase 8 (SEC-02) will add rate-limiting and throttle hardening to the production upload path.
- The endpoint uses the same `@Auth()` JWT guard as the production `upload` route.
- No data is written to the database — `ExtractionResult` is returned directly to the caller.
