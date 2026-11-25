import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '@/services/ApiService';

export interface NotificationItem {
  id: number;
  companyId: number;
  tradingCompanyId: number;
  tradingCompanyName: string;
  eventType: string;
  quantity: number | null;
  unit: string | null;
  message: string;
  referenceId: number | null;
  screenPath: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  page: number;
  hasMore: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  page: 0,
  hasMore: true,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async ({ companyId, page = 0 }: { companyId: string; page?: number }) => {
    const data = await apiService.get('/notifications', { companyId, page, size: 20 });
    return { data, page };
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/unreadCount',
  async (companyId: string) => {
    const data = await apiService.get('/notifications/unread-count', { companyId });
    return data.count as number;
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async ({ id, companyId }: { id: number; companyId: string }) => {
    await apiService.put(`/notifications/${id}/read?companyId=${companyId}`, {});
    return id;
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (companyId: string) => {
    await apiService.put(`/notifications/read-all?companyId=${companyId}`, {});
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async ({ id, companyId }: { id: number; companyId: string }) => {
    await apiService.delete(`/notifications/${id}?companyId=${companyId}`);
    return id;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pushNotification(state, action: PayloadAction<NotificationItem>) {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    resetNotifications(state) {
      state.notifications = [];
      state.page = 0;
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { data, page } = action.payload;
        const items: NotificationItem[] = data.content ?? [];
        if (page === 0) {
          state.notifications = items;
        } else {
          state.notifications = [...state.notifications, ...items];
        }
        state.page = page;
        state.hasMore = !data.last;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const n = state.notifications.find((n) => n.id === action.payload);
        if (n && !n.isRead) {
          n.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => { n.isRead = true; });
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const deleted = state.notifications.find((n) => n.id === action.payload);
        if (deleted && !deleted.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      });
  },
});

export const { pushNotification, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
