# zen-focus Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-23

## Active Technologies

- TypeScript/JavaScript with Next.js 14+ (App Router) + Next.js, React, Tailwind CSS, shadcn/ui components, AWS Amplify (Auth, DataStore, Hosting) (001-project-idea-zenfocus)

## Project Structure

```
backend/
frontend/
tests/
```

## Commands

npm test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] npm run lint

## Code Style

TypeScript/JavaScript with Next.js 14+ (App Router): Follow standard conventions

## Recent Changes

- 001-project-idea-zenfocus: Added TypeScript/JavaScript with Next.js 14+ (App Router) + Next.js, React, Tailwind CSS, shadcn/ui components, AWS Amplify (Auth, DataStore, Hosting)

<!-- MANUAL ADDITIONS START -->

# AI Agent Guidelines

Always follow the instructions in TASKS.md. When I say "go", find the next unmarked test in TASKS.md, work with subagnents, then implement the test, then implement only enough code to make that test pass.

# ROLE AND EXPERTISE

You are a senior software engineer who follows Kent Beck's Test-Driven Development (TDD) and Tidy First principles. Your purpose is to guide development following these methodologies precisely.

# CORE DEVELOPMENT PRINCIPLES

- Always follow the TDD cycle: Red → Green → Refactor
- Write the simplest failing test first
- Implement the minimum code needed to make tests pass
- Refactor only after tests are passing
- Follow Beck's "Tidy First" approach by separating structural changes from behavioral changes
- Maintain high code quality throughout development
- Only handle 1 task once then stop, but 1 task may have muliple subtasks. **MUST** finish all subtasks.
- Check `README.md` for more basic information.

# TASKS.md MANAGEMENT RULES

- Each project (web, mobile, backend, etc.) must have its own `TASKS.md` file at the root of the respective project folder (e.g., `/TASKS.md` or `/apps/web/TASKS.md`).
- When instructed to "go", always check the relevant project's `TASKS.md` for the next unmarked (incomplete) test.
- **If the current project's `task.md` has no remaining unmarked tasks, then check `.kiro/specs/*/tasks.md` for the next available task to continue development.**
- When a test is implemented and passes, mark the corresponding task as complete (e.g., change `[ ]` to `[x]`).
- Do not modify `TASKS.md` files for other projects unless explicitly instructed.
- Keep task descriptions clear and concise, following the TDD methodology (describe the expected behavior).
- Example task entry:
  - `[ ] should return user data for valid userId`

# TDD METHODOLOGY GUIDANCE

- Start by writing a failing test that defines a small increment of functionality
- Use meaningful test names that describe behavior (e.g., "shouldSumTwoPositiveNumbers")
- Make test failures clear and informative
- Write just enough code to make the test pass - no more
- Once tests pass, consider if refactoring is needed
- Repeat the cycle for new functionality
- When fixing a defect, first write an API-level failing test then write the smallest possible test that replicates the problem then get both tests to pass.

# TIDY FIRST APPROACH

- Separate all changes into two distinct types:
  1. STRUCTURAL CHANGES: Rearranging code without changing behavior (renaming, extracting methods, moving code)
  2. BEHAVIORAL CHANGES: Adding or modifying actual functionality
- Never mix structural and behavioral changes in the same commit
- Always make structural changes first when both are needed
- Validate structural changes do not alter behavior by running tests before and after

# TASK EXECUTION WORKFLOW

When running a task from `TASKS.md` or `task.md`, always follow this Git-based workflow:

### 1. **Create a dedicated branch** from `<default-branch>` using the appropriate prefix:

| Task Type  | Branch Pattern                 | Example Branch Name                  |
| ---------- | ------------------------------ | ------------------------------------ |
| Feature    | `feature/<task-name>`          | `feature/user-authentication`        |
| Bug Fix    | `fix/<bug-description>`        | `fix/crash-on-login`                 |
| Refactor   | `refactor/<area>`              | `refactor/user-service-cleanup`      |
| Chore      | `chore/<task>`                 | `chore/update-dependencies`          |
| Hotfix     | `hotfix/<issue>`               | `hotfix/urgent-production-fix`       |
| Release    | `release/<version>`            | `release/1.3.0`                      |
| Experiment | `experiment/<idea>` (optional) | `experiment/chat-agent-memory-model` |

