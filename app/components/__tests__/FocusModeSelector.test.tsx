import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FocusModeSelector from '../FocusModeSelector';

describe('FocusModeSelector', () => {
  describe('Rendering', () => {
    it('should render all four focus mode options', () => {
      render(
        <FocusModeSelector selectedMode="study" onModeChange={vi.fn()} />
      );

      expect(screen.getByLabelText(/study/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/work/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/yoga/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/meditation/i)).toBeInTheDocument();
    });

    it('should mark selected mode as checked', () => {
      render(
        <FocusModeSelector selectedMode="work" onModeChange={vi.fn()} />
      );

      const workOption = screen.getByLabelText(/work/i);
      expect(workOption).toBeChecked();
    });

    it('should not mark other modes as checked when one is selected', () => {
      render(
        <FocusModeSelector selectedMode="study" onModeChange={vi.fn()} />
      );

      expect(screen.getByLabelText(/study/i)).toBeChecked();
      expect(screen.getByLabelText(/work/i)).not.toBeChecked();
      expect(screen.getByLabelText(/yoga/i)).not.toBeChecked();
      expect(screen.getByLabelText(/meditation/i)).not.toBeChecked();
    });
  });

  describe('User Interaction', () => {
    it('should call onModeChange when a different mode is clicked', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();

      render(
        <FocusModeSelector selectedMode="study" onModeChange={onModeChange} />
      );

      const workOption = screen.getByLabelText(/work/i);
      await user.click(workOption);

      expect(onModeChange).toHaveBeenCalledWith('work');
      expect(onModeChange).toHaveBeenCalledTimes(1);
    });

    it('should call onModeChange with correct mode for each option', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();

      render(
        <FocusModeSelector selectedMode="study" onModeChange={onModeChange} />
      );

      // Click Yoga
      await user.click(screen.getByLabelText(/yoga/i));
      expect(onModeChange).toHaveBeenLastCalledWith('yoga');

      // Click Meditation
      await user.click(screen.getByLabelText(/meditation/i));
      expect(onModeChange).toHaveBeenLastCalledWith('meditation');

      // Click Work
      await user.click(screen.getByLabelText(/work/i));
      expect(onModeChange).toHaveBeenLastCalledWith('work');
    });

    it('should not trigger onChange when clicking the currently selected mode', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();

      render(
        <FocusModeSelector selectedMode="study" onModeChange={onModeChange} />
      );

      const studyOption = screen.getByLabelText(/study/i);
      await user.click(studyOption);

      // Radio buttons don't fire onChange when clicking already selected option
      expect(onModeChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should use radio group for focus mode selection', () => {
      render(
        <FocusModeSelector selectedMode="study" onModeChange={vi.fn()} />
      );

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
    });

    it('should have accessible label for radio group', () => {
      render(
        <FocusModeSelector selectedMode="study" onModeChange={vi.fn()} />
      );

      const radioGroup = screen.getByRole('radiogroup', {
        name: /focus mode/i,
      });
      expect(radioGroup).toBeInTheDocument();
    });

    it('should use radio buttons with correct type', () => {
      render(
        <FocusModeSelector selectedMode="study" onModeChange={vi.fn()} />
      );

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(4);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();

      render(
        <FocusModeSelector selectedMode="study" onModeChange={onModeChange} />
      );

      const studyOption = screen.getByLabelText(/study/i);
      studyOption.focus();

      // Arrow down should move to next option
      await user.keyboard('{ArrowDown}');
      expect(onModeChange).toHaveBeenCalled();
    });
  });

  describe('Visual Styling', () => {
    it('should render mode options in a horizontal layout', () => {
      const { container } = render(
        <FocusModeSelector selectedMode="study" onModeChange={vi.fn()} />
      );

      const radioGroup = container.querySelector('[role="radiogroup"]');
      expect(radioGroup).toHaveClass('flex');
    });

    it('should apply correct styling to selected mode', () => {
      render(
        <FocusModeSelector selectedMode="study" onModeChange={vi.fn()} />
      );

      const studyOption = screen.getByLabelText(/study/i);
      const studyLabel = studyOption.closest('label');

      // Should have visual indication of being selected
      expect(studyLabel).toHaveClass('border-primary');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid mode changes', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();

      render(
        <FocusModeSelector selectedMode="study" onModeChange={onModeChange} />
      );

      // Rapidly click different modes (study is already selected, so no onChange for first click)
      await user.click(screen.getByLabelText(/work/i));
      await user.click(screen.getByLabelText(/yoga/i));
      await user.click(screen.getByLabelText(/meditation/i));

      expect(onModeChange).toHaveBeenCalledTimes(3);
      expect(onModeChange).toHaveBeenLastCalledWith('meditation');
    });

    it('should maintain selection state correctly', () => {
      const { rerender } = render(
        <FocusModeSelector selectedMode="study" onModeChange={vi.fn()} />
      );

      expect(screen.getByLabelText(/study/i)).toBeChecked();

      rerender(
        <FocusModeSelector selectedMode="meditation" onModeChange={vi.fn()} />
      );

      expect(screen.getByLabelText(/meditation/i)).toBeChecked();
      expect(screen.getByLabelText(/study/i)).not.toBeChecked();
    });
  });
});
