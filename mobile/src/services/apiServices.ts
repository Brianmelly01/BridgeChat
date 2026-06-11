import apiClient from './apiClient';

// ─── Auth ───────────────────────────────────────────────────
export const authService = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  firebaseLogin: (idToken: string) => apiClient.post('/auth/firebase-login', { idToken }),
  refreshToken: (refreshToken: string) => apiClient.post('/auth/refresh-token', { refreshToken }),
  logout: () => apiClient.post('/auth/logout'),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) => apiClient.post('/auth/reset-password', data),
  verifyEmail: (code: string) => apiClient.post('/auth/verify-email', { code }),
  getMe: () => apiClient.get('/auth/me'),
};

// ─── Users ──────────────────────────────────────────────────
export const userService = {
  searchUsers: (q: string) => apiClient.get('/users/search', { params: { q } }),
  getUserById: (id: string) => apiClient.get(`/users/${id}`),
  updateProfile: (data: any) => apiClient.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAccount: () => apiClient.delete('/users/account'),
  followUser: (id: string) => apiClient.post(`/users/${id}/follow`),
  unfollowUser: (id: string) => apiClient.delete(`/users/${id}/follow`),
  getFollowers: (id: string, cursor?: string) => apiClient.get(`/users/${id}/followers`, { params: { cursor } }),
  getFollowing: (id: string, cursor?: string) => apiClient.get(`/users/${id}/following`, { params: { cursor } }),
  blockUser: (id: string) => apiClient.post(`/users/${id}/block`),
  unblockUser: (id: string) => apiClient.delete(`/users/${id}/block`),
  getBlockedUsers: () => apiClient.get('/users/blocked'),
  reportUser: (id: string, reason: string) => apiClient.post(`/users/${id}/report`, { reason }),
  updateSocialLinks: (links: any[]) => apiClient.put('/users/social-links', { links }),
  updateFcmToken: (token: string) => apiClient.put('/users/fcm-token', { fcmToken: token }),
};

// ─── Conversations ──────────────────────────────────────────
export const conversationService = {
  listConversations: () => apiClient.get('/conversations'),
  create: (data: any) => apiClient.post('/conversations', data),
  createConversation: (data: any) => apiClient.post('/conversations', data),
  getConversation: (id: string) => apiClient.get(`/conversations/${id}`),
  deleteConversation: (id: string) => apiClient.delete(`/conversations/${id}`),
  updateConversation: (id: string, data: any) => apiClient.put(`/conversations/${id}`, data),
  addParticipants: (id: string, userIds: string[]) => apiClient.post(`/conversations/${id}/participants`, { userIds }),
  removeParticipant: (id: string, userId: string) => apiClient.delete(`/conversations/${id}/participants/${userId}`),
  muteConversation: (id: string, mutedUntil?: string) => apiClient.put(`/conversations/${id}/mute`, { mutedUntil }),
};

// ─── Messages ───────────────────────────────────────────────
export const messageService = {
  getMessages: (conversationId: string, cursor?: string) =>
    apiClient.get(`/messages/${conversationId}`, { params: { cursor } }),
  sendMessage: (data: any) => apiClient.post('/messages', data),
  sendMessageWithMedia: (data: FormData) =>
    apiClient.post('/messages', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  editMessage: (id: string, content: string) => apiClient.put(`/messages/${id}`, { content }),
  deleteMessage: (id: string) => apiClient.delete(`/messages/${id}`),
  reactToMessage: (id: string, emoji: string) => apiClient.post(`/messages/${id}/react`, { emoji }),
  removeReaction: (id: string) => apiClient.delete(`/messages/${id}/react`),
  markAsRead: (conversationId: string) => apiClient.put(`/messages/${conversationId}/read`),
};

// ─── Groups ─────────────────────────────────────────────────
export const groupService = {
  getPublicGroups: (params?: any) => apiClient.get('/groups', { params }),
  getGroupById: (id: string) => apiClient.get(`/groups/${id}`),
  createGroup: (data: any) => apiClient.post('/groups', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateGroup: (id: string, data: any) => apiClient.put(`/groups/${id}`, data),
  deleteGroup: (id: string) => apiClient.delete(`/groups/${id}`),
  joinGroup: (id: string) => apiClient.post(`/groups/${id}/join`),
  leaveGroup: (id: string) => apiClient.delete(`/groups/${id}/leave`),
  getGroupMembers: (id: string) => apiClient.get(`/groups/${id}/members`),
  updateMemberRole: (id: string, userId: string, role: string) => apiClient.put(`/groups/${id}/members/${userId}/role`, { role }),
  removeMember: (id: string, userId: string) => apiClient.delete(`/groups/${id}/members/${userId}`),
};

// ─── Discovery ──────────────────────────────────────────────
export const discoveryService = {
  getNearbyUsers: (lat: number, lng: number, radius?: number) =>
    apiClient.get('/discovery/nearby', { params: { lat, lng, radius } }),
  getWifiUsers: () => apiClient.get('/discovery/wifi'),
  joinWifi: (ssid: string, bssid?: string) => apiClient.post('/discovery/wifi/join', { ssid, bssid }),
  leaveWifi: () => apiClient.post('/discovery/wifi/leave'),
  getOnlineUsers: () => apiClient.get('/discovery/online'),
  generateQRToken: () => apiClient.post('/discovery/qr-token'),
  resolveQRToken: (token: string) => apiClient.get(`/discovery/qr-token/${token}`),
};

// ─── Calls ──────────────────────────────────────────────────
export const callService = {
  initiateCall: (data: { participantId: string; conversationId?: string; type: 'AUDIO' | 'VIDEO' }) =>
    apiClient.post('/calls/initiate', data),
  acceptCall: (id: string) => apiClient.put(`/calls/${id}/accept`),
  rejectCall: (id: string) => apiClient.put(`/calls/${id}/reject`),
  endCall: (id: string) => apiClient.put(`/calls/${id}/end`),
  getCallHistory: () => apiClient.get('/calls/history'),
};

// ─── Notifications ──────────────────────────────────────────
export const notificationService = {
  getNotifications: (cursor?: string) => apiClient.get('/notifications', { params: { cursor } }),
  markRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
  markAllRead: () => apiClient.put('/notifications/read-all'),
  deleteNotification: (id: string) => apiClient.delete(`/notifications/${id}`),
};

// ─── Media ──────────────────────────────────────────────────
export const mediaService = {
  uploadFile: (data: FormData) => apiClient.post('/media/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteFile: (key: string) => apiClient.delete(`/media/${key}`),
};
