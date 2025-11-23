# zenFocus - Development Tasks

## MVP

### Core Timer Functionality

- [x] Implement timer state management (countdown logic)
- [x] Add timer controls (start, pause, reset buttons)
- [x] Add preset duration options for each focus mode
- [x] Display timer in MM:SS format
- [x] Add progress indicator/circle

### User Experience

- [x] Add sound notification on timer completion
- [x] Add visual notification when timer completes
- [x] Add custom duration input
- [x] Add timer history/statistics
- [x] Add dark/light mode toggle

### Testing

- [x] Write unit tests for timer logic
- [x] Write component tests for FocusTabs
- [x] Write integration tests for timer controls

### Polish & Optimization

- [x] Add animations for tab transitions
- [x] Optimize performance with React.memo
- [x] Add accessibility features (ARIA labels, keyboard navigation)
- [x] Add PWA support for offline usage
- [x] Add SEO metadata

### Documentation

- [x] Add JSDoc comments to components
- [x] Create API documentation
- [x] Add contributing guidelines

## R1

- [x] Combine study, work, yoga, mediation into 1 feature.
- [x] Add a new feature with new tab. User can enter time and number of times, to that it will work as like many timers.
- [x] Show total time in intervals tab after enter duration and repetitions.

- [x] I want a feature that makes a beep sound when the time for each stage is over. I want to be able to enable it with a checkbox.

- [x] internal time is counting as 1, 2, 4, 6 ... but expected 1, 2, 3, 4
- [x] first round cannot pause in internal timer. it will be reseted now.
- [x] show elapsed total time in interval timer.
- [ ] add a skip button under pause and reset buttons to skip this round and do not count whole time in elapsed total time.
