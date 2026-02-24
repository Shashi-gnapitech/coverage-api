import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectConnection } from 'nest-knexjs';
import { Knex } from 'knex';

@Injectable()
export class ProjectsService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async create(createProjectDto: CreateProjectDto) {
    const [project] = await this.knex('code_coverage.projects')
      .insert({
        projectname: createProjectDto.projectname,
        ingestiontoken: createProjectDto.ingestiontoken,
      })
      .returning('*');
    return project;
  }

  async findAll() {
    return this.knex('code_coverage.projects').select('*');
  }

  async findOne(id: string) {
    const project = await this.knex('code_coverage.projects')
      .where({ projectid: id })
      .first();
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const [project] = await this.knex('code_coverage.projects')
      .where({ projectid: id })
      .update(updateProjectDto)
      .returning('*');
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async remove(id: string) {
    const count = await this.knex('code_coverage.projects')
      .where({ projectid: id })
      .delete();
    if (count === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return { success: true, message: `Project with ID ${id} removed` };
  }
}
