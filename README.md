# DocTemplate — HTML Document Template Platform

A web platform for uploading, managing, filling, editing, and exporting HTML document templates.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Code Editor:** Monaco Editor (via @monaco-editor/react)
- **Visual Editor:** Custom iframe-based editor with contenteditable support
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma 7 ORM
- **Auth:** NextAuth v5 (credentials + Google OAuth)
- **Sanitization:** sanitize-html for XSS protection

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm

## Getting Started

### 1. Install dependencies

```bash
cd doctemplate
npm install
```

### 2. Configure environment

Copy `.env` and set your database URL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/doctemplate?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

### 3. Set up the database

```bash
# Generate Prisma client + push schema + seed with demo data
npm run db:setup
```

This creates:
- Database tables
- Admin user: `admin@doctemplate.local` / `admin123`
- Demo user: `user@doctemplate.local` / `user123`
- 3 sample templates (Application Form, Business Letter, Certificate)

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:setup` | Full DB setup (generate + push + seed) |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
doctemplate/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seed script
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Auth endpoints (NextAuth + register)
│   │   │   ├── templates/     # Template CRUD API
│   │   │   ├── documents/     # Document CRUD API + versions + duplicate
│   │   │   └── upload/        # File upload API
│   │   ├── auth/              # Login & register pages
│   │   ├── templates/         # Template catalog & preview
│   │   ├── documents/         # User document cabinet
│   │   ├── editor/[id]/       # Document editor (visual + code + preview)
│   │   ├── admin/             # Admin panel (template management)
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── editor/
│   │   │   ├── CodeEditor.tsx   # Monaco-based code editor
│   │   │   └── VisualEditor.tsx # Iframe-based visual editor
│   │   └── layout/
│   │       ├── Navbar.tsx       # Navigation bar
│   │       └── SessionProvider.tsx
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── sanitize.ts        # HTML sanitization
│   ├── types/
│   │   └── next-auth.d.ts     # Auth type extensions
│   └── generated/prisma/      # Generated Prisma client
└── public/
    └── uploads/templates/     # Template file storage
```

## Features

### Authentication
- Email/password registration and login
- Google OAuth support
- Role-based access (USER / ADMIN)
- JWT session management

### Template Management
- Upload HTML templates via file or paste
- Template catalog with search and category filtering
- Template preview with sandbox iframe
- Version tracking
- Activate/deactivate templates
- Admin-only deletion

### Document Editor
- **Visual Mode:** Click-to-edit text, contenteditable fields, drag-and-drop block reordering
- **Code Mode:** Full Monaco Editor with HTML syntax highlighting, autocomplete, formatting
- **Preview Mode:** Sandbox iframe rendering
- Seamless mode switching without data loss
- Auto-save every 5 seconds
- Unsaved changes warning on page leave

### Document Management
- Personal document cabinet with search, filter, sort
- Draft and Final status
- Version history with restore capability
- Duplicate documents
- Export as HTML download
- Print directly from browser

### Security
- HTML sanitization on template upload (XSS prevention)
- Sandbox iframes for template rendering
- Password hashing with bcrypt
- Role-based API authorization
- CSRF protection via NextAuth

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@doctemplate.local | admin123 |
| User | user@doctemplate.local | user123 |
