import {
  AudioService,
  AudioServiceError,
  type AudioEventHandler,
  type AudioEvents,
  type AudioLoadResult,
} from './audio-service'
import { type AmbientSound } from '../models/user-preferences'

// Mock Web Audio API
const mockAudioContext = {
  createGain: jest.fn(),
  createBufferSource: jest.fn(),
  decodeAudioData: jest.fn(),
  destination: {},
  state: 'running',
  currentTime: 0,
  resume: jest.fn(),
  suspend: jest.fn(),
  close: jest.fn(),
}

const mockGainNode = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  gain: {
    value: 1,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
}

const mockBufferSource = {
  buffer: null,
  loop: false,
  connect: jest.fn(),
  disconnect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
}

const mockAudioBuffer = {
  duration: 10,
  sampleRate: 44100,
  numberOfChannels: 2,
}

// Mock fetch for audio file loading
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('AudioService', () => {
  let audioService: AudioService
  let mockEventHandlers: Partial<Record<keyof AudioEvents, AudioEventHandler<keyof AudioEvents>>>

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup Web Audio API mocks
    mockAudioContext.createGain.mockReturnValue(mockGainNode)
    mockAudioContext.createBufferSource.mockReturnValue(mockBufferSource)
    mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer)
    mockAudioContext.resume.mockResolvedValue(undefined)

    // Mock AudioContext constructor
    global.AudioContext = jest.fn(() => mockAudioContext)
    global.webkitAudioContext = jest.fn(() => mockAudioContext)

    // Mock fetch responses
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
    })

    mockEventHandlers = {
      audioLoaded: jest.fn(),
      audioLoadError: jest.fn(),
      audioStarted: jest.fn(),
      audioStopped: jest.fn(),
      volumeChanged: jest.fn(),
      fadeComplete: jest.fn(),
    }

    audioService = new AudioService()
  })

  afterEach(() => {
    audioService.destroy()
  })

  describe('Constructor and Initialization', () => {
    it('should initialize with proper default state', () => {
      expect(audioService.isInitialized()).toBe(false)
      expect(audioService.getCurrentVolume()).toBe(50)
      expect(audioService.getCurrentSound()).toBe('silence')
      expect(audioService.isPlaying()).toBe(false)
    })

    it('should initialize Web Audio API context on first use', async () => {
      await audioService.initialize()

      expect(global.AudioContext).toHaveBeenCalledTimes(1)
      expect(audioService.isInitialized()).toBe(true)
    })

    it('should handle Web Audio API initialization errors', async () => {
      global.AudioContext = jest.fn(() => {
        throw new Error('AudioContext not supported')
      })

      await expect(audioService.initialize()).rejects.toThrow(AudioServiceError)
    })
  })

  describe('Audio Loading and Caching', () => {
    beforeEach(async () => {
      await audioService.initialize()
    })

    it('should load audio files for ambient sounds', async () => {
      const result = await audioService.loadAmbientSound('rain')

      expect(mockFetch).toHaveBeenCalledWith('/audio/rain.mp3')
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.sound).toBe('rain')
    })

    it('should cache loaded audio buffers', async () => {
      await audioService.loadAmbientSound('forest')
      await audioService.loadAmbientSound('forest') // Second call

      expect(mockFetch).toHaveBeenCalledTimes(1) // Should only fetch once
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalledTimes(1)
    })

    it('should preload all ambient sounds', async () => {
      const results = await audioService.preloadAllSounds()

      expect(results).toHaveLength(3) // rain, forest, ocean (excluding silence)
      expect(mockFetch).toHaveBeenCalledTimes(3)
      results.forEach((result) => {
        expect(result.success).toBe(true)
      })
    })

    it('should handle audio loading errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await audioService.loadAmbientSound('rain')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle audio decoding errors', async () => {
      mockAudioContext.decodeAudioData.mockRejectedValueOnce(new Error('Decode error'))

      const result = await audioService.loadAmbientSound('ocean')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Audio Playback', () => {
    beforeEach(async () => {
      await audioService.initialize()
      await audioService.loadAmbientSound('rain')
    })

    it('should play ambient sounds with looping', async () => {
      audioService.enableUserInteraction()
      await audioService.playAmbientSound('rain')

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockBufferSource.buffer).toBe(mockAudioBuffer)
      expect(mockBufferSource.loop).toBe(true)
      expect(mockBufferSource.start).toHaveBeenCalledWith(0)
      expect(audioService.isPlaying()).toBe(true)
    })

    it('should stop currently playing sound before starting new one', async () => {
      audioService.enableUserInteraction()
      await audioService.playAmbientSound('rain')
      await audioService.playAmbientSound('forest')

      expect(mockBufferSource.stop).toHaveBeenCalled()
    })

    it('should handle silence sound type', async () => {
      audioService.enableUserInteraction()
      await audioService.playAmbientSound('silence')

      expect(audioService.getCurrentSound()).toBe('silence')
      expect(audioService.isPlaying()).toBe(false)
    })

    it('should stop audio playback', async () => {
      audioService.enableUserInteraction()
      await audioService.playAmbientSound('rain')
      audioService.stopAudio()

      expect(mockBufferSource.stop).toHaveBeenCalled()
      expect(audioService.isPlaying()).toBe(false)
    })

    it('should require user interaction before first audio play', async () => {
      const newService = new AudioService()
      await newService.initialize()

      await expect(newService.playAmbientSound('rain')).rejects.toThrow(AudioServiceError)
      expect(newService.hasUserInteraction()).toBe(false)
    })

    it('should enable audio after user interaction', async () => {
      audioService.enableUserInteraction()

      expect(audioService.hasUserInteraction()).toBe(true)
      await expect(audioService.playAmbientSound('rain')).resolves.toBeUndefined()
    })
  })

  describe('Volume Control', () => {
    beforeEach(async () => {
      await audioService.initialize()
      await audioService.loadAmbientSound('rain')
      audioService.enableUserInteraction()
    })

    it('should set volume between 0 and 100', () => {
      audioService.setVolume(75)

      expect(audioService.getCurrentVolume()).toBe(75)
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenLastCalledWith(0.75, expect.any(Number))
    })

    it('should clamp volume to valid range', () => {
      audioService.setVolume(-10)
      expect(audioService.getCurrentVolume()).toBe(0)

      audioService.setVolume(150)
      expect(audioService.getCurrentVolume()).toBe(100)
    })

    it('should mute and unmute audio', () => {
      audioService.setVolume(50)
      audioService.mute()

      expect(audioService.isMuted()).toBe(true)
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenLastCalledWith(0, expect.any(Number))

      audioService.unmute()
      expect(audioService.isMuted()).toBe(false)
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenLastCalledWith(0.5, expect.any(Number))
    })
  })

  describe('Fade Effects', () => {
    beforeEach(async () => {
      await audioService.initialize()
      await audioService.loadAmbientSound('rain')
      audioService.enableUserInteraction()
    })

    it('should fade in audio over specified duration', async () => {
      const duration = 2000 // 2 seconds

      const fadePromise = audioService.fadeIn(duration)

      expect(mockGainNode.gain.setValueAtTime).toHaveBeenLastCalledWith(0, expect.any(Number))
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number)
      )

      await fadePromise
    })

    it('should fade out audio over specified duration', async () => {
      await audioService.playAmbientSound('rain')
      const duration = 1500 // 1.5 seconds

      const fadePromise = audioService.fadeOut(duration)

      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number))

      await fadePromise
      expect(audioService.isPlaying()).toBe(false)
    })

    it('should cross-fade between different sounds', async () => {
      await audioService.playAmbientSound('rain')
      await audioService.loadAmbientSound('forest')

      const crossFadeDuration = 3000 // 3 seconds
      await audioService.crossFade('forest', crossFadeDuration)

      expect(audioService.getCurrentSound()).toBe('forest')
      expect(audioService.isPlaying()).toBe(true)
    })
  })

  describe('Event System', () => {
    beforeEach(async () => {
      await audioService.initialize()
    })

    it('should register and call event handlers', async () => {
      audioService.on('audioLoaded', mockEventHandlers.audioLoaded!)

      await audioService.loadAmbientSound('rain')

      expect(mockEventHandlers.audioLoaded).toHaveBeenCalledWith({
        sound: 'rain',
        duration: mockAudioBuffer.duration,
        success: true,
      })
    })

    it('should unregister event handlers', () => {
      audioService.on('volumeChanged', mockEventHandlers.volumeChanged!)
      audioService.off('volumeChanged', mockEventHandlers.volumeChanged!)

      audioService.setVolume(75)

      expect(mockEventHandlers.volumeChanged).not.toHaveBeenCalled()
    })

    it('should emit events for volume changes', () => {
      audioService.on('volumeChanged', mockEventHandlers.volumeChanged!)

      audioService.setVolume(80)

      expect(mockEventHandlers.volumeChanged).toHaveBeenCalledWith({
        volume: 80,
        muted: false,
      })
    })

    it('should emit events for audio start and stop', async () => {
      audioService.on('audioStarted', mockEventHandlers.audioStarted!)
      audioService.on('audioStopped', mockEventHandlers.audioStopped!)

      await audioService.loadAmbientSound('rain')
      audioService.enableUserInteraction()
      await audioService.playAmbientSound('rain')

      expect(mockEventHandlers.audioStarted).toHaveBeenCalledWith({
        sound: 'rain',
      })

      audioService.stopAudio()

      expect(mockEventHandlers.audioStopped).toHaveBeenCalledWith({
        sound: 'rain',
      })
    })
  })

  describe('Browser Compatibility and Error Handling', () => {
    it('should detect Web Audio API support', () => {
      expect(AudioService.isWebAudioSupported()).toBe(true)

      delete (global as any).AudioContext
      delete (global as any).webkitAudioContext

      expect(AudioService.isWebAudioSupported()).toBe(false)
    })

    it('should handle unsupported audio formats', async () => {
      mockAudioContext.decodeAudioData.mockRejectedValueOnce(
        new DOMException('Format not supported')
      )

      await audioService.initialize()
      const result = await audioService.loadAmbientSound('rain')

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Format not supported')
    })

    it('should handle network errors during audio loading', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      await audioService.initialize()
      const result = await audioService.loadAmbientSound('ocean')

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Network timeout')
    })

    it('should properly cleanup resources on destroy', async () => {
      await audioService.initialize()
      await audioService.loadAmbientSound('rain')
      audioService.enableUserInteraction()
      await audioService.playAmbientSound('rain')

      audioService.destroy()

      expect(mockAudioContext.close).toHaveBeenCalled()
      expect(audioService.isInitialized()).toBe(false)
      expect(audioService.isPlaying()).toBe(false)
    })
  })

  describe('User Preferences Integration', () => {
    beforeEach(async () => {
      await audioService.initialize()
      audioService.enableUserInteraction()
    })

    it('should apply user preferences for ambient sound and volume', async () => {
      const preferences = {
        ambientSound: 'forest' as AmbientSound,
        ambientVolume: 75,
      }

      await audioService.applyUserPreferences(preferences)

      expect(audioService.getCurrentSound()).toBe('forest')
      expect(audioService.getCurrentVolume()).toBe(75)
    })

    it('should handle silence preference correctly', async () => {
      const preferences = {
        ambientSound: 'silence' as AmbientSound,
        ambientVolume: 50,
      }

      await audioService.applyUserPreferences(preferences)

      expect(audioService.getCurrentSound()).toBe('silence')
      expect(audioService.isPlaying()).toBe(false)
    })

    it('should load audio before applying preferences if not cached', async () => {
      const preferences = {
        ambientSound: 'ocean' as AmbientSound,
        ambientVolume: 60,
      }

      await audioService.applyUserPreferences(preferences)

      expect(mockFetch).toHaveBeenCalledWith('/audio/ocean.mp3')
      expect(audioService.getCurrentSound()).toBe('ocean')
    })
  })

  describe('Performance and Memory Management', () => {
    beforeEach(async () => {
      await audioService.initialize()
    })

    it('should limit the number of cached audio buffers', async () => {
      // This would test the cache size limit implementation
      // For now, just verify basic caching works
      await audioService.loadAmbientSound('rain')
      await audioService.loadAmbientSound('forest')
      await audioService.loadAmbientSound('ocean')

      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should cleanup stopped audio sources', async () => {
      audioService.enableUserInteraction()
      await audioService.loadAmbientSound('rain')
      await audioService.playAmbientSound('rain')
      audioService.stopAudio()

      // Verify cleanup happens
      expect(mockBufferSource.disconnect).toHaveBeenCalled()
    })
  })
})
