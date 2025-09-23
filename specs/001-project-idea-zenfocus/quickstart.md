# ZenFocus Quickstart Guide

**Purpose**: Validate core user stories through step-by-step testing scenarios
**Date**: 2025-09-23
**Phase**: 1 - Design & Contracts

## Prerequisites

### Environment Setup

- Node.js 18+ installed
- Git repository cloned
- Development server running on `http://localhost:3000`
- Test database/storage configured

### Test Data Requirements

- Clean test environment (no existing user data)
- Sample ambient audio files available
- Mock authentication service configured

## Core User Journey Validation

### Scenario 1: First-Time Guest User Experience

**Objective**: Validate basic timer functionality without authentication

**Steps**:

1. **Navigate to application**
   - Open `http://localhost:3000`
   - Verify: Landing page loads with minimal, clean design
   - Verify: Four session mode tabs visible (Study, Deep Work, Yoga, Zen)

2. **Select Study Mode and start session**
   - Click "Study Mode" tab
   - Verify: Timer displays "25:00" (default Pomodoro)
   - Verify: Start button is prominently displayed
   - Click "Start" button
   - Verify: Timer begins countdown (25:00 → 24:59 → 24:58...)
   - Verify: Visual progress ring/bar shows progress

3. **Test pause and resume functionality**
   - After 30 seconds, click "Pause" button
   - Verify: Timer stops, shows remaining time (e.g., "24:30")
   - Verify: Button changes to "Resume"
   - Click "Resume" button
   - Verify: Timer continues from paused time

4. **Test session completion**
   - Let timer run to completion (or fast-forward for testing)
   - Verify: Notification appears when work period ends
   - Verify: Break timer starts automatically (5:00 countdown)
   - Verify: Visual/audio indication of break period

5. **Verify session persistence**
   - During active session, refresh page
   - Verify: Timer state persists (continues from correct time)
   - Verify: Session mode and settings maintained

**Expected Results**:

- Guest user can start, pause, resume, and complete timer sessions
- Visual feedback is clear and responsive
- Session state persists through page refresh
- Break transitions work automatically

### Scenario 2: Theme and Ambient Sound Customization

**Objective**: Validate theme switching and ambient sound functionality

**Steps**:

1. **Test theme switching**
   - Locate theme toggle control (light/dark mode)
   - Click to switch from light to dark theme
   - Verify: Entire interface switches to dark colors
   - Verify: Timer display remains clearly visible
   - Switch back to light theme
   - Verify: Interface returns to light colors

2. **Test ambient sound selection**
   - Locate ambient sound controls/menu
   - Select "Rain" ambient sound
   - Start a timer session
   - Verify: Rain ambient sound plays during session
   - Verify: Sound continues throughout timer countdown
   - Pause session
   - Verify: Ambient sound pauses with timer
   - Resume session
   - Verify: Ambient sound resumes

3. **Test volume control**
   - Adjust ambient sound volume slider
   - Verify: Volume changes are immediately audible
   - Set volume to 0
   - Verify: Sound is muted but timer continues
   - Restore volume to audible level

**Expected Results**:

- Theme switching works instantly across entire interface
- Ambient sounds play correctly during sessions
- Volume controls function properly
- Audio and visual elements remain synchronized

### Scenario 3: Session Mode Comparison

**Objective**: Validate different session modes have distinct configurations

**Steps**:

1. **Test Study Mode (Pomodoro)**
   - Select Study Mode
   - Verify: Default timer shows 25:00 work / 5:00 break
   - Start and complete one full cycle
   - Verify: Work → Break → Work transition works

