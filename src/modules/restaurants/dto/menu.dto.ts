import { Menu } from '../entities/menu.entity';

export class MenuDto {
  id: string;
  restaurantId: string;
  data: Record<string, any> | null;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(menu: Menu) {
    this.id = menu.id;
    this.restaurantId = menu.restaurant?.id;
    this.data = menu.data;
    this.fileUrl = menu.fileUrl;
    this.fileName = menu.fileName;
    this.mimeType = menu.mimeType;
    this.status = menu.status;
    this.createdAt = menu.createdAt;
    this.updatedAt = menu.updatedAt;
  }
}
