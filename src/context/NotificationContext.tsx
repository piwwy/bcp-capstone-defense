import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

// ---------- Types ----------
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  event_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
}

// ---------- Context ----------
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ---------- Provider ----------
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
    }
  }, [user?.id]);

  const checkSurveyNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Get active surveys
      const { data: surveys, error: surveyError } = await supabase
        .from('alumni_surveys')
        .select('id, title')
        .eq('status', 'active');

      if (surveyError || !surveys || surveys.length === 0) return;

      // Get surveys the user already responded to
      const { data: responses } = await supabase
        .from('alumni_survey_responses')
        .select('survey_id')
        .eq('alumni_id', user.id);

      const respondedIds = new Set((responses || []).map(r => r.survey_id));

      // Get existing survey notifications for this user
      const { data: existingNotifs } = await supabase
        .from('notifications')
        .select('event_id')
        .eq('user_id', user.id)
        .eq('type', 'survey');

      const notifiedIds = new Set((existingNotifs || []).map(n => n.event_id));

      // Create notifications for surveys the user hasn't responded to and hasn't been notified about
      for (const survey of surveys) {
        if (!respondedIds.has(survey.id) && !notifiedIds.has(survey.id)) {
          try {
            await supabase.from('notifications').insert({
              user_id: user.id,
              title: 'New Survey Available',
              message: `Please take a moment to answer: "${survey.title}"`,
              type: 'survey',
              event_id: survey.id,
              is_read: false
            });
          } catch {
            // Ignore duplicate notification errors
          }
        }
      }
    } catch (err) {
      // Silently fail — survey notifications are non-critical
      console.warn('Survey notification check failed:', err);
    }
  }, [user?.id]);

  const triggerAndFetch = useCallback(async () => {
    if (!user?.id) return;
    try { await supabase.rpc('generate_event_reminders'); } catch { /* RPC may not exist */ }
    await checkSurveyNotifications();
    await fetchNotifications();
  }, [user?.id, fetchNotifications, checkSurveyNotifications]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    // 1. Initial trigger + fetch
    triggerAndFetch();

    // 2. Poll every 60 seconds to generate new reminders
    const interval = setInterval(triggerAndFetch, 60_000);

    // 3. Real-time subscription for instant updates
    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === (payload.new as Notification).id ? (payload.new as Notification) : n)
          );
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(subscription);
    };
  }, [user?.id, triggerAndFetch]);

  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  }, [user?.id]);

  const dismissNotification = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

// ---------- Hook ----------
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
