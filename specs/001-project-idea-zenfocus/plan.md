# Implementation Plan: ZenFocus - Minimalistic Focus & Wellness Web App

**Branch**: `001-project-idea-zenfocus` | **Date**: 2025-09-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-project-idea-zenfocus/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

ZenFocus is a minimalistic focus and wellness web application that provides customizable Pomodoro-style timers with four distinct session modes (Study, Deep Work, Yoga, Zen). The application features visual progress indicators, theme customization, ambient sounds, session history tracking, and user authentication. Built as a modern web application using Next.js with real-time timer functionality and optional cloud data persistence.

## Technical Context

**Language/Version**: TypeScript/JavaScript with Next.js 14+ (App Router)
**Primary Dependencies**: Next.js, React, Tailwind CSS, shadcn/ui components, AWS Amplify (Auth, DataStore, Hosting)
**Storage**: AWS Amplify DataStore for user sessions/preferences, Local Storage for guest sessions, S3 for ambient audio files
**Testing**: Jest with React Testing Library for unit tests, Playwright for E2E testing
**Target Platform**: Web browsers (modern ES2020+ support), responsive design for mobile/desktop
**Project Type**: web - determines frontend + backend structure
**Performance Goals**: <100ms timer precision, 60fps animations, <3s initial load time
**Constraints**: Offline-capable timer functionality, <50MB bundle size, WCAG 2.1 accessibility
**Scale/Scope**: 1000+ concurrent users, 4 session modes, 5 core pages, guest + authenticated flows

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Constitution Status**: Template constitution detected - no specific constitutional requirements identified.
**Project Complexity**: Standard web application with reasonable scope
**Gate Result**: PASS - No constitutional violations detected

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 - Web application structure (frontend + backend detected in Technical Context)

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- **Contract Tests**: API endpoint testing (auth, users, sessions, custom-intervals, timer)
- **Data Model Tasks**: TypeScript interfaces and validation for User, Session, SessionMode, CustomInterval, TimerState
- **Integration Tests**: End-to-end user story validation from quickstart scenarios
- **Component Implementation**: React components following shadcn/ui patterns
- **Service Layer**: Timer logic, audio management, state persistence, API integration

**Ordering Strategy** (TDD Approach):

1. **Foundation** [P]: Project setup, dependencies, basic structure
2. **Data Models** [P]: TypeScript interfaces, validation schemas
3. **Contract Tests** [P]: API endpoint tests (must fail initially)
4. **Core Services**: Timer engine, state management, audio system
5. **Authentication**: Amplify Auth integration, user management
6. **UI Components**: Timer display, controls, session modes, preferences
7. **Integration**: API integration, data persistence, sync logic
8. **E2E Tests**: Full user journey validation

**Specific Task Categories**:

- **Setup Tasks**: Next.js project, Tailwind, shadcn/ui, Amplify configuration
- **Model Tasks**: 5 data model implementations with validation
- **API Tasks**: 12 endpoint implementations (auth, users, sessions, intervals, timer)
- **Timer Tasks**: Core timer logic, precision handling, state persistence
- **Audio Tasks**: Ambient sound system, volume control, caching
- **UI Tasks**: 15+ React components (timer, controls, modes, settings, history)
- **Integration Tasks**: Auth flow, data sync, offline handling
- **Testing Tasks**: Unit tests, integration tests, E2E scenarios

**Parallel Execution Markers [P]**:

- All contract tests (independent endpoint testing)
- All data model implementations (independent schemas)
- Most UI components (minimal interdependencies)
- Setup and configuration tasks

**Estimated Output**: 45-50 numbered, ordered tasks in tasks.md

- Phase 1 (Setup): Tasks 1-8
- Phase 2 (Models/Contracts): Tasks 9-20
- Phase 3 (Core Logic): Tasks 21-30
- Phase 4 (UI Components): Tasks 31-42
- Phase 5 (Integration/Testing): Tasks 43-50

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented (none identified)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
