import { useCallback, useEffect, useState } from 'react';
import { supabase, DEMO_MODE } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { conversationFromRow, type ConversationRow } from '@/lib/mappers';
import { apiSendMessage, type ApiError } from '@/lib/api';
import { mockConversations, type Conversation } from '@/data/inbox';

export function useConversations() {
  const { business } = useBusiness();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !business) return;
    const { data, error: err } = await supabase
      .from('conversations')
      .select('*, customers(name, phone, email, city, orders(display_id)), messages(direction, content, created_at)')
      .eq('business_id', business.id)
      .order('last_message_at', { ascending: false });
    if (err) {
      setError(err.message);
      return;
    }
    setConversations((data ?? []).map((row) => conversationFromRow(row as ConversationRow)));
    setError(null);
  }, [business]);

  useEffect(() => {
    if (DEMO_MODE) {
      setConversations(mockConversations);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh]);

  const sendMessage = useCallback(async (conversationId: string, content: string): Promise<{ error?: ApiError }> => {
    if (DEMO_MODE) {
      const now = new Date();
      const time = now.toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' });
      setConversations((prev) => prev.map((c) =>
        c.id === conversationId
          ? { ...c, lastTime: time, messages: [...c.messages, { id: `m${Date.now()}`, from: 'me', text: content, time }] }
          : c,
      ));
      return {};
    }
    const result = await apiSendMessage(conversationId, content);
    if (!result.error) await refresh();
    return result;
  }, [refresh]);

  return { conversations, loading, error, refresh, sendMessage };
}