2. **Test Deep Work Mode**
   - Select Deep Work Mode
   - Verify: Default timer shows 50:00 work / 10:00 break
   - Start session for 1-2 minutes (don't complete)
   - Verify: Longer intervals are properly configured

3. **Test Zen Mode**
   - Select Zen Mode
   - Verify: Timer shows open-ended format (no countdown or different UI)
   - Start timer
   - Verify: Timer counts up or provides non-restrictive timing
   - Stop manually
   - Verify: Manual stop functionality works

4. **Test Yoga Mode**
   - Select Yoga Mode
   - Verify: Custom interval options are available
   - Configure custom work/break intervals (e.g., 10min/2min)
   - Start session
   - Verify: Custom intervals are used correctly

**Expected Results**:

- Each mode has distinct default configurations
- Mode switching preserves specific characteristics
- Customization options work where expected
- Timer behavior matches mode specifications

### Scenario 4: User Registration and Data Persistence

**Objective**: Validate authentication flow and data synchronization

**Steps**:

1. **Complete guest session first**
   - As guest user, complete one full Pomodoro session
   - Note: Guest session should be temporarily stored

2. **Register new account**
   - Click "Sign Up" or registration link
   - Enter valid email and password
   - Submit registration form
   - Verify: Registration successful, user logged in
   - Verify: Redirected to main timer interface

3. **Verify session history**
   - Navigate to session history/stats page
   - Verify: Previous guest session is NOT visible (expected behavior)
   - Complete one authenticated session
   - Verify: New session appears in history
   - Verify: Session details are accurate (time, mode, completion status)

4. **Test preferences persistence**
   - Change theme to dark mode
   - Change default session mode to Deep Work
   - Set ambient sound to Forest
   - Log out and log back in
   - Verify: All preferences are restored correctly

5. **Test cross-device sync (if possible)**
   - Log in from different browser/device
   - Verify: Preferences and session history sync
   - Complete session on second device
   - Check first device for updated history

**Expected Results**:

- Registration flow is smooth and intuitive
- Authenticated users see persistent session history
- Preferences sync across sessions and devices
- Guest and authenticated data are properly isolated

### Scenario 5: Error Handling and Edge Cases

**Objective**: Validate application handles errors gracefully

**Steps**:

1. **Test network connectivity issues**
   - Start authenticated session
   - Simulate network disconnect (dev tools offline mode)
   - Continue using timer
   - Verify: Timer continues to function offline
   - Restore network connection
   - Verify: Session syncs when connection restored

2. **Test invalid input handling**
   - Try to create custom interval with invalid durations (0, negative, extremely large)
   - Verify: Appropriate error messages shown
   - Verify: Form prevents submission of invalid data

3. **Test authentication edge cases**
   - Try accessing authenticated features while logged out
   - Verify: Appropriate prompts to log in
   - Try registering with invalid email format
   - Verify: Clear error messaging

4. **Test browser compatibility**
   - Test in multiple browsers (Chrome, Firefox, Safari)
   - Verify: Core functionality works consistently
   - Verify: Responsive design works on mobile viewport

**Expected Results**:

- Application degrades gracefully when offline
- Input validation prevents invalid data
- Error messages are clear and helpful
- Cross-browser compatibility is maintained

## Performance Validation

### Timer Precision Test

**Objective**: Validate timer accuracy and performance

**Steps**:

1. Start 5-minute timer session
2. Use external stopwatch to verify timing accuracy
3. Verify timer remains accurate within ±2 seconds over 5 minutes
4. Test with multiple concurrent browser tabs
5. Verify timer precision is maintained

### Load Performance Test

**Objective**: Validate application loads quickly

**Steps**:

1. Clear browser cache
2. Navigate to application
3. Measure time to interactive
4. Verify initial load is under 3 seconds
5. Test subsequent navigation speed

### Audio Performance Test

**Objective**: Validate ambient sound performance

**Steps**:

1. Test audio loading time for each ambient sound
2. Verify smooth playback without interruptions
3. Test audio during timer pause/resume cycles
4. Verify no audio glitches or delays

## Accessibility Validation

### Keyboard Navigation Test

**Steps**:

1. Navigate entire application using only keyboard
2. Verify all timer controls are accessible via Tab key
3. Verify Enter/Space activate buttons appropriately
4. Test focus indicators are clearly visible

### Screen Reader Test

**Steps**:

1. Enable screen reader (VoiceOver/NVDA)
2. Navigate timer interface
3. Verify timer status is announced clearly
4. Verify button labels are descriptive

### Visual Accessibility Test

**Steps**:

1. Test application with browser zoom at 200%
2. Verify interface remains usable
3. Test high contrast mode
4. Verify color contrast meets WCAG 2.1 AA standards

## Success Criteria

### Core Functionality ✅

- [ ] Timer starts, pauses, resumes, and completes correctly
- [ ] All four session modes work with correct default intervals
- [ ] Visual progress indication is clear and accurate
- [ ] Session state persists through page refresh
- [ ] Break transitions work automatically

### User Experience ✅

- [ ] Interface is intuitive for first-time users
- [ ] Theme switching works immediately
- [ ] Ambient sounds enhance rather than distract
- [ ] Error states provide clear guidance
- [ ] Mobile experience is fully functional

### Data & Authentication ✅

- [ ] User registration and login work smoothly
- [ ] Session history is accurate and persistent
- [ ] Preferences sync across sessions
- [ ] Guest mode provides full timer functionality
- [ ] Data privacy between guest and authenticated users

### Performance & Accessibility ✅

- [ ] Initial load time under 3 seconds
- [ ] Timer accuracy within ±2 seconds over 30 minutes
- [ ] Keyboard navigation covers all functionality
- [ ] Screen reader compatibility
- [ ] WCAG 2.1 AA compliance for color contrast

### Technical Integration ✅

- [ ] API contracts function as specified
- [ ] Data models handle all required scenarios
- [ ] Error handling covers edge cases
- [ ] Cross-browser compatibility maintained
- [ ] Offline functionality works for core timer features

---

**Next Steps**: Execute this quickstart validation during development iterations to ensure core user experience quality throughout implementation.
