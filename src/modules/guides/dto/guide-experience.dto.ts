import { Experience } from 'src/modules/experiences/entities';

export class GuideExperienceDto {
  title: string;

  slug: string;

  description: string;

  difficultyLevel: string;

  price: number;

  image?: string;

  constructor({ data }: { data: Experience }) {
    if (!data) return;

    this.title = data.title;
    this.slug = data.slug;
    this.description = data.description;
    this.difficultyLevel = data.difficultyLevel;
    this.price = data.price;
    this.image = data.images[0]?.imageResource?.url;
  }
}
