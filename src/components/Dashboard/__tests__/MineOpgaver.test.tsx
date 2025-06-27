
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import MineOpgaver from '../MineOpgaver';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';

// Mock the hooks
vi.mock('@/context/TranslationContext');
vi.mock('@/context/AuthContext');
vi.mock('@/hooks/useDashboard');

const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseDashboard = useDashboard as jest.MockedFunction<typeof useDashboard>;

describe('MineOpgaver', () => {
  beforeEach(() => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      currentLanguage: 'en'
    });
  });

  test('shows all assignees for multi-assignee tasks', () => {
    // Mock user data
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user1',
        name: 'Mark Hansen',
        role: 'servicemedarbejder'
      }
    });

    // Mock dashboard data with multi-assignee task
    mockUseDashboard.mockReturnValue({
      allAssignments: [
        {
          id: '1',
          title: 'Asbestkursus',
          description: 'Asbestos training course',
          date: '2025-06-23',
          fromTime: '08:00',
          toTime: '16:00',
          location: 'Training Center',
          employees: ['Mark Hansen', 'Julie Mortensen'], // Multiple assignees
          cars: [],
          published: true,
          responsibleUser: null
        }
      ],
      loading: false,
      error: null,
      selectedWeek: 26,
      selectedYear: 2025,
      handlePreviousWeek: vi.fn(),
      handleNextWeek: vi.fn(),
      resetToCurrentWeek: vi.fn(),
      refetch: vi.fn()
    });

    render(<MineOpgaver />);

    // Verify both names are displayed
    expect(screen.getByText('Mark Hansen, Julie Mortensen')).toBeInTheDocument();
    expect(screen.getByText('Asbestkursus')).toBeInTheDocument();
  });

  test('shows loading state correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user1', name: 'Mark Hansen', role: 'servicemedarbejder' }
    });

    mockUseDashboard.mockReturnValue({
      allAssignments: [],
      loading: true,
      error: null,
      selectedWeek: 26,
      selectedYear: 2025,
      handlePreviousWeek: vi.fn(),
      handleNextWeek: vi.fn(),
      resetToCurrentWeek: vi.fn(),
      refetch: vi.fn()
    });

    render(<MineOpgaver />);

    expect(screen.getByText('common.loading...')).toBeInTheDocument();
  });

  test('shows no tasks message when user has no assignments', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user1', name: 'Mark Hansen', role: 'servicemedarbejder' }
    });

    mockUseDashboard.mockReturnValue({
      allAssignments: [],
      loading: false,
      error: null,
      selectedWeek: 26,
      selectedYear: 2025,
      handlePreviousWeek: vi.fn(),
      handleNextWeek: vi.fn(),
      resetToCurrentWeek: vi.fn(),
      refetch: vi.fn()
    });

    render(<MineOpgaver />);

    expect(screen.getByText('dashboard.noTasks')).toBeInTheDocument();
  });
});
