import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FindOptionsRelations, Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { hashPassword } from '../../auth/utils/hash-password';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CloudinaryImage } from '../../cloudinary/interfaces';
import { CloudinaryPresets } from '../../../config';
import { UserDto } from '../dto/user.dto';
import { ChangePasswordDto } from '../../auth/dto/change-password.dto';
import { compareSync } from 'bcrypt';
import { GoogleUserDto } from '../../auth/dto/google-user.dto';
import { UpdateProfileDto } from 'src/modules/auth/dto';
import { UserGuideDto } from '../dto/user-guide.dto';
import { UserLodgingDto } from '../dto/user-lodgings.dto';
import { UserRestaurantDto } from '../dto/user-restaurant.dto';
import { UserCommerceDto } from '../dto/user-commerce.dto';
import { AdminUsersFiltersDto, AdminUsersListDto, AdminUserDto } from '../dto';
import { generateAdminUsersQueryFilters } from '../utils';

interface AdminUsersFindAllParams {
  filters?: AdminUsersFiltersDto;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    delete createUserDto.passwordConfirmation;
    createUserDto.password = hashPassword(createUserDto.password);

    const user = this.usersRepository.create(createUserDto);
    await this.usersRepository.save(user);
    delete user.password;

    return user;
  }

  async createFromGoogle(googleUser: GoogleUserDto) {
    const user = await this.usersRepository.findOne({ where: { email: googleUser.email } });
    if (user) {
      if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date();

      if (!user.profilePhoto && googleUser.picture) {
        try {
          user.profilePhoto = await this.cloudinaryService.uploadImageFromUrl(
            googleUser.picture,
            user.username,
            CloudinaryPresets.PROFILE_PHOTO,
          );
        } catch (error) {
          console.log(error);
          this.logger.error('No se pudo cargar la imagen desde la url');
        }
      }

      return this.usersRepository.save(user);
    }

    const newImage: CloudinaryImage | undefined = googleUser.picture
      ? await this.cloudinaryService.uploadImageFromUrl(
          googleUser.picture,
          googleUser.username,
          CloudinaryPresets.PROFILE_PHOTO,
        )
      : undefined;

    const newUser = this.usersRepository.create({
      email: googleUser.email,
      username: googleUser.username,
      profilePhoto: newImage,
      emailVerifiedAt: new Date(),
    });

    return this.usersRepository.save(newUser);
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findAllAdmin({ filters }: AdminUsersFindAllParams = {}): Promise<AdminUsersListDto> {
    const { page = 1, limit = 25 } = filters ?? {};
    const skip = (page - 1) * limit;
    const { where, order } = generateAdminUsersQueryFilters(filters);

    const relations: FindOptionsRelations<User> = {
      role: true,
      reviews: true,
    };

    const [users, count] = await this.usersRepository.findAndCount({
      skip,
      take: limit,
      relations,
      order,
      where,
    });

    return new AdminUsersListDto({ currentPage: page, pages: Math.ceil(count / limit), count }, users);
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['role'] });
    return user;
  }

  async findOneWithSessionAndRole(id: string, sessionId: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.sessions', 'session')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id })
      .andWhere('session.id = :sessionId', { sessionId })
      .addSelect('user.password')
      .getOne();
  }

  async getFullUser(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.usersRepository.update(id, { password: hashedPassword });
  }

  async updateProfilePhoto(id: string, file: Express.Multer.File) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');

    const { profilePhoto: currentProfilePath } = user;
    let image: CloudinaryImage | undefined;

    try {
      // * Upload the image to Cloudinary
      image = await this.cloudinaryService.uploadImage({
        file,
        fileName: user.username,
        preset: CloudinaryPresets.PROFILE_PHOTO,
      });

      // * If the image is not uploaded, throw an error
      if (!image) throw new BadRequestException('Error uploading image');

      // * Update the user's profile photo path
      user.profilePhoto = image;
      await this.usersRepository.save(user);

      // * Delete the old profile photo if it exists

      if (currentProfilePath) {
        this.cloudinaryService.destroyFile(currentProfilePath.publicId);
      }

      return new UserDto(user);
    } catch (error) {
      this.logger.error(error);
      if (image) {
        this.logger.log('Deleting image');
        await this.cloudinaryService.destroyFile(image.publicId);
      }

      throw error;
    }
  }

  async removeProfilePhoto(id: string) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');

    const { profilePhoto } = user;
    if (!profilePhoto) throw new BadRequestException('User does not have a profile photo');

    await this.cloudinaryService.destroyFile(profilePhoto.publicId);
    user.profilePhoto = null;
    await this.usersRepository.save(user);

    return new UserDto(user);
  }

  async changePassword(email: string, changePasswordDto: ChangePasswordDto) {
    const { password, newPassword } = changePasswordDto;

    const user = await this.getFullUser(email);
    if (!user) throw new NotFoundException('User not found');
    if (user.password && !compareSync(password, user.password)) throw new UnauthorizedException('Invalid password');

    user.password = hashPassword(newPassword);
    await this.usersRepository.save(user);
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');

    const userUpdated = await this.usersRepository.save({ ...user, ...updateProfileDto });
    return new UserDto(userUpdated);
  }

  async getUserTransport(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: [
        'transport',
        'transport.user',
        'transport.categories',
        'transport.categories.icon',
        'transport.town',
        'transport.town.department',
      ],
    });

    return user?.transport ?? {};
  }

  /*   async getFullUserWithRelations(id: string) {
    const relations: FindOptionsRelations<User> = {
      lodgings: {
        town: { department: true },
        images: { imageResource: true },
        categories: { icon: true },
      },
      restaurants: {
        town: { department: true },
        images: { imageResource: true },
        categories: { icon: true },
      },
      commerces: {
        town: { department: true },
        categories: { icon: true },
        images: { imageResource: true },
      },
      guide: {
        categories: { icon: true },
        experiences: {
          categories: { icon: true },
          images: { imageResource: true },
          town: { department: true },
        },
      },
    };
    const user = await this.usersRepository.findOne({
      where: { id },
      relations,
    });
    return user;
  } */

  async getUserGuide(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: [
        'guide',
        'guide.categories',
        'guide.experiences',
        'guide.experiences.categories',
        'guide.experiences.images',
        'guide.experiences.images.imageResource',
        'guide.experiences.town',
      ],
    });

    const userGuide = user?.guide ? new UserGuideDto({ data: user?.guide, user }) : null;
    console.log(userGuide);
    return userGuide ?? {};
  }

  async getUserLodgings(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: [
        'lodgings',
        'lodgings.categories',
        'lodgings.images',
        'lodgings.images.imageResource',
        'lodgings.town',
        'lodgings.town.department',
      ],
    });
    const lodgings = user?.lodgings ? user?.lodgings.map(lodging => new UserLodgingDto(lodging)) : [];
    return lodgings ?? [];
  }

  async getUserCommerce(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: [
        'commerces',
        'commerces.images',
        'commerces.images.imageResource',
        'commerces.categories',
        'commerces.town',
        'commerces.town.department',
      ],
    });
    return user?.commerces ? user?.commerces.map(commerce => new UserCommerceDto(commerce)) : [];
  }

  async getUserRestaurants(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: [
        'restaurants',
        'restaurants.images',
        'restaurants.images.imageResource',
        'restaurants.categories',
        'restaurants.town',
        'restaurants.town.department',
      ],
    });
    return user?.restaurants ? user?.restaurants.map(restaurant => new UserRestaurantDto(restaurant)) : [];
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ADMIN METHODS
  // * ----------------------------------------------------------------------------------------------------------------

  async findOneAdmin(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'reviews'],
    });

    if (!user) throw new NotFoundException('User not found');

    return new AdminUserDto(user);
  }

  async toggleActive(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.isActive = !user.isActive;
    await this.usersRepository.save(user);

    return { id: user.id, isActive: user.isActive };
  }

  async toggleSuperUser(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.isSuperUser = !user.isSuperUser;
    await this.usersRepository.save(user);

    return { id: user.id, isSuperUser: user.isSuperUser };
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.usersRepository.remove(user);

    return { deleted: true, id };
  }
}
