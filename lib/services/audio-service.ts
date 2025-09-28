import { type AmbientSound } from '../models/user-preferences'

/**
 * Custom error classes for audio-related errors
 */
export class AudioServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'AUDIO_SERVICE_ERROR'
  ) {
    super(message)
    this.name = 'AudioServiceError'
  }
}

/**
 * Audio event types and their payload structures
 */
export interface AudioEvents {
  audioLoaded: {
    sound: AmbientSound
    duration: number
    success: boolean
  }
  audioLoadError: {
    sound: AmbientSound
    error: Error
  }
  audioStarted: {
    sound: AmbientSound
  }
  audioStopped: {
    sound: AmbientSound
  }
  volumeChanged: {
    volume: number
    muted: boolean
  }
  fadeComplete: {
    type: 'fadeIn' | 'fadeOut' | 'crossFade'
    sound: AmbientSound
  }
}

/**
 * Event handler type for audio events
 */
export type AudioEventHandler<K extends keyof AudioEvents> = (payload: AudioEvents[K]) => void

/**
 * Result type for audio loading operations
 */
export interface AudioLoadResult {
  success: boolean
  sound: AmbientSound
  duration?: number
  error?: Error
}

/**
 * User preferences subset for audio configuration
 */
export interface AudioPreferences {
  ambientSound: AmbientSound
  ambientVolume: number
}

/**
 * Audio buffer cache entry
 */
interface AudioCacheEntry {
  buffer: AudioBuffer
  duration: number
  lastUsed: number
}

/**
 * Audio source tracking for cleanup
 */
interface ActiveAudioSource {
  source: AudioBufferSourceNode
  sound: AmbientSound
  startTime: number
}

/**
 * AudioService class for managing ambient sounds in the ZenFocus application
 *
 * Features:
 * - Web Audio API integration for high-quality audio processing
 * - Audio loading and caching for performance optimization
 * - Volume control with fade in/out effects
 * - Browser autoplay policy compliance
 * - Event-driven architecture for audio state changes
 * - User preferences integration
 * - Error handling for network and format issues
 * - Memory management and cleanup
 */
export class AudioService {
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private audioCache: Map<AmbientSound, AudioCacheEntry> = new Map()
  private eventHandlers: Map<keyof AudioEvents, Set<AudioEventHandler<keyof AudioEvents>>> = new Map()
  private activeSource: ActiveAudioSource | null = null
  private currentVolume: number = 50
  private currentSound: AmbientSound = 'silence'
  private isMutedState: boolean = false
  private hasUserInteracted: boolean = false
  private initialized: boolean = false
  private fadeTimeouts: Set<NodeJS.Timeout> = new Set()

  // Audio file paths for ambient sounds
  private readonly audioFiles: Record<Exclude<AmbientSound, 'silence'>, string> = {
    rain: '/audio/rain.mp3',
    forest: '/audio/forest.mp3',
    ocean: '/audio/ocean.mp3',
  }

  // Maximum cache size to prevent memory issues
  private readonly maxCacheSize: number = 10

  /**
   * Static method to check Web Audio API support
   */
  static isWebAudioSupported(): boolean {
    return typeof AudioContext !== 'undefined' || typeof (window as any)?.webkitAudioContext !== 'undefined'
  }

  /**
   * Initialize the audio service and Web Audio API context
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    if (!AudioService.isWebAudioSupported()) {
      throw new AudioServiceError('Web Audio API is not supported in this browser', 'UNSUPPORTED_BROWSER')
    }

    try {
      // Create AudioContext with fallback for older browsers
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioContextClass()

      // Create main gain node for volume control
      this.gainNode = this.audioContext.createGain()
      this.gainNode.connect(this.audioContext.destination)

      // Set initial volume
      this.setGainValue(this.currentVolume / 100)

      this.initialized = true
    } catch (error) {
      throw new AudioServiceError(
        `Failed to initialize Web Audio API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_FAILED'
      )
    }
  }

  /**
   * Load ambient sound audio file and cache the decoded audio buffer
   */
  async loadAmbientSound(sound: AmbientSound): Promise<AudioLoadResult> {
    if (!this.initialized) {
      await this.initialize()
    }

    if (sound === 'silence') {
      return {
        success: true,
        sound: 'silence',
        duration: 0,
      }
    }

    // Check cache first
    const cached = this.audioCache.get(sound)
    if (cached) {
      cached.lastUsed = Date.now()
      this.emit('audioLoaded', {
        sound,
        duration: cached.duration,
        success: true,
      })
      return {
        success: true,
        sound,
        duration: cached.duration,
      }
    }

    try {
      const audioUrl = this.audioFiles[sound]
      const response = await fetch(audioUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)

      // Add to cache with LRU management
      this.addToCache(sound, audioBuffer)

      const result: AudioLoadResult = {
        success: true,
        sound,
        duration: audioBuffer.duration,
      }

      this.emit('audioLoaded', {
        sound,
        duration: audioBuffer.duration,
        success: true,
      })

      return result
    } catch (error) {
      const audioError = error instanceof Error ? error : new Error('Unknown audio loading error')

      this.emit('audioLoadError', {
        sound,
        error: audioError,
      })

      return {
        success: false,
        sound,
        error: audioError,
      }
    }
  }

