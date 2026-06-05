# Contributing to CuriousBees

We welcome contributions to CuriousBees! This guide outlines our branching strategies, commit message standards, code review workflows, and code quality expectations.

---

## 1. Branching Strategy

We follow a structured Git Flow to maintain repository health:

* **`main`**: Production-ready branch. Continuous deployment runs from here. Direct commits are strictly prohibited.
* **`develop`**: Central integration branch for active development. Feature branches merge into `develop`.
* **`feature/<ticket-or-name>`**: For new features or enhancements (e.g. `feature/workspace-chat`).
* **`bugfix/<ticket-or-name>`**: For bug fixes (e.g. `bugfix/token-timeout`).
* **`hotfix/<ticket-or-name>`**: For critical patches branching directly from `main`.

---

## 2. Commit Message Conventions

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This enforces readability and enables automated changelog generation.

### Commit Format
```text
<type>(<scope>): <subject>

[optional body]
```

### Commit Types
* **`feat`**: A new feature (e.g., `feat(auth): add local bypass switcher`)
* **`fix`**: A bug fix (e.g., `fix(web): prevent redirect loops in dev mode`)
* **`docs`**: Changes to documentation only (e.g., `docs: add Windows onboarding guide`)
* **`style`**: Changes that do not affect code logic (formatting, white-space, semi-colons)
* **`refactor`**: Code restructuring that neither fixes a bug nor adds a feature
* **`test`**: Adding or correcting unit/integration tests
* **`chore`**: Maintenance, build tool, or package dependency updates

---

## 3. Pull Request (PR) Workflow

1. **Branch**: Create your branch from the latest state of `develop`.
2. **Develop**: Write code adhering to project standards. Ensure you add type definitions and clean up unused declarations.
3. **Format & Lint**: Run quality checkers locally:
   ```bash
   npm run lint
   npm run typecheck
   ```
4. **Push & Open PR**: Push your branch to GitHub and create a PR targeting `develop`.
5. **Describe**: Complete the PR description template. Explain *why* the changes were made, and link relevant issue tickets.
6. **Review**: Assign reviewers. All PRs must receive at least **one approved review** from a core maintainer before merging.

---

## 4. Development Standards

To keep the CuriousBees codebase clean and maintainable, adhere to these guidelines:
* **TypeScript Strictness**: Avoid using the `any` type. Explicitly define return types for all public class methods and API requests.
* **Linter Warnings**: Do not commit code containing active ESLint warnings or TypeScript errors.
* **State Operations**: Prefer asynchronous operations (`async/await`) over promise-chaining (`.then()`).
* **Comments & Docstrings**: Document complex business logic, helper algorithms, or edge cases. Keep comments clear and descriptive.
