import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

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
}
