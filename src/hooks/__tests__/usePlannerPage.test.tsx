
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { usePlannerPage } from '../usePlannerPage';
import { useAuth } from '@/context/AuthContext';
import { useOptimizedAssignments } from '../useOptimizedAssignments';

// Mock the dependencies
vi.mock('@/context/AuthContext');
vi.mock('../useOptimizedAssignments');
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    currentLanguage: 'en'
  })
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseOptimizedAssignments = useOptimizedAssignments as jest.MockedFunction<typeof useOptimizedAssignments>;

describe('usePlannerPage', () => {
  test('servicemedarbejder sees all published tasks regardless of assignment', () => {
    // Mock servicemedarbejder user
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user1',
        name: 'Mark Hansen',
        role: 'servicemedarbejder'
      }
    });

    // Mock assignments where user is not assigned to all tasks
    mockUseOptimizedAssignments.mockReturnValue({
      assignments: [
        {
          id: '1',
          title: 'Task A - Assigned to Mark',
          employees: ['Mark Hansen'],
          date: '2025-06-23', // Week 26
          published: true,
          cars: []
        },
        {
          id: '2',
          title: 'Task B - Assigned to Julie',
          employees: ['Julie Mortensen'],
          date: '2025-06-24', // Week 26
          published: true,
          cars: []
        },
        {
          id: '3',
          title: 'Task C - Assigned to Others',
          employees: ['Other User'],
          date: '2025-06-25', // Week 26
          published: true,
          cars: []
        }
      ],
      loading: false,
      error: null,
      operationStates: {},
      refetch: vi.fn(),
      deleteAssignment: vi.fn(),
      publishAssignment: vi.fn(),
      publishAssignmentsByDate: vi.fn(),
      updateAssignment: vi.fn(),
      createAssignment: vi.fn()
    });

    const { result } = renderHook(() => usePlannerPage());

    // Should show all 3 published tasks, not just the one assigned to Mark
    expect(result.current.weekAssignments).toHaveLength(3);
    expect(result.current.weekAssignments.find(a => a.title === 'Task A - Assigned to Mark')).toBeDefined();
    expect(result.current.weekAssignments.find(a => a.title === 'Task B - Assigned to Julie')).toBeDefined();
    expect(result.current.weekAssignments.find(a => a.title === 'Task C - Assigned to Others')).toBeDefined();
  });

  test('administrator sees all assignments regardless of published status', () => {
    // Mock administrator user
    mockUseAuth.mockReturnValue({
      user: {
        id: 'admin1',
        name: 'Admin User',
        role: 'administrator'
      }
    });

    // Mock assignments with mixed published status
    mockUseOptimizedAssignments.mockReturnValue({
      assignments: [
        {
          id: '1',
          title: 'Published Task',
          employees: ['Mark Hansen'],
          date: '2025-06-23',
          published: true,
          cars: []
        },
        {
          id: '2',
          title: 'Unpublished Task',
          employees: ['Julie Mortensen'],
          date: '2025-06-24',
          published: false,
          cars: []
        }
      ],
      loading: false,
      error: null,
      operationStates: {},
      refetch: vi.fn(),
      deleteAssignment: vi.fn(),
      publishAssignment: vi.fn(),
      publishAssignmentsByDate: vi.fn(),
      updateAssignment: vi.fn(),
      createAssignment: vi.fn()
    });

    const { result } = renderHook(() => usePlannerPage());

    // Should show both published and unpublished tasks
    expect(result.current.weekAssignments).toHaveLength(2);
  });
});
