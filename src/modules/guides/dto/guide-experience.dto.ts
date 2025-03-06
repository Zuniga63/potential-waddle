import { CategoryDto } from 'src/modules/core/dto';
import { Experience } from 'src/modules/experiences/entities';

export class GuideExperienceDto {
  id: string;
  title: string;

  slug: string;

  description: string;

  difficultyLevel: string;

  price: number;

  images?: string[];
  categories?: CategoryDto[];

  paymentMethods?: string[];

  constructor({ data }: { data: Experience }) {
    if (!data) return;
    this.id = data.id;
    this.title = data.title;
    this.slug = data.slug;
    this.description = data.description;
    this.difficultyLevel = data.difficultyLevel;
    this.price = data.price;
    this.images = data.images.map(image => image.imageResource?.url).slice(0, 4);
    this.categories = data.categories.map(category => new CategoryDto(category));
    this.paymentMethods = data.paymentMethods || [];
  }
}
