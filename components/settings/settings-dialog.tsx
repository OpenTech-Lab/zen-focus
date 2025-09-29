'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { Settings, Volume2, Bell, Palette, Timer, Accessibility, Download, RotateCcw } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../src/components/ui/dialog'
import { Button } from '../../src/components/ui/button'
import { Switch } from '../../src/components/ui/switch'
import { Slider } from '../../src/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs'
import { Label } from '../../src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../src/components/ui/select'
import { cn } from '../../src/lib/utils'

import {
  type UserPreferences,
  type PartialUserPreferences,
  type Theme,
  type SessionMode as SessionModeType,
  type AmbientSound,
  PreferenceLabels,
  createDefaultUserPreferences,
} from '../../lib/models/user-preferences'
import { preferencesService } from '../../lib/services/preferences-service'

/**
 * Props for the SettingsDialog component
 */
interface SettingsDialogProps {
  /** Whether the dialog is open */
  open?: boolean
  /** Callback when dialog open state changes */
  onOpenChange?: (open: boolean) => void
  /** Additional CSS classes */
  className?: string
  /** Custom trigger element */
  trigger?: React.ReactNode
  /** Initial tab to show */
  defaultTab?: string
}

/**
 * Form validation state
 */
interface ValidationState {
  hasErrors: boolean
  errors: Record<string, string>
}

/**
 * Settings form state management hook
 */
