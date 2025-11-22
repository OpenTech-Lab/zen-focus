# Contributing to zenFocus

Thank you for your interest in contributing to zenFocus! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [TDD Methodology](#tdd-methodology)
- [Git Workflow](#git-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Commit Message Conventions](#commit-message-conventions)
- [Project Structure](#project-structure)
- [Questions and Support](#questions-and-support)

## Code of Conduct

This project follows a professional and respectful code of conduct. We expect all contributors to:

- Be respectful and inclusive in communication
- Focus on constructive feedback
- Accept responsibility and apologize for mistakes
- Prioritize what's best for the community

## Getting Started

Before you begin contributing, please:

1. Read through this entire contributing guide
2. Review the [README.md](./README.md) for project overview
3. Check the [TASKS.md](./TASKS.md) for current development tasks
4. Look at existing [issues](../../issues) to find areas where you can help

## Development Setup

### Prerequisites

- Node.js (>=18)
- pnpm (recommended), npm, or yarn
- Git
- AWS CLI (optional, for Amplify setup)

### Installation Steps

1. **Fork and clone the repository**

```bash
git clone https://github.com/your-username/zen-focus.git
cd zen-focus
```

2. **Install dependencies**

```bash
pnpm install
# or: npm install / yarn install
```

3. **Set up environment variables**

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_APP_NAME=zenFocus
AMPLIFY_ENV=dev
AMPLIFY_API_URL=<your-api-url>
```

4. **Run the development server**

```bash
pnpm dev
```

The app should now be running at [http://localhost:3000](http://localhost:3000)

### Verify Your Setup

Run the test suite to ensure everything is working:

```bash
pnpm test
```

Run the linter:

```bash
pnpm lint
```

## Development Workflow

This project follows **Test-Driven Development (TDD)** and **Tidy First** principles, inspired by Kent Beck's methodologies.

### The TDD Cycle

All development follows the Red-Green-Refactor cycle:

1. **RED**: Write a failing test that defines the desired behavior
2. **GREEN**: Write the minimum code needed to make the test pass
3. **REFACTOR**: Improve the code structure while keeping tests green

### Tidy First Approach

We separate changes into two distinct types:

1. **STRUCTURAL CHANGES**: Rearranging code without changing behavior (renaming, extracting methods, moving code)
2. **BEHAVIORAL CHANGES**: Adding or modifying actual functionality

**Important Rules:**

- Never mix structural and behavioral changes in the same commit
- Always make structural changes first when both are needed
- Run tests before and after structural changes to ensure behavior is unchanged

### Example Workflow

When implementing a new feature:

1. Write a simple failing test for a small part of the feature
2. Implement the bare minimum to make it pass
3. Run tests to confirm they pass (Green)
4. Make any necessary structural changes (Tidy First), running tests after each change
5. Commit structural changes separately
6. Add another test for the next small increment of functionality
7. Repeat until the feature is complete

## TDD Methodology

### Writing Tests

- Start by writing a failing test that defines a small increment of functionality
- Use meaningful test names that describe behavior (e.g., `shouldReturnUserDataForValidUserId`)
- Make test failures clear and informative
- Write just enough code to make the test pass - no more
- Once tests pass, consider if refactoring is needed

### Test Organization

- Unit tests: Test individual functions and components in isolation
- Integration tests: Test how components work together
- All tests are located in the `tests/` directory
- Use Vitest as the testing framework
- Follow existing test patterns in the codebase

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

## Git Workflow

### Branch Naming Conventions

All branches must follow these naming patterns:

| Task Type  | Branch Pattern            | Example                             |
| ---------- | ------------------------- | ----------------------------------- |
| Feature    | `feature/<task-name>`     | `feature/custom-timer-presets`      |
| Bug Fix    | `fix/<bug-description>`   | `fix/timer-reset-issue`             |
| Refactor   | `refactor/<area>`         | `refactor/timer-state-management`   |
| Chore      | `chore/<task>`            | `chore/update-dependencies`         |
| Hotfix     | `hotfix/<issue>`          | `hotfix/critical-timer-bug`         |
| Release    | `release/<version>`       | `release/1.0.0`                     |

**Note:** Use kebab-case in branch names for readability.

### Working on a Task

1. **Create a dedicated branch from `dev`**

```bash
git checkout dev
git pull origin dev
git checkout -b feature/<task-name>
```

2. **Work only within the branch**

- Follow TDD and Tidy First practices
- Commit frequently, but logically
- Rebase regularly to sync with `dev`:

```bash
git pull --rebase origin dev
```

3. **Squash all commits before merging**

```bash
git rebase -i dev
```

4. **Merge back into `dev` only when:**

- All tests pass
- The task is fully implemented
- All compiler/linter warnings are resolved

Preferred (linear history):

```bash
git checkout dev
git pull origin dev
git merge --ff-only feature/<task-name>
```

Alternative (preserve merge record):

```bash
git merge --no-ff feature/<task-name> -m "Merge: Complete feature - custom timer presets"
```

5. **Delete the branch (optional but recommended)**

```bash
git branch -d feature/<task-name>
```

## Code Quality Standards

### General Principles

- **Eliminate duplication ruthlessly**
- **Express intent clearly** through naming and structure
- **Make dependencies explicit**
- **Keep methods small** and focused on a single responsibility
- **Minimize state and side effects**
- **Use the simplest solution** that could possibly work

### TypeScript/React Best Practices

- Use TypeScript for all code (`.ts` / `.tsx` files)
- Follow component-driven development with shadcn/ui conventions
- Use functional components with hooks
- Implement proper prop types and interfaces
- Use kebab-case for file names, PascalCase for components

### Code Style

- Run `pnpm lint` before committing
- Follow the existing code style in the project
- Use Tailwind CSS for styling
- Keep components focused and reusable

## Testing

### Test Requirements

- All new features must include tests
- Bug fixes should include a test that reproduces the bug
- Aim for high test coverage, but focus on meaningful tests
- Tests must pass before submitting a PR

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('should describe the expected behavior', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `pnpm test`
2. Run the linter: `pnpm lint`
3. Verify the build works: `pnpm build`
4. Update documentation if needed
5. Squash your commits into logical units

### PR Guidelines

1. **Create a clear PR title** that describes the change
2. **Reference related issues** in the PR description
3. **Provide context** about what changed and why
4. **Include screenshots** for UI changes
5. **List any breaking changes** clearly
6. **Update TASKS.md** if completing a task

### PR Template

```markdown
## Summary

Brief description of the changes

## Related Issues

Fixes #(issue number)

## Changes Made

- Item 1
- Item 2

## Testing

- [ ] Unit tests added/updated
- [ ] All tests passing
- [ ] Manually tested in browser

## Screenshots (if applicable)

[Add screenshots here]
```

### Review Process

- PRs require at least 1 review before merge
- Address all review comments
- Keep discussions professional and constructive
- Reviewers focus on readability, maintainability, and performance

## Commit Message Conventions

### Commit Discipline

Only commit when:

1. ALL tests are passing
2. ALL compiler/linter warnings have been resolved
3. The change represents a single logical unit of work
4. Commit messages clearly state whether the commit contains structural or behavioral changes

### Commit Format

Use conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: A new feature
- `fix`: A bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Changes to build process or auxiliary tools
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `perf`: Performance improvements

**Examples:**

```bash
feat(timer): add custom duration input

Implement custom duration input field for timer component.
Users can now enter any duration in minutes.

Closes #123

---

refactor(timer): extract duration validation logic

Move validation logic to separate utility function
for better testability and reusability.
```

## Project Structure

```
zen-focus/
├── app/               # Next.js App Router entry points
│   └── layout.tsx     # Root layout
├── components/        # Reusable UI components (shadcn/ui + custom)
├── lib/               # Utility functions, API clients
├── styles/            # Global Tailwind styles
├── amplify/           # Amplify backend configs (Gen 2)
├── tests/             # Unit & integration tests
├── public/            # Static assets
├── TASKS.md           # Development task list
├── CLAUDE.md          # AI agent development guidelines
└── README.md          # Project overview
```

### Key Files

- **TASKS.md**: Contains the list of development tasks (check here for work to do)
- **CLAUDE.md**: Development guidelines and TDD/Tidy First principles
- **package.json**: Project dependencies and scripts

## Questions and Support

### Getting Help

- Check existing [issues](../../issues) and discussions
- Review the [README.md](./README.md) and [CLAUDE.md](./CLAUDE.md)
- Create a new issue with the `question` label

### Reporting Bugs

Use the [GitHub Issues](../../issues) with the `bug` label:

1. Describe the bug clearly
2. Include steps to reproduce
3. Provide expected vs actual behavior
4. Include environment details (Node version, OS, browser)
5. Add screenshots if relevant

### Requesting Features

Use the [GitHub Issues](../../issues) with the `enhancement` label:

1. Describe the feature and its use case
2. Explain why it would benefit the project
3. Provide examples if possible

---

Thank you for contributing to zenFocus! Your efforts help make this a better tool for everyone focused on productivity and mindfulness.
