// MessageDisplay Component Tests
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MessageDisplay from '../../components/common/MessageDisplay';

// Mock timers for auto-hide functionality
jest.useFakeTimers();

describe('MessageDisplay', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });

  describe('Rendering', () => {
    test('should render message with default type', () => {
      render(<MessageDisplay message="Test message" onClose={mockOnClose} />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    test('should render success message', () => {
      render(<MessageDisplay message="Success!" type="success" onClose={mockOnClose} />);

      const messageElement = screen.getByText('Success!');
      expect(messageElement).toBeInTheDocument();
      // Check for success styling (depends on your implementation)
    });

    test('should render error message', () => {
      render(<MessageDisplay message="Error occurred" type="error" onClose={mockOnClose} />);

      const messageElement = screen.getByText('Error occurred');
      expect(messageElement).toBeInTheDocument();
      // Check for error styling
    });

    test('should render warning message', () => {
      render(<MessageDisplay message="Warning!" type="warning" onClose={mockOnClose} />);

      const messageElement = screen.getByText('Warning!');
      expect(messageElement).toBeInTheDocument();
    });

    test('should render info message', () => {
      render(<MessageDisplay message="Information" type="info" onClose={mockOnClose} />);

      const messageElement = screen.getByText('Information');
      expect(messageElement).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    test('should show close button', () => {
      render(<MessageDisplay message="Test message" onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    test('should call onClose when close button is clicked', () => {
      render(<MessageDisplay message="Test message" onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should support keyboard navigation for close button', () => {
      render(<MessageDisplay message="Test message" onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      fireEvent.keyDown(closeButton, { key: 'Enter' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auto-hide Functionality', () => {
    test('should auto-hide when autoHide is true', () => {
      render(<MessageDisplay message="Test message" onClose={mockOnClose} autoHide={true} />);

      expect(mockOnClose).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(5000); // Default auto-hide duration
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should not auto-hide when autoHide is false', () => {
      render(<MessageDisplay message="Test message" onClose={mockOnClose} autoHide={false} />);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('should use custom duration when provided', () => {
      render(
        <MessageDisplay 
          message="Test message" 
          onClose={mockOnClose} 
          autoHide={true} 
          duration={3000} 
        />
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(mockOnClose).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should clear timeout when component unmounts', () => {
      const { unmount } = render(
        <MessageDisplay message="Test message" onClose={mockOnClose} autoHide={true} />
      );

      unmount();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('should reset timeout when message changes', () => {
      const { rerender } = render(
        <MessageDisplay message="First message" onClose={mockOnClose} autoHide={true} />
      );

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      rerender(<MessageDisplay message="Second message" onClose={mockOnClose} autoHide={true} />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(mockOnClose).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('should have appropriate ARIA attributes', () => {
      render(<MessageDisplay message="Test message" type="error" onClose={mockOnClose} />);

      const messageElement = screen.getByRole('alert');
      expect(messageElement).toBeInTheDocument();
    });

    test('should have proper role for different message types', () => {
      const { rerender } = render(
        <MessageDisplay message="Info message" type="info" onClose={mockOnClose} />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<MessageDisplay message="Error message" type="error" onClose={mockOnClose} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('should have accessible close button', () => {
      render(<MessageDisplay message="Test message" onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveAttribute('aria-label', expect.stringMatching(/close|dismiss/i));
    });
  });

  describe('Content Handling', () => {
    test('should handle long messages', () => {
      const longMessage = 'This is a very long message that might need to wrap to multiple lines or be truncated depending on the design requirements of the application.';
      
      render(<MessageDisplay message={longMessage} onClose={mockOnClose} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    test('should handle empty message', () => {
      render(<MessageDisplay message="" onClose={mockOnClose} />);

      // Should still render the component structure
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should handle special characters in message', () => {
      const specialMessage = 'Message with special chars: <>&"\'';
      
      render(<MessageDisplay message={specialMessage} onClose={mockOnClose} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    test('should handle HTML entities safely', () => {
      const htmlMessage = 'Message with &lt;script&gt; tags';
      
      render(<MessageDisplay message={htmlMessage} onClose={mockOnClose} />);

      expect(screen.getByText(htmlMessage)).toBeInTheDocument();
    });
  });

  describe('Animation and Transitions', () => {
    test('should apply entrance animation classes', () => {
      render(<MessageDisplay message="Test message" onClose={mockOnClose} />);

      // Check for animation classes (depends on your CSS implementation)
      const messageContainer = screen.getByText('Test message').closest('[class*="message"]');
      expect(messageContainer).toHaveClass(expect.stringMatching(/enter|show|visible/));
    });

    test('should handle rapid message changes', () => {
      const { rerender } = render(
        <MessageDisplay message="Message 1" onClose={mockOnClose} />
      );

      rerender(<MessageDisplay message="Message 2" onClose={mockOnClose} />);
      rerender(<MessageDisplay message="Message 3" onClose={mockOnClose} />);

      expect(screen.getByText('Message 3')).toBeInTheDocument();
      expect(screen.queryByText('Message 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Message 2')).not.toBeInTheDocument();
    });
  });
});