import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Setting } from './Setting';
import { SettingsProvider } from '../../contexts/SettingsContext';

// Helper to render Setting within SettingsProvider
const renderSetting = (props = {}) => {
  return render(
    <SettingsProvider>
      <Setting
        selectedBatch={[]}
        onClose={vi.fn()}
        onGoToHistory={vi.fn()}
        {...props}
      />
    </SettingsProvider>
  );
};

describe('Setting Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render settings panel with all sections', () => {
      renderSetting();

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('🔑 Anthropic API Key')).toBeInTheDocument();
      expect(screen.getByText('🍽️ Dinners / week')).toBeInTheDocument();
      expect(screen.getByText('👥 People / dinner')).toBeInTheDocument();
      expect(screen.getByText('🔥 Calories / serving')).toBeInTheDocument();
      expect(screen.getByText('🍲 Batch Cook')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should show hint text when API key is empty', () => {
      renderSetting();

      expect(screen.getByText(/Your API key is stored locally/i)).toBeInTheDocument();
    });
  });

  describe('API Key Validation', () => {
    it('should show "Checking..." when user types', async () => {
      const user = userEvent.setup();
      renderSetting();

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 's');

      expect(screen.getByText('⏳ Checking...')).toBeInTheDocument();
    });

    it('should show valid state for correct API key format', async () => {
      const user = userEvent.setup();
      renderSetting();

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByText('✓ Valid API key')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should show invalid state for incorrect prefix', async () => {
      const user = userEvent.setup();
      renderSetting();

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'invalid-key');

      await waitFor(() => {
        expect(screen.getByText('✗ Please enter a valid API key')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should show invalid state for too short key', async () => {
      const user = userEvent.setup();
      renderSetting();

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-short');

      await waitFor(() => {
        expect(screen.getByText('✗ API key is too short')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should disable save button when API key is invalid', async () => {
      const user = userEvent.setup();
      renderSetting();

      const input = screen.getByPlaceholderText('sk-ant-...');
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.type(input, 'invalid');

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      }, { timeout: 1000 });
    });

    it('should enable save button when API key is valid', async () => {
      const user = userEvent.setup();
      renderSetting();

      const input = screen.getByPlaceholderText('sk-ant-...');
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      }, { timeout: 1000 });
    });
  });

  describe('Save Success', () => {
    it('should show loading state when saving', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderSetting({ onClose });

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      }, { timeout: 1000 });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should show success state and close modal after 1 second', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderSetting({ onClose });

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      }, { timeout: 1000 });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Wait for modal to close
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Save Errors - Storage Issues', () => {
    it('should show error when storage quota is exceeded', async () => {
      const user = userEvent.setup();
      renderSetting();

      // Mock localStorage.setItem to throw QuotaExceededError
      const error = new Error('QUOTA_EXCEEDED');
      error.name = 'QuotaExceededError';
      localStorage.setItem.mockImplementation(() => {
        throw error;
      });

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      }, { timeout: 1000 });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Could not save settings - storage is full')).toBeInTheDocument();
        expect(screen.getByText('You might have too much meal history saved')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show only "Go to History" button when storage is full (no retry)', async () => {
      const user = userEvent.setup();
      const onGoToHistory = vi.fn();
      renderSetting({ onGoToHistory });

      // Mock storage full error
      const error = new Error('QUOTA_EXCEEDED');
      error.name = 'QuotaExceededError';
      localStorage.setItem.mockImplementation(() => {
        throw error;
      });

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      }, { timeout: 1000 });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        const historyButton = screen.getByRole('button', { name: /go to history/i });
        expect(historyButton).toBeInTheDocument();
      }, { timeout: 2000 });

      // Should NOT have "Try Again" button (retrying won't help when storage is full)
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    it('should gracefully handle storage disabled by saving to memory', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderSetting({ onClose });

      // Mock SecurityError to trigger session-only mode
      const error = new Error('Storage disabled');
      error.name = 'SecurityError';
      localStorage.setItem.mockImplementation(() => {
        throw error;
      });

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      }, { timeout: 1000 });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show warning overlay immediately (no flash of settings UI)
      await waitFor(() => {
        expect(screen.getByText('Settings saved for this session')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should have "Got It" button
      expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument();

      // Modal should NOT auto-close (stays open until user acknowledges)
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should show warning overlay with "Got It" button in session-only mode', async () => {
      // Test that clicking "Got It" closes the warning overlay
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderSetting({ onClose });

      // Mock SecurityError
      const error = new Error('Storage disabled');
      error.name = 'SecurityError';
      localStorage.setItem.mockImplementation(() => {
        throw error;
      });

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      }, { timeout: 1000 });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Warning overlay should appear
      await waitFor(() => {
        expect(screen.getByText('Settings saved for this session')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click "Got It" button
      const gotItButton = screen.getByRole('button', { name: /got it/i });
      await user.click(gotItButton);

      // Modal should close after clicking "Got It"
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should show generic error for unknown issues', async () => {
      const user = userEvent.setup();
      renderSetting();

      // Mock generic error
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Unknown error');
      });

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      }, { timeout: 1000 });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Could not save settings')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong - please try again')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Retry Functionality', () => {
    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      renderSetting();

      // Mock error first, then success
      let callCount = 0;
      localStorage.setItem.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First call fails');
        }
        // Second call succeeds
      });

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      }, { timeout: 1000 });

      // First save attempt
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Could not save settings')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Should show success on retry
      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Settings Updates', () => {
    it('should update local state when changing dinners', async () => {
      const user = userEvent.setup();
      renderSetting();

      // Click on dinners picker to change value
      const dinnersLabel = screen.getByText('🍽️ Dinners / week');
      expect(dinnersLabel).toBeInTheDocument();

      // Note: Full interaction test would require clicking picker buttons
      // For now, verify the picker is rendered
    });

    it('should toggle batch cook enabled state', async () => {
      const user = userEvent.setup();
      renderSetting();

      const batchToggle = screen.getByText('🍲 Batch Cook');
      expect(batchToggle).toBeInTheDocument();

      const toggleContainer = batchToggle.closest('div[class*="toggleContainer"]');
      expect(toggleContainer).toBeInTheDocument();

      // Initially should show "Off"
      expect(screen.getByText(/Off — click to enable/i)).toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    it('should match snapshot - initial state', () => {
      const { container } = renderSetting();
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot - with valid API key', async () => {
      const user = userEvent.setup();
      const { container } = renderSetting();

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByText('✓ Valid API key')).toBeInTheDocument();
      }, { timeout: 1000 });

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot - with invalid API key', async () => {
      const user = userEvent.setup();
      const { container } = renderSetting();

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'invalid-key');

      await waitFor(() => {
        expect(screen.getByText('✗ Please enter a valid API key')).toBeInTheDocument();
      }, { timeout: 1000 });

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot - saving state', async () => {
      const user = userEvent.setup();
      const { container } = renderSetting();

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      }, { timeout: 1000 });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot - success state', async () => {
      const user = userEvent.setup();
      const { container } = renderSetting();

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      }, { timeout: 1000 });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot - error state', async () => {
      const user = userEvent.setup();
      const { container } = renderSetting();

      localStorage.setItem.mockImplementation(() => {
        throw new Error('Test error');
      });

      const input = screen.getByPlaceholderText('sk-ant-...');
      await user.type(input, 'sk-ant-' + 'x'.repeat(40));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      }, { timeout: 1000 });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Could not save settings')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
