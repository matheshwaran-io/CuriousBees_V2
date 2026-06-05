## Description

Please include a summary of the change, the problem it solves, and the motivation behind it.

Fixes # (issue link, if applicable)

## Type of Change

Please mark the relevant option:
- [ ] `feat`: A new feature (e.g. workspace component)
- [ ] `fix`: A bug fix (e.g. API connection issues)
- [ ] `docs`: Documentation updates only
- [ ] `refactor`: Structural rewrite (no behavior changes)
- [ ] `chore`: Dependency updates, config scripts, metadata

## Checklist

- [ ] My code follows the [CONTRIBUTING.md](../CONTRIBUTING.md) rules.
- [ ] My branch matches the naming rule: `feature/<name>`, `bugfix/<name>`, `docs/<name>`, `refactor/<name>`, or `chore/<name>`.
- [ ] My commits adhere to the Conventional Commits specification (e.g., `feat(web): ...` or `fix(api): ...`).
- [ ] TypeScript checks passed successfully (`npm run typecheck`).
- [ ] ESLint linter checks passed successfully (`npm run lint`).
- [ ] I have verified these changes locally on my operating system.
- [ ] I have updated relevant documentation files if required.

## Database & Schema Updates

- [ ] Does this PR modify the Prisma schema (`schema.prisma`)?
  - If yes, did you include the migration files (`prisma/migrations`)?
  - If yes, did you run `npm run db:generate` to compile client bindings?
