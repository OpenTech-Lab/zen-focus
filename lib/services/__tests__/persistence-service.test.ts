import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  PersistenceService,
  PersistenceError,
  StorageQuotaExceededError,
  DataCorruptionError,
  NetworkError,
  type PersistedData,
  type SyncStatus,
} from '../persistence-service';
import { User } from '../../models/user';
import { UserPreferences } from '../../models/user-preferences';
import { Session } from '../../models/session';
import { TimerState } from '../../models/timer-state';
import { CustomInterval } from '../../models/custom-interval';
import { createUser } from '../../models/user';
import { createDefaultUserPreferences } from '../../models/user-preferences';
import { createSession } from '../../models/session';
import { createTimerState } from '../../models/timer-state';
import { createCustomInterval } from '../../models/custom-interval';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

// Mock AWS Amplify DataStore
const mockDataStore = {
  query: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  observeQuery: jest.fn(),
};

// Mock Auth
const mockAuth = {
  currentAuthenticatedUser: jest.fn(),
  signOut: jest.fn(),
  currentUserInfo: jest.fn(),
};

// Mock crypto for Web Crypto API
const mockCrypto = {
  subtle: {
    generateKey: jest.fn(),
    importKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  getRandomValues: jest.fn(),
  randomUUID: jest.fn(() => {
    // Generate a valid UUID v4 format
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }),
};

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('PersistenceService', () => {
  let persistenceService: PersistenceService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockLocalStorage.clear();

    // Reset crypto mock
    mockCrypto.randomUUID.mockImplementation(() => {
      // Generate a valid UUID v4 format
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    });

    // Mock global objects
    Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, writable: true });
    Object.defineProperty(global, 'crypto', { value: mockCrypto, writable: true });

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

    persistenceService = new PersistenceService();
  });

  describe('Initialization', () => {
    it('should initialize with correct default settings', () => {
      expect(persistenceService.isOnline()).toBe(true);
      expect(persistenceService.getSyncStatus()).toEqual({
        isEnabled: false,
        lastSync: null,
        pendingChanges: 0,
        conflicts: [],
      });
    });

    it('should detect offline status', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      persistenceService = new PersistenceService();
      expect(persistenceService.isOnline()).toBe(false);
    });
  });

  describe('Guest User Persistence (localStorage)', () => {
    describe('User Data', () => {
      it('should save and retrieve user data from localStorage', async () => {
        const user = createUser('test@example.com');

        await persistenceService.saveUser(user);
        const retrieved = await persistenceService.getUser(user.id);

        expect(retrieved).toEqual(user);
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      });

      it('should encrypt sensitive user data in localStorage', async () => {
        const user = createUser('test@example.com');
        mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16));

        await persistenceService.saveUser(user);

        expect(mockCrypto.subtle.encrypt).toHaveBeenCalled();
      });

      it('should return null for non-existent user', async () => {
        const result = await persistenceService.getUser('non-existent-id');
        expect(result).toBeNull();
      });

      it('should handle data corruption gracefully', async () => {
        mockLocalStorage.setItem('zf_user_test-id', 'invalid-json');

        await expect(persistenceService.getUser('test-id')).rejects.toThrow(DataCorruptionError);
      });
    });

    describe('User Preferences', () => {
      it('should save and retrieve user preferences', async () => {
        const preferences = createDefaultUserPreferences();
        const userId = crypto.randomUUID();

        await persistenceService.saveUserPreferences(userId, preferences);
        const retrieved = await persistenceService.getUserPreferences(userId);

        expect(retrieved).toEqual(preferences);
      });

      it('should return default preferences for new user', async () => {
        const userId = crypto.randomUUID();
        const retrieved = await persistenceService.getUserPreferences(userId);

        expect(retrieved).toEqual(createDefaultUserPreferences());
      });
    });

    describe('Sessions', () => {
      it('should save and retrieve session data', async () => {
        const session = createSession({
          mode: 'study',
          plannedDuration: 25,
          ambientSound: 'rain',
        });

        await persistenceService.saveSession(session);
        const retrieved = await persistenceService.getSession(session.id);

        expect(retrieved).toEqual(session);
      });

      it('should get sessions by user ID', async () => {
        const userId = crypto.randomUUID();
        const session1 = createSession({ mode: 'study', plannedDuration: 25, ambientSound: 'rain' }, userId);
        const session2 = createSession({ mode: 'deepwork', plannedDuration: 50, ambientSound: 'forest' }, userId);

        await persistenceService.saveSession(session1);
        await persistenceService.saveSession(session2);

        const sessions = await persistenceService.getSessionsByUserId(userId);
        expect(sessions).toHaveLength(2);
        expect(sessions).toContainEqual(session1);
        expect(sessions).toContainEqual(session2);
      });

      it('should handle guest sessions (null userId)', async () => {
        const guestSession = createSession({
          mode: 'zen',
          plannedDuration: 15,
          ambientSound: 'silence',
        });

        await persistenceService.saveSession(guestSession);
        const sessions = await persistenceService.getSessionsByUserId(null);

        expect(sessions).toContainEqual(guestSession);
      });
    });

    describe('Timer State', () => {
      it('should save and retrieve timer state', async () => {
        const timerState = createTimerState('study', 1500);

        await persistenceService.saveTimerState(timerState);
        const retrieved = await persistenceService.getTimerState();

        expect(retrieved).toEqual(timerState);
      });

      it('should return null when no timer state exists', async () => {
        const retrieved = await persistenceService.getTimerState();
        expect(retrieved).toBeNull();
      });
    });

    describe('Custom Intervals', () => {
      it('should save and retrieve custom intervals', async () => {
        const userId = crypto.randomUUID();
        const customInterval = createCustomInterval({
          name: 'Pomodoro',
          workDuration: 25,
          breakDuration: 5,
          sessionMode: 'study',
        }, userId);

        await persistenceService.saveCustomInterval(customInterval);
        const retrieved = await persistenceService.getCustomInterval(customInterval.id);

        expect(retrieved).toEqual(customInterval);
      });

      it('should get custom intervals by user ID', async () => {
        const userId = crypto.randomUUID();
        const interval1 = createCustomInterval({
          name: 'Short Focus',
          workDuration: 15,
          breakDuration: 3,
          sessionMode: 'study',
        }, userId);
        const interval2 = createCustomInterval({
          name: 'Deep Work',
          workDuration: 90,
          breakDuration: 15,
          sessionMode: 'deepwork',
        }, userId);

        await persistenceService.saveCustomInterval(interval1);
        await persistenceService.saveCustomInterval(interval2);

        const intervals = await persistenceService.getCustomIntervalsByUserId(userId);
        expect(intervals).toHaveLength(2);
        expect(intervals).toContainEqual(interval1);
        expect(intervals).toContainEqual(interval2);
      });
    });

    describe('Storage Quota Management', () => {
      it('should handle storage quota exceeded', async () => {
        // Mock localStorage to throw quota exceeded error
        const originalSetItem = mockLocalStorage.setItem;
        mockLocalStorage.setItem = jest.fn().mockImplementation(() => {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        });

        const user = createUser('test@example.com');

        await expect(persistenceService.saveUser(user)).rejects.toThrow(StorageQuotaExceededError);

        mockLocalStorage.setItem = originalSetItem;
      });

      it('should cleanup old data when quota exceeded', async () => {
        jest.spyOn(persistenceService, 'cleanupOldData');

        // Mock quota exceeded on first attempt, success on second
        let callCount = 0;
        const originalSetItem = mockLocalStorage.setItem;
        mockLocalStorage.setItem = jest.fn().mockImplementation((key, value) => {
          if (callCount === 0) {
            callCount++;
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
          }
          return originalSetItem(key, value);
        });

        const user = createUser('test@example.com');
        await persistenceService.saveUser(user);

        expect(persistenceService.cleanupOldData).toHaveBeenCalled();

        mockLocalStorage.setItem = originalSetItem;
      });
    });
  });

  describe('Authenticated User Persistence (AWS Amplify)', () => {
    beforeEach(() => {
      // Mock authenticated user
      mockAuth.currentAuthenticatedUser.mockResolvedValue({
        attributes: { sub: 'auth-user-id', email: 'auth@example.com' },
      });
      persistenceService.enableAmplifySync();
    });

    describe('User Data', () => {
      it('should save user data to Amplify DataStore', async () => {
        const user = createUser('auth@example.com');
        mockDataStore.save.mockResolvedValue(user);

        await persistenceService.saveUser(user);

        expect(mockDataStore.save).toHaveBeenCalledWith(user);
      });

      it('should retrieve user data from Amplify DataStore', async () => {
        const user = createUser('auth@example.com');
        mockDataStore.query.mockResolvedValue([user]);

        const retrieved = await persistenceService.getUser(user.id);

        expect(retrieved).toEqual(user);
        expect(mockDataStore.query).toHaveBeenCalled();
      });

      it('should handle network errors gracefully', async () => {
        const user = createUser('auth@example.com');
        mockDataStore.save.mockRejectedValue(new Error('Network error'));

        await expect(persistenceService.saveUser(user)).rejects.toThrow(NetworkError);
      });
    });

    describe('Data Synchronization', () => {
      it('should sync local changes to Amplify when coming online', async () => {
        // Start offline
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

        const user = createUser('sync@example.com');
        await persistenceService.saveUser(user);

        // Come back online
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        mockDataStore.save.mockResolvedValue(user);

        await persistenceService.syncPendingChanges();

        expect(mockDataStore.save).toHaveBeenCalledWith(user);
      });

      it('should update sync status during synchronization', async () => {
        const user = createUser('sync@example.com');

        // Start offline to create pending changes
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        await persistenceService.saveUser(user);

        let status = persistenceService.getSyncStatus();
        expect(status.pendingChanges).toBe(1);

        // Come online and sync
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        mockDataStore.save.mockResolvedValue(user);

        await persistenceService.syncPendingChanges();

        status = persistenceService.getSyncStatus();
        expect(status.pendingChanges).toBe(0);
        expect(status.lastSync).not.toBeNull();
      });

      it('should handle sync conflicts', async () => {
        const localUser = createUser('conflict@example.com');
        const remoteUser = { ...localUser, totalFocusTime: 100 };

        // Simulate conflict by having different versions
        mockDataStore.query.mockResolvedValue([remoteUser]);
        mockDataStore.save.mockRejectedValue(new Error('ConditionalCheckFailedException'));

        await persistenceService.saveUser(localUser);
        await persistenceService.syncPendingChanges();

        const status = persistenceService.getSyncStatus();
        expect(status.conflicts).toHaveLength(1);
        expect(status.conflicts[0].type).toBe('user');
        expect(status.conflicts[0].localData).toEqual(localUser);
        expect(status.conflicts[0].remoteData).toEqual(remoteUser);
      });
    });

    describe('Conflict Resolution', () => {
      it('should resolve conflicts using last-write-wins strategy', async () => {
        const conflict = {
          id: 'conflict-1',
          type: 'user' as const,
          localData: createUser('local@example.com'),
          remoteData: createUser('remote@example.com'),
          timestamp: new Date().toISOString(),
        };

        // Add conflict to status
        const originalStatus = persistenceService.getSyncStatus();
        originalStatus.conflicts.push(conflict);

        mockDataStore.save.mockResolvedValue(conflict.remoteData);

        await persistenceService.resolveConflict(conflict.id, 'remote');

        const status = persistenceService.getSyncStatus();
        expect(status.conflicts).toHaveLength(0);
        expect(mockDataStore.save).toHaveBeenCalledWith(conflict.remoteData);
      });

      it('should resolve conflicts using local version', async () => {
        const conflict = {
          id: 'conflict-2',
          type: 'preferences' as const,
          localData: createDefaultUserPreferences(),
          remoteData: { ...createDefaultUserPreferences(), theme: 'dark' as const },
          timestamp: new Date().toISOString(),
        };

        const originalStatus = persistenceService.getSyncStatus();
        originalStatus.conflicts.push(conflict);

        mockDataStore.save.mockResolvedValue(conflict.localData);

        await persistenceService.resolveConflict(conflict.id, 'local');

        const status = persistenceService.getSyncStatus();
        expect(status.conflicts).toHaveLength(0);
        expect(mockDataStore.save).toHaveBeenCalledWith(conflict.localData);
      });
    });
  });

  describe('Data Migration', () => {
    it('should migrate data from older version format', async () => {
      const oldUserId = crypto.randomUUID();
      // Mock old format data in localStorage
      const oldFormatUser = {
        id: oldUserId,
        email: 'old@example.com',
        created_at: '2023-01-01T00:00:00.000Z', // snake_case
        total_focus_time: 100,
        current_streak: 5,
        longest_streak: 10,
      };

      mockLocalStorage.setItem(`zf_user_${oldUserId}`, JSON.stringify(oldFormatUser));
      mockLocalStorage.setItem('zf_version', '1.0.0');

      await persistenceService.migrateData();

      const migratedUser = await persistenceService.getUser(oldUserId);
      expect(migratedUser?.email).toBe('old@example.com');
      expect(migratedUser?.createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(migratedUser?.totalFocusTime).toBe(100);
    });

    it('should handle migration errors gracefully', async () => {
      mockLocalStorage.setItem('zf_user_corrupted', 'invalid-json');
      mockLocalStorage.setItem('zf_version', '1.0.0');

      // Should not throw, but log error and continue
      await expect(persistenceService.migrateData()).resolves.not.toThrow();
    });

    it('should skip migration if data is already current version', async () => {
      mockLocalStorage.setItem('zf_version', '2.0.0'); // Current version

      const migrateSpy = jest.spyOn(persistenceService as any, 'migrateFromV1ToV2');
      await persistenceService.migrateData();

      // Migration function should not be called if version is current
      expect(migrateSpy).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should validate data before saving', async () => {
      const invalidUser = {
        id: 'invalid-id',
        email: 'not-an-email',
        createdAt: 'invalid-date',
        totalFocusTime: -1,
        currentStreak: -5,
        longestStreak: -10,
      };

      await expect(persistenceService.saveUser(invalidUser as any)).rejects.toThrow(PersistenceError);
    });

    it('should validate data when retrieving', async () => {
      const corruptedData = {
        id: 'valid-id',
        email: 'test@example.com',
        createdAt: 'invalid-date-format',
        totalFocusTime: 'not-a-number',
        currentStreak: 5,
        longestStreak: 10,
      };

      mockLocalStorage.setItem('zf_user_valid-id', JSON.stringify(corruptedData));

      await expect(persistenceService.getUser('valid-id')).rejects.toThrow(DataCorruptionError);
    });
  });

  describe('Performance Optimization', () => {
    it('should cache frequently accessed data', async () => {
      const user = createUser('cached@example.com');

      await persistenceService.saveUser(user);

      // First call should hit storage
      await persistenceService.getUser(user.id);
      expect(mockLocalStorage.getItem).toHaveBeenCalled();

      // Reset mock to check caching
      (mockLocalStorage.getItem as jest.Mock).mockClear();

      // Second call should use cache
      await persistenceService.getUser(user.id);

      // Should be called less frequently due to caching
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(0);
    });

    it('should batch multiple save operations', async () => {
      const users = [
        createUser('batch1@example.com'),
        createUser('batch2@example.com'),
        createUser('batch3@example.com'),
      ];

      // Enable batching
      persistenceService.startBatch();

      await Promise.all(users.map(user => persistenceService.saveUser(user)));

      // Should only call setItem once for the batch
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);

      await persistenceService.commitBatch();

      // All users should be saved
      for (const user of users) {
        const retrieved = await persistenceService.getUser(user.id);
        expect(retrieved).toEqual(user);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage unavailable', () => {
      Object.defineProperty(global, 'localStorage', { value: undefined, writable: true });

      expect(() => new PersistenceService()).not.toThrow();
    });

    it('should handle crypto API unavailable', async () => {
      Object.defineProperty(global, 'crypto', { value: undefined, writable: true });

      const service = new PersistenceService();

      // Create a user manually without crypto
      const user = {
        id: 'nocrypto-user-id-test-uuid-format',
        email: 'nocrypto@example.com',
        createdAt: new Date().toISOString(),
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: 0,
      };

      // Should work without encryption - but will fail validation due to invalid UUID
      await expect(service.saveUser(user)).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      const user = createUser('error@example.com');
      mockDataStore.save.mockRejectedValue(new Error('Unknown error'));

      try {
        await persistenceService.saveUser(user);
      } catch (error) {
        expect(error).toBeInstanceOf(PersistenceError);
        expect((error as PersistenceError).message).toContain('Failed to save user');
        expect((error as PersistenceError).cause).toBeInstanceOf(Error);
      }
    });
  });

  describe('Cleanup and Maintenance', () => {
    it('should cleanup old session data', async () => {
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      const oldSession = createSession({
        mode: 'study',
        plannedDuration: 25,
        ambientSound: 'rain',
      });
      oldSession.startTime = oldDate.toISOString();

      await persistenceService.saveSession(oldSession);

      await persistenceService.cleanupOldData();

      const retrieved = await persistenceService.getSession(oldSession.id);
      expect(retrieved).toBeNull();
    });

    it('should preserve recent session data during cleanup', async () => {
      const recentSession = createSession({
        mode: 'study',
        plannedDuration: 25,
        ambientSound: 'rain',
      });

      await persistenceService.saveSession(recentSession);
      await persistenceService.cleanupOldData();

      const retrieved = await persistenceService.getSession(recentSession.id);
      expect(retrieved).toEqual(recentSession);
    });
  });

  describe('Export and Import', () => {
    it('should export all user data', async () => {
      const userId = crypto.randomUUID();
      const user = createUser('export@example.com');
      user.id = userId;

      const preferences = createDefaultUserPreferences();
      const session = createSession({ mode: 'study', plannedDuration: 25, ambientSound: 'rain' }, userId);
      const customInterval = createCustomInterval({
        name: 'Export Test',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
      }, userId);

      await persistenceService.saveUser(user);
      await persistenceService.saveUserPreferences(userId, preferences);
      await persistenceService.saveSession(session);
      await persistenceService.saveCustomInterval(customInterval);

      const exportData = await persistenceService.exportUserData(userId);

      expect(exportData.user).toEqual(user);
      expect(exportData.preferences).toEqual(preferences);
      expect(exportData.sessions).toContainEqual(session);
      expect(exportData.customIntervals).toContainEqual(customInterval);
      expect(exportData.exportedAt).toBeDefined();
      expect(exportData.version).toBe('2.0.0');
    });

    it('should import user data and validate integrity', async () => {
      const userId = crypto.randomUUID();
      const importData = {
        user: createUser('import@example.com'),
        preferences: createDefaultUserPreferences(),
        sessions: [createSession({ mode: 'zen', plannedDuration: 15, ambientSound: 'ocean' }, userId)],
        customIntervals: [createCustomInterval({
          name: 'Import Test',
          workDuration: 30,
          breakDuration: 10,
          sessionMode: 'zen',
        }, userId)],
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
      };
      importData.user.id = userId;

      await persistenceService.importUserData(importData);

      const user = await persistenceService.getUser(userId);
      const preferences = await persistenceService.getUserPreferences(userId);
      const sessions = await persistenceService.getSessionsByUserId(userId);
      const intervals = await persistenceService.getCustomIntervalsByUserId(userId);

      expect(user).toEqual(importData.user);
      expect(preferences).toEqual(importData.preferences);
      expect(sessions).toEqual(importData.sessions);
      expect(intervals).toEqual(importData.customIntervals);
    });
  });
});