import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('React.memo optimization', () => {
  it('should not re-render when props do not change', () => {
    const renderSpy = vi.fn();

    const TestComponent = React.memo(({ value }: { value: string }) => {
      renderSpy();
      return <div>{value}</div>;
    });
    TestComponent.displayName = 'TestComponent';

    const { rerender } = render(<TestComponent value="test" />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with same props
    rerender(<TestComponent value="test" />);
    expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render

    // Re-render with different props
    rerender(<TestComponent value="changed" />);
    expect(renderSpy).toHaveBeenCalledTimes(2); // Should re-render
  });

  it('should re-render when callback props change reference', () => {
    const renderSpy = vi.fn();
    const onClick = vi.fn();

    const TestComponent = React.memo(({ onClick }: { onClick: () => void }) => {
      renderSpy();
      return <button onClick={onClick}>Click</button>;
    });
    TestComponent.displayName = 'TestComponent';

    const { rerender } = render(<TestComponent onClick={onClick} />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with same callback reference
    rerender(<TestComponent onClick={onClick} />);
    expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render

    // Re-render with new callback reference
    const newOnClick = vi.fn();
    rerender(<TestComponent onClick={newOnClick} />);
    expect(renderSpy).toHaveBeenCalledTimes(2); // Should re-render
  });

  it('should skip re-render with custom comparison function', () => {
    const renderSpy = vi.fn();

    const TestComponent = React.memo(
      ({ user }: { user: { id: number; name: string } }) => {
        renderSpy();
        return <div>{user.name}</div>;
      },
      (prevProps, nextProps) => {
        // Only compare id for equality
        return prevProps.user.id === nextProps.user.id;
      }
    );
    TestComponent.displayName = 'TestComponent';

    const { rerender } = render(<TestComponent user={{ id: 1, name: 'John' }} />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with same id but different name
    rerender(<TestComponent user={{ id: 1, name: 'Jane' }} />);
    expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render due to custom comparison

    // Re-render with different id
    rerender(<TestComponent user={{ id: 2, name: 'Jane' }} />);
    expect(renderSpy).toHaveBeenCalledTimes(2); // Should re-render
  });
});
