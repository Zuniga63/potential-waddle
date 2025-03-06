import { CategoryDto } from 'src/modules/core/dto';
import { TownDto } from 'src/modules/towns/dto';
import { UserDto } from 'src/modules/users/dto/user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { GuideExperienceDto } from 'src/modules/guides/dto/guide-experience.dto';
import { Guide } from 'src/modules/guides/entities/guide.entity';

export class UserGuideDto {
  @ApiProperty({
    example: 'uuid of the guide',
    description: 'The UUID of the guide',
    readOnly: true,
  })
  id: string;

  @ApiProperty({
    example: 'john-doe',
    description: 'Slug of the guide',
  })
  slug: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the guide',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the guide',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the guide',
  })
  lastName: string;

  /*   @ApiProperty({
    example: 'DNI',
    description: 'Type of identification document',
  })
  documentType: string;

  @ApiProperty({
    example: '12345678',
    description: 'Identification document number',
  })
  document: string; */

  @ApiProperty({
    example: '+51987654321',
    description: 'Contact phone number',
  })
  phone: string;

  @ApiProperty({
    example: '+51987654321',
    description: 'WhatsApp contact number',
    required: false,
  })
  whatsapp?: string;

  /*   @ApiProperty({
    example: 'Av. Example 123',
    description: 'Physical address of the guide',
  })
  address: string; */

  /*   @ApiProperty({
    example: 'Experienced tour guide with 5 years of experience...',
    description: 'Professional biography of the guide',
    required: false,
  })
  biography?: string; */

  @ApiProperty({
    example: ['English', 'Spanish'],
    description: 'Languages spoken by the guide',
    required: false,
  })
  languages?: string[];

  @ApiProperty({
    example: 'https://facebook.com/profile',
    description: 'Facebook profile URL',
    required: false,
  })
  facebook?: string;

  @ApiProperty({
    example: 'https://instagram.com/profile',
    description: 'Instagram profile URL',
    required: false,
  })
  instagram?: string;

  @ApiProperty({
    example: 'https://youtube.com/channel',
    description: 'YouTube channel URL',
    required: false,
  })
  youtube?: string;

  @ApiProperty({
    example: 'https://tiktok.com/@profile',
    description: 'TikTok profile URL',
    required: false,
  })
  tiktok?: string;

  @ApiProperty({
    example: 'https://image.jpg',
    isArray: true,
    description: 'The image of the guide',
    readOnly: true,
    required: false,
  })
  images?: string[];

  /*   @ApiProperty({
    example: true,
    description: 'Whether the guide is currently available',
    default: true,
  })
  isAvailable?: boolean; */

  /* @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt?: Date; */

  // Relationships
  town?: TownDto;
  user?: UserDto;
  categories?: CategoryDto[];
  experiences?: GuideExperienceDto[];

  constructor({ data }: { data: Guide }) {
    if (!data) return;
    this.id = data.id;
    this.slug = data.slug;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    /*     this.documentType = data.documentType;
    this.document = data.document; */
    this.phone = data.phone;
    this.whatsapp = data.whatsapp;
    /*     this.address = data.address;
    this.biography = data.biography; */
    this.facebook = data.facebook;
    this.instagram = data.instagram;
    this.youtube = data.youtube;
    this.tiktok = data.tiktok;
    this.languages = data.languages;
    this.images = data.images?.map(image => image.imageResource?.url).slice(0, 4);
    // Map relationships
    this.user = data.user ? new UserDto(data.user) : undefined;
    this.categories = data.categories?.map(category => new CategoryDto(category));
    this.experiences = data.experiences?.map(experience => new GuideExperienceDto({ data: experience })) || [];
  }
}
