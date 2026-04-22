import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast } from '@/app/components/Toast';

function TestButton({ message, type }: { message: string; type?: 'success' | 'error' | 'warning' | 'info' }) {
  const { showToast } = useToast();
  return <button onClick={() => showToast(message, type)}>Show Toast</button>;
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders provider with children', () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child</div>
      </ToastProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('shows toast message when triggered', () => {
    render(
      <ToastProvider>
        <TestButton message="Hello World" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('shows different toast types', () => {
    render(
      <ToastProvider>
        <TestButton message="Success msg" type="success" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Success msg')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows error type toast', () => {
    render(
      <ToastProvider>
        <TestButton message="Error msg" type="error" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Error msg')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('shows warning type toast', () => {
    render(
      <ToastProvider>
        <TestButton message="Warning msg" type="warning" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Warning msg')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('shows info type toast by default', () => {
    render(
      <ToastProvider>
        <TestButton message="Info msg" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Info msg')).toBeInTheDocument();
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('closes toast when close button clicked', () => {
    render(
      <ToastProvider>
        <TestButton message="Close me" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Close me')).toBeInTheDocument();

    const closeBtn = screen.getByText('×');
    fireEvent.click(closeBtn);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.queryByText('Close me')).not.toBeInTheDocument();
  });

  it('auto-dismisses toast after duration', async () => {
    render(
      <ToastProvider>
        <TestButton message="Auto dismiss" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Auto dismiss')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    await waitFor(() => {
      expect(screen.queryByText('Auto dismiss')).not.toBeInTheDocument();
    });
  });

  it('throws when useToast is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestButton message="x" />)).toThrow('useToast must be used within a ToastProvider');
    consoleError.mockRestore();
  });
});
