/**
 * Unit spec for MenuDto — guards the T-07-01 trust boundary.
 *
 * Asserts that the internal `fileHash` column added to the Menu entity for
 * idempotency (INTEG-04) is NEVER surfaced through MenuDto, even if the entity
 * object carries the field. The DTO uses an explicit-pick constructor, so this
 * test is a regression guard against accidental spread / Object.assign patterns.
 */

import { MenuDto } from './menu.dto';
import { Menu } from '../entities/menu.entity';

describe('MenuDto', () => {
  const restaurantId = 'restaurant-uuid-abc';

  /** Build a fake Menu entity that includes the internal fileHash field. */
  function makeMenu(overrides: Partial<Menu> = {}): Menu {
    return {
      id: 'menu-uuid-123',
      restaurant: { id: restaurantId } as any,
      data: { sections: [] },
      fileUrl: 'https://storage.googleapis.com/bucket/menu.jpg',
      fileName: 'menu.jpg',
      mimeType: 'image/jpeg',
      status: 'completed',
      fileHash: 'deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
      createdAt: new Date('2026-06-19T00:00:00Z'),
      updatedAt: new Date('2026-06-19T01:00:00Z'),
      ...overrides,
    } as unknown as Menu;
  }

  describe('fileHash exclusion (T-07-01 — Information Disclosure boundary)', () => {
    it('should NOT include fileHash in the DTO output', () => {
      const menu = makeMenu();
      const dto = new MenuDto(menu);

      expect('fileHash' in dto).toBe(false);
      expect((dto as unknown as Record<string, unknown>).fileHash).toBeUndefined();
    });

    it('should NOT include file_hash in the DTO output', () => {
      const menu = makeMenu();
      const dto = new MenuDto(menu);

      expect('file_hash' in dto).toBe(false);
      expect((dto as unknown as Record<string, unknown>).file_hash).toBeUndefined();
    });
  });

  describe('public field mapping', () => {
    it('should map all expected public fields correctly', () => {
      const menu = makeMenu();
      const dto = new MenuDto(menu);

      expect(dto.id).toBe('menu-uuid-123');
      expect(dto.restaurantId).toBe(restaurantId);
      expect(dto.data).toEqual({ sections: [] });
      expect(dto.fileUrl).toBe('https://storage.googleapis.com/bucket/menu.jpg');
      expect(dto.fileName).toBe('menu.jpg');
      expect(dto.mimeType).toBe('image/jpeg');
      expect(dto.status).toBe('completed');
      expect(dto.createdAt).toEqual(new Date('2026-06-19T00:00:00Z'));
      expect(dto.updatedAt).toEqual(new Date('2026-06-19T01:00:00Z'));
    });

    it('should resolve restaurantId from nested restaurant relation', () => {
      const menu = makeMenu({ restaurant: { id: 'other-restaurant-id' } as any });
      const dto = new MenuDto(menu);

      expect(dto.restaurantId).toBe('other-restaurant-id');
    });

    it('should handle null fileUrl and data gracefully', () => {
      const menu = makeMenu({ fileUrl: null, data: null, fileHash: null });
      const dto = new MenuDto(menu);

      expect(dto.fileUrl).toBeNull();
      expect(dto.data).toBeNull();
      expect('fileHash' in (dto as unknown as Record<string, unknown>)).toBe(false);
    });
  });
});