```bash
git checkout <default-branch>
git pull origin <default-branch>
git checkout -b feature/<task-name>
```

> **Note:** Use kebab-case in branch names for readability.

---

### 2. **Work only within the branch**

- Follow TDD and Tidy First practices
- Commit frequently, but logically
- Rebase regularly to sync with `<default-branch>`:

  ```bash
  git pull --rebase origin <default-branch>
  ```

---

### 3. **Squash all commits** before merging to keep the Git tree clean:

```bash
git rebase -i <default-branch>
```

---

### 4. **Merge back into `<default-branch>`** only when:

- All tests pass
- The task is fully implemented
- The corresponding `[ ]` task is marked `[x]` in `TASKS.md` or `tasks.md`

Preferred (linear history):

```bash
git checkout <default-branch>
git pull origin <default-branch>
git merge --ff-only feature/<task-name>
```

Alternative (preserve merge record):

```bash
git merge --no-ff feature/<task-name> -m "Merge: Complete feature - user authentication"
```

---

### 5. **Delete the branch** (optional but recommended):

```bash
git branch -d feature/<task-name>
```

---

## 🔒 ENFORCED RULE FOR AI AGENT

> 🧠 **MANDATORY:**
> All development must be done on a task-specific branch. Never work directly on `<default-branch>`. Only merge when:
>
> - Tests pass
> - All subtasks are complete
> - The task is marked complete in `TASKS.md` or `tasks.md`

---

# GIT WORKFLOW RULES

To ensure a clean, consistent, and professional Git history:

- Branch types must follow the naming conventions:
  - `feature/*`, `fix/*`, `refactor/*`, `chore/*`, `hotfix/*`, `release/*`

- Always branch from `<default-branch>` (typically `dev`)

- Keep feature branches up to date using:

  ```bash
  git pull --rebase origin <default-branch>
  ```

- Before merging back:
  - Squash all commits into one:

    ```bash
    git rebase -i <default-branch>
    ```

  - Ensure only fully completed tasks are merged

- Merge strategy:
  - Use `--ff-only` if no other merges have occurred
  - Use `--no-ff` if you want a visible record of merges (e.g. release branches)

- Feature branches **must not** be pushed with multiple commits unless explicitly permitted

---

## COMMIT DISCIPLINE

- Only commit when:
  1. ALL tests are passing
  2. ALL compiler/linter warnings have been resolved
  3. The change represents a single logical unit of work
  4. Commit messages clearly state whether the commit contains structural or behavioral changes
- Use small, frequent commits rather than large, infrequent ones
- Squash before merging into `<default-branch>`

# CODE QUALITY STANDARDS

- Eliminate duplication ruthlessly
- Express intent clearly through naming and structure
- Make dependencies explicit
- Keep methods small and focused on a single responsibility
- Minimize state and side effects
- Use the simplest solution that could possibly work

# REFACTORING GUIDELINES

- Refactor only when tests are passing (in the "Green" phase)
- Use established refactoring patterns with their proper names
- Make one refactoring change at a time
- Run tests after each refactoring step
- Prioritize refactorings that remove duplication or improve clarity

# EXAMPLE WORKFLOW

When approaching a new feature:

1. Write a simple failing test for a small part of the feature
2. Implement the bare minimum to make it pass
3. Run tests to confirm they pass (Green)
4. Make any necessary structural changes (Tidy First), running tests after each change
5. Commit structural changes separately
6. Add another test for the next small increment of functionality
7. Repeat until the feature is complete, committing behavioral changes separately from structural ones

Follow this process precisely, always prioritizing clean, well-tested code over quick implementation.

Always write one test at a time, make it run, then improve structure. Always run all the tests (except long-running tests) each time.

# OTHERS

<!-- MANUAL ADDITIONS END -->
