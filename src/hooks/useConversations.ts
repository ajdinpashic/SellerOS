import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { conversationFromRow, type ConversationRow, type Conversation } from '@/lib/mappers';
import { apiSendMessage, type ApiError } from '@/lib/api';

export type { Conversation };

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
    if (!business) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh, business]);

  const sendMessage = useCallback(async (conversationId: string, content: string): Promise<{ error?: ApiError }> => {
    const result = await apiSendMessage(conversationId, content);
    if (!result.error) await refresh();
    return result;
  }, [refresh]);

  return { conversations, loading, error, refresh, sendMessage };
}
