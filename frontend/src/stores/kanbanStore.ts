import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  KanbanBoard, 
  KanbanTask,
  Label, 
  Notification, 
  BoardAnalytics,
  TicketStatus,
  TaskStatus 
} from '../components/kanban/types/types';
import { kanbanApi } from '../components/kanban/api/kanban';
import { useAuthStore } from './authStore';

interface KanbanState {
  // State
  boards: KanbanBoard[];
  currentBoard: KanbanBoard | null;
  labels: Label[];
  notifications: Notification[];
  unreadNotificationCount: number;
  analytics: BoardAnalytics | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchBoards: () => Promise<void>;
  fetchBoard: (boardId: string) => Promise<void>;
  createBoard: (boardData: Partial<KanbanBoard>) => Promise<void>;
  updateBoard: (boardId: string, boardData: Partial<KanbanBoard>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  
  moveTicket: (ticketId: string, newStatus: TicketStatus, newPosition: number, boardId?: string) => Promise<void>;
  
  createTask: (taskData: Partial<KanbanTask>) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, newPosition: number, columnId?: string) => Promise<void>;
  
  fetchLabels: () => Promise<void>;
  createLabel: (labelData: Partial<Label>) => Promise<void>;
  updateLabel: (labelId: string, labelData: Partial<Label>) => Promise<void>;
  deleteLabel: (labelId: string) => Promise<void>;
  
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  fetchNotificationCount: () => Promise<void>;
  
  fetchBoardAnalytics: (boardId: string, startDate?: string, endDate?: string) => Promise<void>;
  
  setCurrentBoard: (board: KanbanBoard | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useKanbanStore = create<KanbanState>()(
  devtools(
    (set) => ({
      // Initial state
      boards: [],
      currentBoard: null,
      labels: [],
      notifications: [],
      unreadNotificationCount: 0,
      analytics: null,
      loading: false,
      error: null,

      // Board actions
      fetchBoards: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        set({ loading: true, error: null });
        try {
          const boards = await kanbanApi.getAllBoards();
          set({ boards, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch boards',
            loading: false
          });
        }
      },

      fetchBoard: async (boardId: string) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        set({ loading: true, error: null });
        try {
          const board = await kanbanApi.getBoardById(boardId);
          set({ currentBoard: board, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch board',
            loading: false
          });
        }
      },

      createBoard: async (boardData: Partial<KanbanBoard>) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        set({ loading: true, error: null });
        try {
          const newBoard = await kanbanApi.createBoard(boardData);
          set(state => ({ 
            boards: [...state.boards, newBoard], 
            loading: false 
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create board', 
            loading: false 
          });
        }
      },

      updateBoard: async (boardId: string, boardData: Partial<KanbanBoard>) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        set({ loading: true, error: null });
        try {
          const updatedBoard = await kanbanApi.updateBoard(boardId, boardData);
          set(state => ({
            boards: state.boards.map(board => 
              board.id === boardId ? updatedBoard : board
            ),
            currentBoard: state.currentBoard?.id === boardId ? updatedBoard : state.currentBoard,
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update board', 
            loading: false 
          });
        }
      },

      deleteBoard: async (boardId: string) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        set({ loading: true, error: null });
        try {
          await kanbanApi.deleteBoard(boardId);
          set(state => ({
            boards: state.boards.filter(board => board.id !== boardId),
            currentBoard: state.currentBoard?.id === boardId ? null : state.currentBoard,
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete board', 
            loading: false 
          });
        }
      },

      // Ticket movement
      moveTicket: async (ticketId: string, newStatus: TicketStatus, newPosition: number, boardId?: string) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        try {
          const updatedTicket = await kanbanApi.moveTicket(ticketId, {
            newStatus,
            newPosition,
            boardId
          });

          // Update the current board's tickets
          set(state => {
            if (!state.currentBoard) return state;

            const updatedTickets = state.currentBoard.tickets.map(ticket =>
              ticket.id === ticketId ? { ...ticket, ...updatedTicket } : ticket
            );

            return {
              currentBoard: {
                ...state.currentBoard,
                tickets: updatedTickets
              }
            };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to move ticket'
          });
        }
      },

      // Task actions
      createTask: async (taskData: Partial<KanbanTask>) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        set({ loading: true, error: null });
        try {
          const newTask = await kanbanApi.createTask(taskData);
          
          // Add the new task to the current board
          set(state => {
            if (!state.currentBoard) return { loading: false };

            return {
              currentBoard: {
                ...state.currentBoard,
                tasks: [...(state.currentBoard.tasks || []), newTask]
              },
              loading: false
            };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create task', 
            loading: false 
          });
        }
      },

      moveTask: async (taskId: string, newStatus: TaskStatus, newPosition: number, columnId?: string) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        try {
          const updatedTask = await kanbanApi.moveTask(taskId, {
            newStatus,
            newPosition,
            columnId
          });

          // Update the current board's tasks
          set(state => {
            if (!state.currentBoard) return state;

            const updatedTasks = (state.currentBoard.tasks || []).map(task =>
              task.id === taskId ? { ...task, ...updatedTask } : task
            );

            return {
              currentBoard: {
                ...state.currentBoard,
                tasks: updatedTasks
              }
            };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to move task'
          });
        }
      },