  /**
   * Preload all ambient sounds for better performance
   */
  async preloadAllSounds(): Promise<AudioLoadResult[]> {
    const sounds: (Exclude<AmbientSound, 'silence'>)[] = ['rain', 'forest', 'ocean']
    const loadPromises = sounds.map(sound => this.loadAmbientSound(sound))
    return Promise.all(loadPromises)
  }

  /**
   * Play an ambient sound with looping
   */
  async playAmbientSound(sound: AmbientSound): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    if (!this.hasUserInteracted) {
      throw new AudioServiceError(
        'User interaction is required before playing audio',
        'USER_INTERACTION_REQUIRED'
      )
    }

    // Handle silence
    if (sound === 'silence') {
      this.stopAudio()
      this.currentSound = 'silence'
      return
    }

    // Stop current audio if playing
    if (this.activeSource) {
      this.stopCurrentSource()
    }

    // Load audio if not in cache
    const loadResult = await this.loadAmbientSound(sound)
    if (!loadResult.success) {
      throw new AudioServiceError(
        `Failed to load audio for ${sound}: ${loadResult.error?.message}`,
        'AUDIO_LOAD_FAILED'
      )
    }

    const audioBuffer = this.audioCache.get(sound)?.buffer
    if (!audioBuffer) {
      throw new AudioServiceError(`Audio buffer not found for ${sound}`, 'BUFFER_NOT_FOUND')
    }