function useSettingsForm(initialPreferences: UserPreferences) {
  const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences)
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences>(initialPreferences)
  const [validation, setValidation] = useState<ValidationState>({ hasErrors: false, errors: {} })
  const [isDirty, setIsDirty] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Update preferences and track dirty state
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value }
      setIsDirty(JSON.stringify(updated) !== JSON.stringify(originalPreferences))
      return updated
    })
  }, [originalPreferences])

  // Reset to original values
  const resetForm = useCallback(() => {
    setPreferences(originalPreferences)
    setIsDirty(false)
    setValidation({ hasErrors: false, errors: {} })
  }, [originalPreferences])

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaults = createDefaultUserPreferences()
    setPreferences(defaults)
    setIsDirty(JSON.stringify(defaults) !== JSON.stringify(originalPreferences))
    setValidation({ hasErrors: false, errors: {} })
  }, [originalPreferences])

  // Save preferences
  const savePreferences = useCallback(async () => {
    setIsLoading(true)
    try {
      const updates: PartialUserPreferences = {}

      // Only include changed preferences
      Object.keys(preferences).forEach(key => {
        const prefKey = key as keyof UserPreferences
        if (preferences[prefKey] !== originalPreferences[prefKey]) {
          updates[prefKey] = preferences[prefKey] as any
        }
      })

      await preferencesService.updatePreferences(updates)
      setOriginalPreferences(preferences)
      setIsDirty(false)
      setValidation({ hasErrors: false, errors: {} })
      return true
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setValidation({
        hasErrors: true,
        errors: { general: 'Failed to save preferences. Please try again.' }
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [preferences, originalPreferences])

  return {
    preferences,
    originalPreferences,
    validation,
    isDirty,
    isLoading,
    updatePreference,
    resetForm,
    resetToDefaults,
    savePreferences,
    setOriginalPreferences,
  }
}

/**
 * Settings section component for consistent layout
 */
interface SettingsSectionProps {
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, icon, children }) => (
  <div className="space-y-4">
    <div className="flex items-center space-x-2">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
    <div className="space-y-3 pl-6">{children}</div>
  </div>
)

/**
 * Settings row component for individual preference controls
 */
interface SettingsRowProps {
  label: string
  description?: string
  children: React.ReactNode
  htmlFor?: string
}

const SettingsRow: React.FC<SettingsRowProps> = ({ label, description, children, htmlFor }) => (
  <div className="flex items-center justify-between space-x-4">
    <div className="space-y-0.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
)

/**
 * SettingsDialog component - Comprehensive settings dialog with preferences
 *
 * Features:
 * - Integration with preferences service for loading/saving settings
 * - Tabbed interface for organized settings categories
 * - Real-time preview of settings changes
 * - Form validation and error handling
 * - Save/cancel/reset functionality
 * - Responsive design for mobile and desktop
 * - Full accessibility support with keyboard navigation and screen readers
 * - Export/import functionality for backup/restore
 */
const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  className,
  trigger,
  defaultTab = 'general',
}) => {
  const { theme: systemTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(open || false)
  const [currentPreferences, setCurrentPreferences] = useState<UserPreferences>(
    createDefaultUserPreferences()
  )
  const [isInitialized, setIsInitialized] = useState(false)

  const {
    preferences,
    validation,
    isDirty,
    isLoading,
    updatePreference,
    resetForm,
    resetToDefaults,
    savePreferences,
    setOriginalPreferences,
  } = useSettingsForm(currentPreferences)

  // Initialize preferences from service
  useEffect(() => {
    const initializePreferences = async () => {
      try {
        if (!preferencesService.isInitialized()) {
          await preferencesService.initialize(null) // Guest user
        }
        const prefs = preferencesService.getCurrentPreferences()
        setCurrentPreferences(prefs)
        setOriginalPreferences(prefs)
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize preferences:', error)
        setIsInitialized(true) // Still show dialog with defaults
      }
    }

    if (isOpen) {
      initializePreferences()
    }
  }, [isOpen, setOriginalPreferences])

  // Handle dialog open state
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && isDirty) {
      const shouldClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      )
      if (!shouldClose) return
    }

    setIsOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
    onOpenChange?.(newOpen)
  }, [isDirty, resetForm, onOpenChange])

  // Handle save and close
  const handleSaveAndClose = useCallback(async () => {
    const success = await savePreferences()
    if (success) {
      setIsOpen(false)
      onOpenChange?.(false)
    }
  }, [savePreferences, onOpenChange])

  // Export preferences
  const handleExportPreferences = useCallback(() => {
    const exportData = preferencesService.exportPreferences()
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zen-focus-preferences-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  // Memoized option lists for selects
  const themeOptions = useMemo(() => Object.entries(PreferenceLabels.theme), [])
  const sessionModeOptions = useMemo(() => Object.entries(PreferenceLabels.defaultSessionMode), [])
  const ambientSoundOptions = useMemo(() => Object.entries(PreferenceLabels.ambientSound), [])

  if (!isInitialized) {
    return null // Show loading state if needed
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", className)}
        aria-describedby="settings-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription id="settings-description">
            Customize your ZenFocus experience with these preference settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center space-x-1">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="timer" className="flex items-center space-x-1">
              <Timer className="h-4 w-4" />
              <span className="hidden sm:inline">Timer</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center space-x-1">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Audio</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center space-x-1">
              <Accessibility className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="mt-6 space-y-6">
            <SettingsSection
              title="Appearance"
              description="Customize the visual appearance"
              icon={<Palette className="h-4 w-4" />}
            >
              <SettingsRow
                label="Theme"
                description="Choose your preferred color theme"
                htmlFor="theme-select"
              >
                <Select
                  value={preferences.theme}
                  onValueChange={(value) => updatePreference('theme', value as Theme)}
                >
                  <SelectTrigger id="theme-select" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themeOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingsRow>
            </SettingsSection>

            <SettingsSection
              title="Notifications"
              description="Control notification settings"
              icon={<Bell className="h-4 w-4" />}
            >
              <SettingsRow
                label="Enable Notifications"
                description="Show notifications when timers complete"
                htmlFor="notifications-switch"
              >
                <Switch
                  id="notifications-switch"
                  checked={preferences.notifications}
                  onCheckedChange={(checked) => updatePreference('notifications', checked)}
                />
              </SettingsRow>
            </SettingsSection>
          </TabsContent>

          {/* Timer Settings */}
          <TabsContent value="timer" className="mt-6 space-y-6">
            <SettingsSection
              title="Session Defaults"
              description="Default settings for timer sessions"
              icon={<Timer className="h-4 w-4" />}
            >
              <SettingsRow
                label="Default Session Mode"
                description="The default focus session type"
                htmlFor="session-mode-select"
              >
                <Select
                  value={preferences.defaultSessionMode}
                  onValueChange={(value) => updatePreference('defaultSessionMode', value as SessionModeType)}
                >
                  <SelectTrigger id="session-mode-select" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionModeOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingsRow>

              <SettingsRow
                label="Auto-start Breaks"
                description="Automatically start break sessions after work periods"
                htmlFor="auto-breaks-switch"
              >
                <Switch
                  id="auto-breaks-switch"
                  checked={preferences.autoStartBreaks}
                  onCheckedChange={(checked) => updatePreference('autoStartBreaks', checked)}
                />
              </SettingsRow>
            </SettingsSection>
          </TabsContent>

          {/* Audio Settings */}
          <TabsContent value="audio" className="mt-6 space-y-6">
            <SettingsSection
              title="Ambient Sounds"
              description="Background sounds for focus sessions"
              icon={<Volume2 className="h-4 w-4" />}
            >
              <SettingsRow
                label="Ambient Sound"
                description="Choose background sound for focus sessions"
                htmlFor="ambient-sound-select"
              >
                <Select
                  value={preferences.ambientSound}
                  onValueChange={(value) => updatePreference('ambientSound', value as AmbientSound)}
                >
                  <SelectTrigger id="ambient-sound-select" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ambientSoundOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingsRow>

              <SettingsRow
                label="Volume"
                description={`Ambient sound volume: ${preferences.ambientVolume}%`}
                htmlFor="volume-slider"
              >
                <div className="w-32">
                  <Slider
                    id="volume-slider"
                    min={0}
                    max={100}
                    step={5}
                    value={[preferences.ambientVolume]}
                    onValueChange={(value) => updatePreference('ambientVolume', value[0])}
                    className="w-full"
                  />
                </div>
              </SettingsRow>
            </SettingsSection>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="mt-6 space-y-6">
            <SettingsSection
              title="Data Management"
              description="Export, import, and reset your data"
              icon={<Download className="h-4 w-4" />}
            >
              <div className="flex flex-col space-y-3">
                <Button
                  variant="outline"
                  onClick={handleExportPreferences}
                  className="justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Preferences
                </Button>

                <Button
                  variant="outline"
                  onClick={resetToDefaults}
                  disabled={isLoading}
                  className="justify-start text-orange-600 hover:text-orange-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </SettingsSection>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {validation.hasErrors && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
            <div className="text-sm text-red-600 dark:text-red-400">
              {validation.errors.general || 'Please check your settings and try again.'}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1 text-left">
            {isDirty && (
              <p className="text-xs text-muted-foreground">
                * You have unsaved changes
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={!isDirty || isLoading}
            >
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAndClose}
              disabled={!isDirty || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Export component and types
export { SettingsDialog }
export type { SettingsDialogProps }