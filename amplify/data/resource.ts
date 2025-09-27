import { type ClientSchema, a, defineData } from '@aws-amplify/backend'

const schema = a.schema({
  User: a
    .model({
      email: a.string().required(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relationships
      preferences: a.hasOne('UserPreferences', 'userId'),
      sessions: a.hasMany('Session', 'userId'),
      customIntervals: a.hasMany('CustomInterval', 'userId'),
      timerState: a.hasOne('TimerState', 'userId'),
    })
    .authorization((allow) => [allow.owner()]),

  UserPreferences: a
    .model({
      userId: a.id().required(),
      // Theme settings
      theme: a.string().required().default('light'), // "light" | "dark" | "system"
      // Audio settings
      ambientSound: a.string().required().default('none'), // "none" | "rain" | "forest" | "ocean" | "cafe"
      // Timer settings
      pomodoroMinutes: a.integer().required().default(25),
      shortBreakMinutes: a.integer().required().default(5),
      longBreakMinutes: a.integer().required().default(15),
      longBreakInterval: a.integer().required().default(4), // pomodoros before long break
      // Auto-start settings
      autoStartBreaks: a.boolean().required().default(false),
      autoStartPomodoros: a.boolean().required().default(false),
      // Relationships
      user: a.belongsTo('User', 'userId'),
    })
    .authorization((allow) => [allow.owner()]),

  Session: a
    .model({
      userId: a.id().required(),
      // Session details
      mode: a.string().required(), // "pomodoro" | "short-break" | "long-break" | "custom"
      duration: a.integer().required(), // Duration in seconds
      startTime: a.datetime().required(),
      endTime: a.datetime(),
      completed: a.boolean().required().default(false), // Whether session was completed or interrupted
      // Custom interval reference (if mode is "custom")
      customIntervalId: a.id(),
      // Relationships
      user: a.belongsTo('User', 'userId'),
      customInterval: a.belongsTo('CustomInterval', 'customIntervalId'),
    })
    .authorization((allow) => [allow.owner()]),

  SessionMode: a
    .model({
      name: a.string().required(), // "Pomodoro", "Short Break", "Long Break"
      type: a.string().required(), // "pomodoro" | "short-break" | "long-break"
      defaultDuration: a.integer().required(), // Duration in minutes
      description: a.string(),
      color: a.string(), // Hex color code for UI
    })
    .authorization((allow) => [allow.publicApiKey().to(['read'])]),

  CustomInterval: a
    .model({
      userId: a.id().required(),
      // Interval details
      name: a.string().required(), // User-defined name
      workMinutes: a.integer().required(), // Work duration in minutes
      breakMinutes: a.integer().required(), // Break duration in minutes
      // Usage tracking
      isActive: a.boolean().required().default(true), // Whether this interval is currently available
      usageCount: a.integer().required().default(0), // How many times it's been used
      // Relationships
      user: a.belongsTo('User', 'userId'),
      sessions: a.hasMany('Session', 'customIntervalId'),
    })
    .authorization((allow) => [allow.owner()]),

  TimerState: a
    .model({
      userId: a.id().required(),
      // Current timer state
      isRunning: a.boolean().required().default(false), // Whether timer is currently running
      isPaused: a.boolean().required().default(false), // Whether timer is paused
      currentMode: a.string().required().default('pomodoro'), // Current session mode
      timeRemaining: a.integer().required().default(1500), // Remaining time in seconds
      sessionStartTime: a.datetime(), // When current session started
      // Session tracking
      completedPomodoros: a.integer().required().default(0), // Pomodoros completed in current cycle
      currentCycle: a.integer().required().default(1), // Current pomodoro cycle (resets after long break)
      // Settings snapshot (cached from UserPreferences for performance)
      pomodoroMinutes: a.integer().required().default(25),
      shortBreakMinutes: a.integer().required().default(5),
      longBreakMinutes: a.integer().required().default(15),
      longBreakInterval: a.integer().required().default(4),
      // Relationships
      user: a.belongsTo('User', 'userId'),
    })
    .authorization((allow) => [allow.owner()]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // API Key is used for the SessionMode model for public access
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
})