    try {
      // Resume audio context if suspended (autoplay policy)
      if (this.audioContext!.state === 'suspended') {
        await this.audioContext!.resume()
      }

      // Create and configure audio source
      const source = this.audioContext!.createBufferSource()
      source.buffer = audioBuffer
      source.loop = true

      // Connect to gain node
      source.connect(this.gainNode!)

      // Track active source for cleanup
      this.activeSource = {
        source,
        sound,
        startTime: this.audioContext!.currentTime,
      }

      // Start playback
      source.start(0)

      this.currentSound = sound
      this.emit('audioStarted', { sound })
    } catch (error) {
      throw new AudioServiceError(
        `Failed to play audio for ${sound}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PLAYBACK_FAILED'
      )
    }
  }

  /**
   * Stop current audio playback
   */
  stopAudio(): void {
    if (this.activeSource) {
      this.stopCurrentSource()
      this.emit('audioStopped', { sound: this.currentSound })
    }
  }

  /**
   * Set audio volume (0-100)
   */
  setVolume(volume: number): void {
    // Clamp volume to valid range
    const clampedVolume = Math.max(0, Math.min(100, volume))
    this.currentVolume = clampedVolume

    if (!this.isMutedState) {
      this.setGainValue(clampedVolume / 100)
    }

    this.emit('volumeChanged', {
      volume: clampedVolume,
      muted: this.isMutedState,
    })
  }

  /**
   * Get current volume (0-100)
   */
  getCurrentVolume(): number {
    return this.currentVolume
  }

  /**
   * Mute audio
   */
  mute(): void {
    this.isMutedState = true
    this.setGainValue(0)
    this.emit('volumeChanged', {
      volume: this.currentVolume,
      muted: true,
    })
  }

  /**
   * Unmute audio
   */
  unmute(): void {
    this.isMutedState = false
    this.setGainValue(this.currentVolume / 100)
    this.emit('volumeChanged', {
      volume: this.currentVolume,
      muted: false,
    })
  }

  /**
   * Check if audio is muted
   */
  isMuted(): boolean {
    return this.isMutedState
  }

  /**
   * Fade in audio over specified duration
   */
  async fadeIn(duration: number = 2000): Promise<void> {
    if (!this.gainNode || !this.audioContext) {
      throw new AudioServiceError('Audio service not initialized', 'NOT_INITIALIZED')
    }

    const currentTime = this.audioContext.currentTime
    const targetVolume = this.isMutedState ? 0 : this.currentVolume / 100

    // Start from zero volume
    this.gainNode.gain.setValueAtTime(0, currentTime)
    // Fade to target volume
    this.gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration / 1000)

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.fadeTimeouts.delete(timeout)
        this.emit('fadeComplete', {
          type: 'fadeIn',
          sound: this.currentSound,
        })
        resolve()
      }, duration)
      this.fadeTimeouts.add(timeout)
    })
  }

  /**
   * Fade out audio over specified duration
   */
  async fadeOut(duration: number = 2000): Promise<void> {
    if (!this.gainNode || !this.audioContext) {
      throw new AudioServiceError('Audio service not initialized', 'NOT_INITIALIZED')
    }

    const currentTime = this.audioContext.currentTime

    // Fade to zero volume
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration / 1000)

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.fadeTimeouts.delete(timeout)
        this.stopAudio()
        this.emit('fadeComplete', {
          type: 'fadeOut',
          sound: this.currentSound,
        })
        resolve()
      }, duration)
      this.fadeTimeouts.add(timeout)
    })
  }

  /**
   * Cross-fade between current and new ambient sound
   */
  async crossFade(newSound: AmbientSound, duration: number = 3000): Promise<void> {
    if (this.currentSound === newSound) {
      return
    }

    const fadeOutPromise = this.isPlaying() ? this.fadeOut(duration / 2) : Promise.resolve()

    await fadeOutPromise
    await this.playAmbientSound(newSound)

    if (newSound !== 'silence') {
      await this.fadeIn(duration / 2)
    }

    this.emit('fadeComplete', {
      type: 'crossFade',
      sound: newSound,
    })
  }

  /**
   * Apply user preferences for ambient sound and volume
   */
  async applyUserPreferences(preferences: AudioPreferences): Promise<void> {
    this.setVolume(preferences.ambientVolume)

    if (preferences.ambientSound !== this.currentSound) {
      await this.playAmbientSound(preferences.ambientSound)
    }
  }

  /**
   * Enable user interaction flag (required for autoplay policy compliance)
   */
  enableUserInteraction(): void {
    this.hasUserInteracted = true
  }

  /**
   * Check if user interaction has been registered
   */
  hasUserInteraction(): boolean {
    return this.hasUserInteracted
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.activeSource !== null && this.currentSound !== 'silence'
  }

  /**
   * Get current ambient sound
   */
  getCurrentSound(): AmbientSound {
    return this.currentSound
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Register event handler
   */
  on<K extends keyof AudioEvents>(event: K, handler: AudioEventHandler<K>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler as AudioEventHandler<keyof AudioEvents>)
  }

  /**
   * Unregister event handler
   */
  off<K extends keyof AudioEvents>(event: K, handler: AudioEventHandler<K>): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler as AudioEventHandler<keyof AudioEvents>)
    }
  }

  /**
   * Clean up resources and close audio context
   */
  destroy(): void {
    // Clear fade timeouts
    this.fadeTimeouts.forEach(timeout => clearTimeout(timeout))
    this.fadeTimeouts.clear()

    // Stop current audio
    this.stopAudio()

    // Clear cache
    this.audioCache.clear()

    // Clear event handlers
    this.eventHandlers.clear()

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.gainNode = null
    this.initialized = false
    this.hasUserInteracted = false
  }

  /**
   * Private method to emit events to registered handlers
   */
  private emit<K extends keyof AudioEvents>(event: K, payload: AudioEvents[K]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as AudioEventHandler<K>)(payload)
        } catch (error) {
          console.error(`Error in audio event handler for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Private method to set gain node value with proper timing
   */
  private setGainValue(value: number): void {
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(value, this.audioContext.currentTime)
    }
  }

  /**
   * Private method to stop current audio source and clean up
   */
  private stopCurrentSource(): void {
    if (this.activeSource) {
      try {
        this.activeSource.source.stop()
        this.activeSource.source.disconnect()
      } catch (error) {
        // Source might already be stopped, ignore errors
      }
      this.activeSource = null
    }
  }

  /**
   * Private method to add audio buffer to cache with LRU management
   */
  private addToCache(sound: AmbientSound, buffer: AudioBuffer): void {
    // Remove oldest entries if cache is full
    if (this.audioCache.size >= this.maxCacheSize) {
      let oldestKey: AmbientSound | null = null
      let oldestTime = Date.now()

      for (const [key, entry] of this.audioCache.entries()) {
        if (entry.lastUsed < oldestTime) {
          oldestTime = entry.lastUsed
          oldestKey = key
        }
      }

      if (oldestKey) {
        this.audioCache.delete(oldestKey)
      }
    }

    // Add new entry
    this.audioCache.set(sound, {
      buffer,
      duration: buffer.duration,
      lastUsed: Date.now(),
    })
  }
}

// Export singleton instance for easy use across the application
export const audioService = new AudioService()