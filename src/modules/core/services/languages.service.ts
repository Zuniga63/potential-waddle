import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Language } from '../entities';
import { Repository } from 'typeorm';
import { CreateLanguageDto } from '../dto';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
  ) {}

  // * -------------------------------------------------------------------------------------------------------------
  // * CREATE NEW LANGUAGE
  // * -------------------------------------------------------------------------------------------------------------
  async create(createLanguageDto: CreateLanguageDto) {
    const model = this.languageRepo.create(createLanguageDto);
    return this.languageRepo.save(model);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL LANGUAGE
  // * -------------------------------------------------------------------------------------------------------------
  findAll() {
    return this.languageRepo.find();
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET LANGUAGE BY ID
  // * -------------------------------------------------------------------------------------------------------------
  findOne() {
    return 'This action returns a model by ID';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE LANGUAGE
  // * -------------------------------------------------------------------------------------------------------------
  update() {
    return 'This action updates a model';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE LANGUAGE
  // * -------------------------------------------------------------------------------------------------------------
  remove() {
    return 'This action removes a model';
  }
}
