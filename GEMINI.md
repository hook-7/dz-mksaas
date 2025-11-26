# GEMINI.md: MkSaaS Template Project Guide

This document provides a comprehensive overview of the MkSaaS template project, its structure, and key operational commands. It is intended to be a quick reference guide for developers.

## Project Overview

MkSaaS is a Next.js boilerplate designed for building Software-as-a-Service (SaaS) applications. It comes pre-configured with a rich set of features, including:

*   **Authentication:** Handled by Better Auth, supporting both email/password and OAuth (GitHub, Google) logins.
*   **Database:** Uses PostgreSQL with Drizzle ORM for database access and schema management.
*   **Payments:** Integrated with Stripe for handling subscriptions and one-time payments.
*   **Internationalization (i18n):** Supports multiple languages (English and Chinese by default) using `next-intl`.
*   **AI:** Includes support for various AI providers like OpenAI, Google Gemini, and more, managed through the AI SDK.
*   **UI:** Built with a combination of Radix UI for accessible components, Tailwind CSS for styling, and additional component libraries like Magic UI.
*   **Content:** Manages blog posts and documentation using `fumadocs-mdx`.

The project is structured using the Next.js App Router, with a clear separation of concerns for different modules like `auth`, `payment`, `db`, and `ai`.

## Building and Running

### Environment Setup

1.  **Prerequisites:**
    *   Node.js 18+
    *   pnpm
    *   PostgreSQL
    *   Git

2.  **Installation:**
    ```bash
    pnpm install
    ```

3.  **Configuration:**
    Copy the example environment file and fill in the necessary values, especially for the database and authentication.
    ```bash
    cp env.example .env
    ```

### Key Commands

The following commands are defined in `package.json`:

*   **Run development server:**
    ```bash
    pnpm dev
    ```

*   **Create a production build:**
    ```bash
    pnpm build
    ```

*   **Start the production server:**
    ```bash
    pnpm start
    ```

*   **Lint and format code:**
    Uses Biome.js for checking and formatting.
    ```bash
    # Check and apply fixes
    pnpm lint

    # Format code
    pnpm format
    ```

### Database Management (Drizzle)

*   **Generate migration files:**
    After modifying `src/db/schema.ts`, run this command to create SQL migration files.
    ```bash
    pnpm db:generate
    ```

*   **Apply migrations:**
    Executes the generated migration files against the database.
    ```bash
    pnpm db:migrate
    ```

*   **Push schema (for development):**
    Directly syncs the database schema without creating migration files. Useful for rapid prototyping.
    ```bash
    pnpm db:push
    ```

*   **Open Drizzle Studio:**
    A local GUI to browse and manage your database.
    ```bash
    pnpm db:studio
    ```

### Email Previews

*   **Start the email preview server:**
    The project uses `react-email` to build email templates.
    ```bash
    pnpm email
    ```
    This will open a preview environment at `http://localhost:3333`.

## Development Conventions

*   **Project Structure:** The core logic is located in the `src/` directory.
    *   `src/app`: Next.js App Router pages and API routes.
    *   `src/components`: Reusable React components.
    *   `src/actions`: Server Actions, using `next-safe-action` for type safety.
    *   `src/db`: Drizzle ORM schema and migration files.
    *   `src/lib`: Utility functions and core library initializations (e.g., auth, safe-action).
    *   `src/stores`: Zustand stores for global state management.
    *   `messages/`: i18n translation files.
*   **Code Style:** The project uses Biome.js for formatting and linting. Adhere to the existing style (2-space indentation, single quotes, etc.).
*   **Type Safety:** TypeScript is used throughout the project. Zod is used for data validation, especially within Server Actions.
*   **Server Logic:** Prefer using Server Actions (`src/actions/`) for most client-server communication to ensure type safety and security.
*   **State Management:** For complex client-side state, Zustand is the preferred solution.
