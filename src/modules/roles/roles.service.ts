import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly usersService: UsersService,
  ) {}

  create(createRoleDto: CreateRoleDto) {
    const role = this.rolesRepository.create(createRoleDto);
    return this.rolesRepository.save(role);
  }

  findAll() {
    const roles = this.rolesRepository.find();
    return roles;
  }

  async findOne(id: string) {
    const role = await this.rolesRepository.findOneBy({ id });
    if (!role) throw new NotFoundException('Role not found');

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);
    this.rolesRepository.merge(role, updateRoleDto);
    return this.rolesRepository.save(role);
  }

  async remove(id: string) {
    const { affected } = await this.rolesRepository.delete(id);
    if (!affected) throw new NotFoundException('Role not found');
    return;
  }

  async addUserToRole(roleId: string, userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    const role = await this.rolesRepository.findOne({ where: { id: roleId }, relations: ['users'] });
    if (!role) throw new NotFoundException('Role not found');

    role.users.push(user as User);

    return this.rolesRepository.save(role);
  }

  async deleteUserFromRole(roleId: string, userId: string) {
    const role = await this.rolesRepository.findOne({ where: { id: roleId }, relations: ['users'] });
    if (!role) throw new NotFoundException('Role not found');

    role.users = role.users.filter(user => user.id !== userId);

    return this.rolesRepository.save(role);
  }
}
