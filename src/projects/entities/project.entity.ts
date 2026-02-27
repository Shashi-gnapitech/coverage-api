export class Project {
  projectid: string;
  projectname: string;
  ingestiontoken: string;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKey {
  id: string;
  project_id: string;
  [key: string]: unknown;
}

export interface TestRun {
  id: string;
  project_id: string;
  test_cases?: TestCase[];
  coverage_files?: CoverageFile[];
  artifacts?: Artifact[];
  [key: string]: unknown;
}

export interface TestCase {
  id: string;
  run_id: string;
  [key: string]: unknown;
}

export interface CoverageFile {
  id: string;
  run_id: string;
  [key: string]: unknown;
}

export interface Artifact {
  id: string;
  run_id: string;
  [key: string]: unknown;
}
