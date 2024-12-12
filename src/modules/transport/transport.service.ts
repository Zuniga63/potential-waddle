import { Injectable } from '@nestjs/common';
import { TransportDto } from './dto/transport.dto';
import { TransportFindAllParams } from './interfaces/transport-find-all-params.interface';
import { generateTransportQueryFiltersAndSort } from './logic/generate-transport-query-filters-and-sort';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transport } from './entities';

@Injectable()
export class TransportService {
  create() {
    return 'This action adds a new transport';
  }
  constructor(
    @InjectRepository(Transport)
    private readonly transportRepository: Repository<Transport>,
  ) {}
  async findAll({ filters }: TransportFindAllParams = {}): Promise<TransportDto[]> {
    const { where } = generateTransportQueryFiltersAndSort(filters);
    const transports = await this.transportRepository.find({
      relations: { categories: { icon: true }, town: { department: true } },
      where,
    });

    return transports.map(transport => new TransportDto({ data: transport }));
  }

  findOne(id: number) {
    return `This action returns a #${id} transport`;
  }

  update(id: number) {
    return `This action updates a #${id} transport`;
  }

  remove(id: number) {
    return `This action removes a #${id} transport`;
  }
}
