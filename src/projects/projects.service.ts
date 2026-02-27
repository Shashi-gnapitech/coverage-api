import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectConnection } from 'nest-knexjs';
import { Knex } from 'knex';

@Injectable()
export class ProjectsService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  /*--------------------Create Project-----------------------*/
  async create(createProjectDto: CreateProjectDto) {
    const [project] = await this.knex('code_coverage.projects')
      .insert({
        projectname: createProjectDto.projectname,
        ingestiontoken: createProjectDto.ingestiontoken,
      })
      .returning('*');
    return project;
  }

  /*--------------------Get All Project-----------------------*/
  async findAll() {
    return this.knex('code_coverage.projects').select('*');
  }

  /*--------------------Get One Project-----------------------*/
  async findOne(id: string) {
    const project = await this.knex('code_coverage.projects')
      .where({ projectid: id })
      .first();
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  /*--------------------Update Project-----------------------*/
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

  /*--------------------Delete Project-----------------------*/
  async remove(id: string) {
    const count = await this.knex('code_coverage.projects')
      .where({ projectid: id })
      .delete();
    if (count === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return { success: true, message: `Project with ID ${id} removed` };
  }

  /*--------------------Get Project API Keys-----------------------*/
  async getApiKeys(id: string) {
    const apiKeys = await this.knex('code_coverage.ingest_api_keys').where({
      project_id: id,
    });
    return apiKeys;
  }

  /*--------------------Get Project Test Runs-----------------------*/
  async getTestRuns(id: string) {
    const testRuns = await this.knex('code_coverage.unit_test_run')
      .where({ project_id: id })
      .orderBy('created_at', 'desc');

    if (testRuns.length > 0) {
      const runIds = testRuns.map((run: any) => run.id);

      const testCases = await this.knex(
        'code_coverage.unit_test_cases_run',
      ).whereIn('run_id', runIds);

      const coverageFiles = await this.knex(
        'code_coverage.coverage_files',
      ).whereIn('run_id', runIds);

      const artifacts = await this.knex(
        'code_coverage.unit_test_ingest_artifacts',
      ).whereIn('run_id', runIds);

      testRuns.forEach((run: any) => {
        run.test_cases = testCases.filter((tc: any) => tc.run_id === run.id);
        run.coverage_files = coverageFiles.filter(
          (cf: any) => cf.run_id === run.id,
        );
        run.artifacts = artifacts.filter((a: any) => a.run_id === run.id);
      });
    }

    return testRuns;
  }
}
