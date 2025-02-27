import { ExperienceDto } from 'src/modules/experiences/dto';
import { GuideDto } from 'src/modules/guides/dto/guide.dto';
import { Guide } from 'src/modules/guides/entities/guide.entity';

export class ProfileGuideDto extends GuideDto {
  experiences: ExperienceDto[];
  name: string;
  constructor(guide: Guide) {
    super({ data: guide });
    this.experiences = guide.experiences?.map(experience => new ExperienceDto({ data: experience })) || [];
    this.name = `${guide.firstName} ${guide.lastName}`;
  }
}