      // Label actions
      fetchLabels: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        try {
          const labels = await kanbanApi.getAllLabels();
          set({ labels });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch labels'
          });
        }
      },

      createLabel: async (labelData: Partial<Label>) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        try {
          const newLabel = await kanbanApi.createLabel(labelData);
          set(state => ({ 
            labels: [...state.labels, newLabel]
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create label'
          });
        }
      },

      updateLabel: async (labelId: string, labelData: Partial<Label>) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        try {
          const updatedLabel = await kanbanApi.updateLabel(labelId, labelData);
          set(state => ({
            labels: state.labels.map(label => 
              label.id === labelId ? updatedLabel : label
            )
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update label'
          });
        }
      },

      deleteLabel: async (labelId: string) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        try {
          await kanbanApi.deleteLabel(labelId);
          set(state => ({
            labels: state.labels.filter(label => label.id !== labelId)
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete label'
          });
        }
      },

      // Notification actions
      fetchNotifications: async (unreadOnly = false) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        try {
          const notifications = await kanbanApi.getNotifications({ unreadOnly });
          set({ notifications });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch notifications'
          });
        }
      },

      markNotificationAsRead: async (notificationId: string) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        try {
          await kanbanApi.markNotificationAsRead(notificationId);
          set(state => ({
            notifications: state.notifications.map(notification =>
              notification.id === notificationId 
                ? { ...notification, isRead: true }
                : notification
            ),
            unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1)
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to mark notification as read'
          });
        }
      },

      markAllNotificationsAsRead: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        try {
          await kanbanApi.markAllNotificationsAsRead();
          set(state => ({
            notifications: state.notifications.map(notification => ({
              ...notification,
              isRead: true
            })),
            unreadNotificationCount: 0
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to mark all notifications as read'
          });
        }
      },

      fetchNotificationCount: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        try {
          const { unreadCount } = await kanbanApi.getNotificationCount();
          set({ unreadNotificationCount: unreadCount });
        } catch (error) {
          console.error('Failed to fetch notification count:', error);
        }
      },

      // Analytics
      fetchBoardAnalytics: async (boardId: string, startDate?: string, endDate?: string) => {
        const { token } = useAuthStore.getState();
        if (!token) return;
        try {
          const analytics = await kanbanApi.getBoardAnalytics(boardId, { startDate, endDate });
          set({ analytics });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch analytics'
          });
        }
      },

      // Utility actions
      setCurrentBoard: (board: KanbanBoard | null) => {
        set({ currentBoard: board });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'kanban-store'
    }
  )
);