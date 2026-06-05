import { format, isToday, isYesterday, differenceInMinutes, differenceInHours } from 'date-fns';

export const formatChatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd/MM/yy');
};

export const formatMessageTime = (dateStr: string): string => {
  return format(new Date(dateStr), 'HH:mm');
};

export const formatFullDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const mins = differenceInMinutes(now, date);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}h ago`;
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
};

export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getInitials = (name: string): string => {
  return name.split(' ').map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
};

export const formatLastSeen = (dateStr: string): string => {
  const date = new Date(dateStr);
  const mins = differenceInMinutes(new Date(), date);
  if (mins < 5) return 'Online';
  if (isToday(date)) return `Last seen today at ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `Last seen yesterday at ${format(date, 'HH:mm')}`;
  return `Last seen ${format(date, 'MMM d')}`;
};
