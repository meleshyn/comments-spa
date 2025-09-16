### 1\. Project Overview

The primary goal is to develop a full-featured, interactive Single-Page Application (SPA) for commenting. The application will allow users to post comments and reply to others, creating nested discussion threads of any depth. The entire project will be developed within a `pnpm`-based **Turborepo** monorepository.

---

### 2\. Core Functionality

- **Commenting System:**
  - Users can submit root-level comments.
  - Users can reply to any existing comment, creating "cascading" discussions.
  - New comments must appear for all active users in real-time without a page reload.
- **Comment Form:**
  - The form must contain the following required fields: **username**, **e-mail**, and **comment text**.
  - An optional **homepage** field (URL format) can be included.
  - A **CAPTCHA** must be integrated to prevent spam.
- **Display & Sorting:**
  - Root-level comments will be displayed in a table.
  - The table must support sorting by **username**, **e-mail**, and **creation date**.
  - Results must be paginated, showing **25 comments per page**.
- **File Attachments:**
  - Users can attach image files (**JPG, GIF, PNG**). Images will be automatically resized to a maximum of **320x240 pixels**.
  - Users can attach text files (**.txt**) with a size limit of **100 KB**.
- **Security:**
  - The application must be protected against **XSS attacks** and **SQL injections**.
  - User-submitted text will be sanitized to allow only the following HTML tags: `<a>`, `<code>`, `<i>`, and `<strong>`.

---

### 3\. Technology Stack & Architecture

This project is a monorepo containing a React frontend, a NestJS backend, and shared packages for code consistency.

##### 3\.1. Monorepo & Tooling

- **Monorepo Framework:** Turborepo
- **Package Manager:** pnpm
- **Containerization:** Docker & Docker Compose

##### 3\.2. Backend (`apps/api`)

- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **File storage:** Google Cloud Storage (via `@google-cloud/storage`)
- **Real-time Communication:** WebSockets (via `@nestjs/websockets` and `socket.io`)
- **API Documentation:** Swagger (`@nestjs/swagger`)
- **Security:** `helmet` for headers, `isomorphic-dompurify` for sanitization.
- **Validation:** `zod` and `nestjs-zod`, utilizing shared schemas from `@acme/schemas`.

##### 3\.3. Frontend (`apps/web`)

- **Framework:** React
- **Build Tool:** Vite
- **UI Components:** `shadcn/ui`
- **Styling:** Tailwind CSS
- **Server State Management:** TanStack Query
- **Tables & Forms:** TanStack Table and TanStack Form.
- **Form Validation:** `zod` via `@tanstack/zod-form-adapter`, using shared schemas.
- **Real-time Communication:** `socket.io-client`
- **CAPTCHA:** `react-google-recaptcha`
- **File Preview:** `yet-another-react-lightbox` for viewing attached images and TXT files.

##### 3\.4. Shared Packages

- **`packages/schemas`:** A dedicated package (`@acme/schemas`) to define and export shared Zod validation schemas. This serves as the "Single Source of Truth" for data validation across the frontend and backend.
- **`packages/tsconfig`:** A central package for shared `tsconfig.json` configurations to ensure TypeScript consistency.

---

### 4\. Key Entities & Data Schemas

##### 4\.1. Zod Schema (`@acme/schemas`)

The primary data validation schema, `createCommentSchema`, is defined as follows:

```
// packages/schemas/src/comment.schema.ts

import { z } from 'zod';

export const createCommentSchema = z.object({
  userName: z.string().regex(/^[a-zA-Z0-9]+$/, 'Username must contain only Latin letters and numbers.'),
  email: z.string().email('Invalid email format.'),
  homePage: z.string().url('Invalid URL format.').optional(),
  text: z.string().min(1, 'Text cannot be empty.'),
});
```

##### 4\.2. Database Schema (PostgreSQL)

The database will contain two main tables. The design must support nested comments.

- **`comments` table:**
  - `id` (Primary Key, e.g., UUID or SERIAL)
  - `user_name` (VARCHAR)
  - `email` (VARCHAR)
  - `home_page` (VARCHAR, nullable)
  - `text` (TEXT)
  - `parent_id` (Foreign Key to `comments.id`, nullable, for nesting)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
- **`attachments` table:**
  - `id` (Primary Key)
  - `comment_id` (Foreign Key to `comments.id`)
  - `file_url` (VARCHAR, path to the stored file)
  - `file_type` (ENUM or VARCHAR, e.g., 'image', 'text')

---

### 5\. Development Principles & Constraints

Adherence to these principles is mandatory to ensure a high-quality, maintainable, and scalable codebase.

##### 5\.1. TypeScript Best Practices

- **Strict Mode:** All `tsconfig.json` files **must** have `"strict": true` enabled.
- **No `any`:** The `any` type is forbidden. Use `unknown` for values whose type is truly unknown and perform type-checking before use.
- **Type Inference:** Rely on TypeScript's type inference for local variables. Explicitly type only function boundaries (parameters and return values).
- **Immutability:** Use the `readonly` modifier for properties and parameters where applicable to prevent accidental mutations.
- **Dependency Management:** All `@types/*` packages **must** be in `devDependencies`.

##### 5\.2. NestJS Best Practices

- **Structure:** Follow the canonical "one module per feature" structure. Use the NestJS CLI (`nest g ...`) to generate modules, services, and controllers.
- **Separation of Concerns (SOLID):**
  - **Controllers:** Handle HTTP requests, validate DTOs, and call a single service method. No business logic.
  - **Services:** Contain all business logic. They are unaware of HTTP.
  - **Repositories:** Handle direct database interaction (via Drizzle ORM).
- **Validation:** Use DTOs for all incoming data and enable a global `ValidationPipe` in `main.ts` for automatic validation.
- **Configuration:** Do not hardcode values. Use `.env` files and the `@nestjs/config` module.
- **Error Handling:** Use built-in NestJS exception classes (`NotFoundException`, `BadRequestException`, etc.).

---

### 6\. Final Deliverables

The final product must be fully containerized and ready for deployment.

- **Dockerization:**
  - A multi-stage `Dockerfile` for the NestJS backend (`apps/api`).
  - A multi-stage `Dockerfile` for the React frontend (`apps/web`) that serves static files using **Nginx**.
  - A root `docker-compose.yml` file to orchestrate the `api`, `web`, and `db` services.
- **Documentation:**
  - A detailed `README.md` file that includes:
  - A project overview.
  - Step-by-step instructions for a fresh setup and launch.
  - A database schema diagram generated using **Mermaid**.
- **Database Schema:** A file containing the database schema for analysis.
