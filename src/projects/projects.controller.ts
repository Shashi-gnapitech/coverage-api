import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /*--------------------Create Project-----------------------*/
  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  /*--------------------Get All Project-----------------------*/
  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  /*--------------------Get Project API Keys-----------------------*/
  @Get(':id/api-keys')
  getApiKeys(@Param('id') id: string) {
    return this.projectsService.getApiKeys(id);
  }

  /*--------------------Get Project Test Runs-----------------------*/
  @Get(':id/test-runs')
  getTestRuns(@Param('id') id: string) {
    return this.projectsService.getTestRuns(id);
  }

  /*--------------------Get One Project-----------------------*/
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  /*--------------------Update Project-----------------------*/
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  /*--------------------Delete Project-----------------------*/
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
