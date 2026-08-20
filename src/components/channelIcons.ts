import { Store, Instagram, Facebook, Globe, type LucideIcon } from 'lucide-react';
import type { SalesChannel } from '@/types';

export const channelIcons: Record<SalesChannel, LucideIcon> = {
  olx: Store,
  instagram: Instagram,
  facebook: Facebook,
  webshop: Globe,
};
