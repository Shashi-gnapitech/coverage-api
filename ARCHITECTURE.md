# Katalyst Code Coverage

This repository contains the **Code Coverage** subsystem for Katalyst. It is built as a monorepo consisting of two primary components: a robust backend API for ingesting test and coverage data, and a modern micro-frontend dashboard for data visualization.

---

## 🏗️ Architecture Overview

The system is split into the following components:

1. **Coverage API (`coverage-api`)**: A Node.js backend built with [NestJS](https://nestjs.com/). It handles project management, API key storage, and ingests `JUnit` and `LCOV` test reports securely. It uses PostgreSQL as its data store (configured via `Knex` and `pg`).
2. **Coverage Dashboard (`coverage-dashboard`)**: A standalone React application built with Vite. It serves as both a standalone dashboard and a federated micro-frontend module that can be natively embedded within the broader Katalyst UI.

---

## 🎯 Problems Solved & Advantages

The Katalyst Code Coverage platform addresses several core engineering and infrastructural challenges:

1. **Centralized Visibility (The "Black Box" Test Problem):** 
   * **Problem:** Across multiple repositories and microservices, analyzing test health or coverage usually requires developers to dig into individual CI/CD action logs or disparate systems (like SonarQube, Codecov, etc.).
   * **Solution:** By aggregating `JUnit` and `LCOV` reports uniformly into one single PostgreSQL database, it provides instant, centralized visibility into the health and test coverage of entire projects under one roof.

2. **Seamless CI/CD Integration:**
   * **Advantage:** The custom ingestion `/ingest/runs` API paired with hashed worker tokens allows for quick adoption across any repository. Teams simply plug in the Action in their workflows, which then sends the structured payload (commit SHA, branch, and raw `junit`/`lcov` files) effortlessly without complex auth setups per-repository.

3. **Decoupled Yet Integrated UI (Micro-frontends):**
   * **Problem:** Integrating a complex dashboard full of charts and coverage metrics into a monolithic parent application often slows down the parent's build time, creates dependency conflicts, and couples deployments.
   * **Solution:** Using Vite's **Module Federation**, the `coverage-dashboard` is built and deployed completely independently. The host (Katalyst) simply dynamically imports the `./mount` function at runtime. This provides a native embedded experience without iframe quirks (like styling and messaging limitations), while retaining a fully decoupled deployment pipeline.

4. **Extensibility & Standalone Capability:**
   * **Advantage:** Because the React app fetches its own data from the API and checks its environment, it works equally well as a localized standalone app (when a developer runs `npm run dev`) or as a context-aware embedded tab. It gracefully handles data fetching by observing its `projectId` props.

### 💼 Real-World & Business Value

Beyond the technical architecture, this platform solves highly tangible, real-world problems for software teams:

1. **Quality Assurance & Mitigating Production Bugs:** 
   * **Problem:** Software is shipped to production with untested code paths, leading to unexpected outages and frustrated end-users.
   * **Solution:** By providing highly visible coverage metrics, teams can quickly identify severely untested areas of their codebase and prioritize writing tests, drastically reducing the chances of regressions hitting production.
2. **Developer Confidence & Velocity:**
   * **Problem:** Developers are scared to refactor or aggressively improve older codebase areas because they are unsure if their changes will break hidden dependencies.
   * **Solution:** Knowing that code coverage is tracked and visually accessible increases psychological safety. Developers can confidently refactor, significantly speeding up feature development velocity.
3. **Accountability, Compliance, & Gamification:**
   * **Problem:** Code quality standards slip over time, and tech debt accumulates silently. 
   * **Solution:** A prominent dashboard makes code quality transparent to tech leads and managers. Teams often naturally gamify the "green" coverage percentage, establishing unwritten standards and avoiding adding PRs that lower the overall health score.
4. **Faster Project Onboarding:**
   * **Problem:** New engineers lack context on what parts of the application are risky to touch.
   * **Solution:** The coverage dashboard immediately acts as a risk-map for new engineers, showing them which components are well-tested (safe to modify) and which are lacking (high risk).

---

## 🚀 Client App Integration Guide

To automatically send code coverage data to Katalyst, you need to configure your client repository by adding a GitHub Actions step and configuring specific repository secrets and variables.

### 1. GitHub Actions Workflow

In your client application, create or update a GitHub Actions workflow file (e.g., `.github/workflows/action.yml`) to trigger the Katalyst ingestion process whenever your unit tests run.

You should use the reusable Katalyst ingest action. Example workflow snippet:

```yaml
jobs:
  test-and-coverage:
    runs-on: ubuntu-latest
    steps:
      # ... (your existing checkout, setup, and test steps here)
      
      - name: Run Tests and Generate Coverage
        run: npm run test:coverage # Or your specific test script

      - name: Katalyst Test Ingest
        uses: gnapi-tech/katalyst-ingest-action@v1 # Example reference to the external ingest action
        with:
          project_id: ${{ vars.KATALYST_PROJECT_ID }}
          ingestion_token: ${{ secrets.KATALYST_INGESTION_TOKEN }}
          base_url: ${{ vars.KATALYST_BASE_URL }}
          # Depending on the action requirements, you may need to provide report paths:
          # lcov_path: coverage/lcov.info
          # junit_path: coverage/junit.xml
```

### 2. Required Secrets and Variables

Configure the following in your client app's GitHub repository settings (**Settings > Secrets and variables > Actions**):

*   **Variables:**
    *   `KATALYST_PROJECT_ID`: The ID of your target project in Katalyst.
    *   `KATALYST_BASE_URL`: The base URL pointing to your Katalyst instance.
*   **Secrets:**
    *   `KATALYST_INGESTION_TOKEN`: The secure ingest token for your Katalyst project used for authenticating the ingestion API calls.

### 3. CI Execution Flow

The typical workflow integration is as follows:
1. A user writes new unit test cases and pushes the code to the target repository.
2. The configured GitHub Actions CI runs the automated tests.
3. The CI executes the Katalyst ingest action.
4. The action triggers the backend project ingestion in Katalyst, creating a new run entry.
5. The coverage data (e.g., LCOV reports) is parsed and safely ingested against that run.

---

## 🖥️ Viewing the Dashboard in Katalyst

Once the integration is active and payloads have been successful, you can visualize the data within Katalyst.

**Step-by-step to view the Code Coverage Dashboard:**

1. Log into Katalyst and **Select your project**.
2. Look at the application navbar and click on **Project settings and more**.
3. A dropdown will expand. Click on the **Project Settings** item.
4. On the Project Settings view, click on the **Code Coverage** tab.
5. Use the toggle to **enable** code coverage for the project. Make sure to save the configuration.
6. Once enabled, click on **Project settings and more** in the navbar again.
7. You will now see a new **Code Coverage** item in the open dropdown menu.
8. Click on it to bring up the **Code Coverage Dashboard** populated with your latest CI data!

---

## ⚙️ Backend Details (Coverage API)

The backend is a NestJS application listening on port `3000` (typically mapped to `3500` via Docker). 

### Key Modules

#### **Ingest Module**
Handles the processing of incoming coverage test reports from CI/CD pipelines.

* **Endpoint**: `POST /ingest/runs`
* **Content-Type**: `multipart/form-data`
* **Headers**: `Authorization: Bearer <raw-ingestion-token>`
* **Payload Fields**:
  * `projectId` (string): Target Katalyst Project ID.
  * `branch` (string): Target branch identifier.
  * `commit` (string): Extracted Git commit SHA.
  * `repo` (string, optional): Repository URL/Name.
  * `trigger` (string, optional): Defaults to `push`.
  * `pr_number` (string, optional): Pull request associated.
* **File Uploads**:
  * `junit` (Required): The `junit.xml` test report file.
  * `lcov` (Optional): The `lcov.info` code coverage report file.

#### **Projects Module**
Handles CRUD operations for code-coverage enabled projects, fetching tests results, and retrieving Project API keys.

* **Base URL**: `/projects`
* **Endpoints**:
  * `POST /projects` - Create a new project.
  * `GET /projects` - Retrieve all integrated projects.
  * `GET /projects/:id` - Get specific project details.
  * `GET /projects/:id/api-keys` - Fetch valid ingestion API keys (requires ProjectAuthGuard).
  * `GET /projects/:id/test-runs` - Get ingested test runs metadata.
  * `POST /projects/:id/test-runs` - Manually create a test run context.
  * `PATCH /projects/:id` - Update existing project.
  * `DELETE /projects/:id` - Delete project configuration.

### Setup & Commands
```bash
# Database Setup
npm run db:create
npm run db:migrate
npm run db:seed

# Start the API
npm run start:dev

# Run with Docker
docker build -t coverage-api .
docker run -p 3500:3000 coverage-api
```

---

## 🎨 Frontend Details (Coverage Dashboard)

The `coverage-dashboard` is a React + Vite application situated within the API's directory structure.

### Micro-Frontend Integration
The dashboard employs **Module Federation** to expose a native remote component that can be dynamically mounted from the host (Katalyst main UI). It utilizes the `@originjs/vite-plugin-federation` module.

* **Federated Name**: `codeCoverage`
* **Exposed Module**: `./mount` mapped to `./src/mount.tsx`.
* **Shared Dependencies**: `react`, `react-dom`

### Application Modes
The `App.tsx` handles rendering based on context:
1. **Standalone Mode**: If loaded directly (without a specific `projectId`), it queries `/api/projects` to list all tracked repositories in a dynamic card layout, providing a high-level overview.
2. **Embedded Mode**: If a `projectId` property is supplied directly (or resolved via the URL path `/project/:projectId`), it bypasses the project list and renders the specific `CoverageTab` component for that project instantly.

### Build & Run
```bash
cd coverage-dashboard

# Start the Vite Dev Server
npm run dev

# Build the federated module
npm run build
npm run preview
```

---

## 🔒 Security & Best Practices

* **Ingestion Token Security**: Ingestion tokens are hashed to `SHA-256` before being retrieved & verified against the database. Raw tokens are never stored.
* **Typing rules**: Strongly enforced by strict ESlint React type-aware logic (`eslint-plugin-react-x`, `@eslint/js`). 
* **CORS Proxy**: In local development, the Vite Server acts as a proxy mapping `/api` locally to the backend `http://localhost:3500` to prevent CORS issues.
