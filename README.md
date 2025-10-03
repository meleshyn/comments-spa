# Comments SPA

A feature-rich, high-performance Single-Page Application for nested commenting with file attachments, built using modern web technologies and best practices.

![Turborepo](https://img.shields.io/badge/Turborepo-2C3E50?style=for-the-badge&logo=turborepo&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-CC3366?style=for-the-badge&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-007ACC?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2C3E50?style=for-the-badge&logo=docker&logoColor=white)

## ✨ Features

### 💬 Advanced Commenting System

- **Infinite Nesting**: Create threaded discussions with unlimited depth
- **Rich Text Editor**: TipTap-powered editor with formatting support (`<a>`, `<code>`, `<i>`, `<strong>`)
- **Smart Sorting**: Sort comments by username, email, or creation date (ascending/descending)
- **Pagination**: Efficient cursor-based pagination with 25 comments per page
- **Lazy Loading**: On-demand loading of nested replies for optimal performance

### 📎 File Attachments

- **Image Support**: Upload JPG, GIF, PNG images (automatically resized to 320x240px)
- **Text Files**: Upload .txt files up to 100KB
- **Instant Preview**: Real-time preview of selected files before submission
- **Cloud Storage**: Files stored securely in Google Cloud Storage
- **Lightbox Viewer**: Full-screen viewing experience for images and text files

### 🔒 Security & Performance

- **CAPTCHA Protection**: Google reCAPTCHA integration to prevent spam
- **XSS Prevention**: Content sanitization with DOMPurify
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM
- **Input Validation**: Comprehensive Zod schema validation
- **Optimistic Updates**: Instant UI feedback with TanStack Query
- **Skeleton Loading**: Progressive loading states for smooth UX

### 🎨 Modern UI/UX

- **Material Design 3**: Consistent design system with dark theme optimization
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Visual Hierarchy**: Clear indentation and borders for nested conversations

## 🏗️ Architecture

This project is a **Turborepo** monorepo containing:

```
comments-spa/
├── apps/
│   ├── api/          # NestJS backend with Drizzle ORM
│   └── web/          # React frontend with Vite
├── packages/
│   ├── schemas/      # Shared Zod validation schemas
│   └── tsconfig/     # Shared TypeScript configurations
└── docker-compose.yaml # Production deployment
```

### Backend (NestJS)

- **Framework**: NestJS with modular architecture
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Google Cloud Storage
- **Validation**: Zod schemas with shared validation logic
- **Security**: Helmet, CORS, and rate limiting

### Frontend (React)

- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Shadcn/ui with Tailwind CSS
- **State Management**: TanStack Query for server state
- **Rich Text**: TipTap editor with custom extensions
- **Forms**: React Hook Form with Zod validation
- **File Handling**: Multipart form uploads with preview

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm**
- **Docker** and **Docker Compose**
- **Google Cloud Storage** account (for file uploads)

### Local Development

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Start Database**

   ```bash
   docker run --name comments_db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=comments_spa \
     -p 5432:5432 -d postgres:17-alpine
   ```

3. **Configure Environment**

   ```bash
   # Copy environment files
   cp apps/api/env.example apps/api/.env
   cp apps/web/env.example apps/web/.env
   ```

4. **Configure Google Cloud Storage** (Optional for file uploads)

   ```bash
   # For file upload functionality, set up GCS credentials:
   # 1. Create a service account in Google Cloud Console
   # 2. Download the JSON key file
   # 3. Copy the credentials template
   cp apps/api/gcs-credentials.example.json apps/api/gcs-credentials.json
   # 4. Replace the placeholder values in gcs-credentials.json with your actual credentials
   # 5. For detailed setup instructions, see:
   #    https://cloud.google.com/docs/authentication/getting-started
   ```

   > **Note**: File uploads are optional. The commenting system works without GCS configuration, but image and text file attachments require proper GCS setup.

5. **Run Database Migrations**

   ```bash
   pnpm --filter api db:migrate
   ```

6. **Start Development Servers**
   ```bash
   pnpm dev
   ```

## 📡 API Endpoints

### Comments

- `GET /comments` - Fetch paginated root comments with sorting
- `GET /comments/:id/replies` - Fetch replies to a specific comment
- `POST /comments` - Create a new comment with optional file attachments

### Query Parameters

- `limit` (1-100, default: 25)
- `cursor` (UUID for pagination)
- `sortBy` (`userName`, `email`, `createdAt`)
- `sortOrder` (`asc`, `desc`)

## 🐳 Production Deployment

1. **Configure Environment**

   ```bash
   # Copy and configure production environment
   cp env.example .env
   ```

   > **Note**: The `gcs-credentials.json` file is automatically created from the `GCS_KEY_FILE_CONTENT` environment variable during the container startup process via the `entrypoint.sh` script. This approach keeps sensitive credentials secure while maintaining deployment flexibility.

2. **Deploy with Docker Compose**
   ```bash
   docker-compose up --build -d
   ```

The application will be available at:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000

## 📊 Performance Features

### Database Optimization

- **Cursor-based Pagination**: Consistent performance regardless of dataset size
- **N+1 Query Prevention**: Efficient SQL queries with subquery optimization
- **Indexing Strategy**: Optimized indexes for sorting and filtering operations

### Frontend Performance

- **Code Splitting**: Lazy-loaded components and routes
- **Caching Strategy**: Intelligent TanStack Query caching with stale-time management
- **Optimistic Updates**: Instant UI feedback for better perceived performance
- **Skeleton Loading**: Progressive content loading with placeholder states

## 🔒 Security Features

### Input Validation & Sanitization

- **Zod Schemas**: Runtime type validation for all inputs
- **DOMPurify**: XSS protection for user-generated content
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM

### File Upload Security

- **File Type Validation**: Strict MIME type checking on both client and server
- **Size Limits**: Configurable file size restrictions
- **Secure Storage**: Private cloud storage with access controls

### Authentication & Authorization

- **CAPTCHA Integration**: Google reCAPTCHA for spam prevention
- **CORS Configuration**: Secure cross-origin resource sharing
- **Helmet Security Headers**: Comprehensive HTTP security headers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Bug reports and feature requests via GitHub Issues
- **Discussions**: Community discussions and Q&A on GitHub Discussions

---

**Built with ❤️ using modern web technologies and best practices**
