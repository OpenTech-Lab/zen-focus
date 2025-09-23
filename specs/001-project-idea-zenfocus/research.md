# Research Report: ZenFocus Web Application

**Date**: 2025-09-23
**Phase**: 0 - Outline & Research
**Purpose**: Resolve technical unknowns and establish implementation approach

## Technology Stack Research

### Frontend Framework: Next.js 14+ with App Router
**Decision**: Next.js 14+ with App Router
**Rationale**:
- Provides excellent React integration with built-in optimization
- App Router offers improved routing and loading states
- Strong TypeScript support
- Built-in performance optimizations (code splitting, image optimization)
- Excellent developer experience with hot reloading
**Alternatives considered**:
- Vite + React: Good performance but requires more configuration
- Create React App: Deprecated and less performant
- Nuxt.js: Vue-based, not aligned with React ecosystem choice

### UI Component Library: shadcn/ui
**Decision**: shadcn/ui with Tailwind CSS
**Rationale**:
- Copy-paste component library for better customization
- Built on Radix UI primitives for accessibility
- Excellent TypeScript support
- Highly customizable for minimalist design requirements
- No runtime dependencies (components are copied to project)
**Alternatives considered**:
- Material-UI: Too opinionated styling, harder to achieve minimalist look
- Chakra UI: Good but less flexibility for custom design systems
- Ant Design: Too enterprise-focused for minimalist wellness app

### State Management: React Context + useState/useReducer
**Decision**: React Context for global state, local state for component-specific data
**Rationale**:
- Timer state needs to be global (shared across components)
- Authentication state needs persistence
- Settings/preferences need global access
- Avoid complexity of Redux for this app size
**Alternatives considered**:
- Redux Toolkit: Overkill for application scope
- Zustand: Good option but React Context sufficient for needs
- Jotai: Atomic approach but unnecessary complexity

### Real-time Timer Implementation
**Decision**: setInterval with useEffect hooks, Web Workers for background execution
**Rationale**:
- setInterval provides adequate precision for timer needs
- Web Workers ensure timer continues when tab is backgrounded
- Browser Page Visibility API to handle tab focus/blur
- Local Storage for persistence during browser refresh
**Alternatives considered**:
- requestAnimationFrame: Better for animations but overkill for 1-second intervals
- Web Workers only: More complex setup for simple timer needs
- Service Workers: Unnecessary complexity for offline-first requirement

### Authentication & Data Storage: AWS Amplify
**Decision**: AWS Amplify Auth + DataStore for authenticated users, Local Storage for guests
**Rationale**:
- Amplify Auth provides OAuth and email/password authentication
- DataStore offers offline-first data synchronization
- S3 integration for ambient audio file storage
- Amplify Hosting for easy deployment and CI/CD
**Alternatives considered**:
- Firebase: Good alternative but AWS ecosystem alignment preferred
- Auth0: Third-party service adds dependency and cost
- Custom authentication: Too much complexity for MVP

## Clarification Resolutions

### Session Persistence Across Browser Sessions
**Resolution**: Implement tiered persistence strategy
- **Guest users**: Local Storage (sessions lost on browser data clear)
- **Authenticated users**: Amplify DataStore (persistent across devices)
- **Active sessions**: Session Storage + Local Storage backup (persist through page refresh, not browser restart)

### Data Retention Period
**Resolution**: Implement configurable retention with defaults
- **Session history**: 12 months for authenticated users, 30 days local storage for guests
- **User preferences**: Indefinite (until user deletion)
- **Active sessions**: 24 hours maximum (auto-reset abandoned sessions)
- **Audio cache**: 7 days local cache, permanent S3 storage

### Yoga Mode Interval Structure
**Resolution**: Flexible interval system with presets
- **Breathing exercises**: 4-7-8 pattern (4s inhale, 7s hold, 8s exhale) with customizable ratios
- **Pose intervals**: 30s-5min holds with transition periods
- **Custom mode**: User-defined work/rest intervals with descriptive labels
- **Preset options**: Beginner (30s poses), Intermediate (1min), Advanced (2min+)

## Audio Implementation Research

### Ambient Sound System
**Decision**: Streaming from S3 with local caching
**Rationale**:
- S3 provides reliable, scalable audio hosting
- Local caching reduces bandwidth after first play
- Web Audio API for precise control and mixing
- Progressive loading for larger audio files
**Technical approach**:
- MP3 format for broad compatibility
- Loop-enabled ambient tracks (rain, forest, ocean)
- Volume control with fade in/out transitions
- Preload mechanism for selected ambient sounds

### Browser Audio Permissions
**Decision**: User-initiated audio with graceful fallbacks
**Rationale**:
- Modern browsers require user interaction for audio
- Provide clear audio enable/disable controls
- Visual-only mode as fallback when audio unavailable
**Implementation**:
- Audio context initialization on first user interaction
- Clear UI indicators for audio state
- Silent audio preloading to avoid permission delays

## Performance & Accessibility Research

### Timer Precision Requirements
**Decision**: 100ms precision with 1000ms visual updates
**Rationale**:
- Human perception doesn't require sub-100ms accuracy for focus timers
- 1-second visual updates provide smooth user experience
- High-precision tracking internally for accurate session recording
**Implementation**:
- Internal timer tracking at 100ms intervals
- UI updates throttled to 1-second intervals
- Drift correction to maintain long-term accuracy

### Accessibility Standards
**Decision**: WCAG 2.1 AA compliance
**Requirements**:
- High contrast theme options
- Keyboard navigation for all timer controls
- Screen reader support for timer status
- Reduced motion options for animations
- Focus indicators for all interactive elements

## Mobile Responsiveness
**Decision**: Mobile-first responsive design
**Rationale**:
- Many users will use focus timers on mobile devices
- Touch-friendly controls for timer management
- Optimized layouts for small screens
**Implementation**:
- Tailwind CSS responsive breakpoints
- Touch gesture support for timer controls
- Progressive Web App (PWA) capabilities for mobile installation

## Bundle Size Optimization
**Decision**: Code splitting and lazy loading strategy
**Targets**:
- Initial bundle: <500KB gzipped
- Ambient audio: Lazy loaded on first use
- Authentication: Lazy loaded on login attempt
- Settings: Lazy loaded on first access
**Techniques**:
- Next.js automatic code splitting
- Dynamic imports for heavy features
- Tree shaking for unused utilities
- Image optimization for theme assets

---

**Research Status**: ✅ Complete - All technical unknowns resolved
**Next Phase**: Design & Contracts (Phase 1)