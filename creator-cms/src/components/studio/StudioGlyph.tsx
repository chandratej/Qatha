import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  Clock,
  Heart,
  Map,
  MessageCircle,
  PenLine,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';

export type StudioGlyphId =
  | 'book'
  | 'pen'
  | 'trophy'
  | 'users'
  | 'map'
  | 'chart'
  | 'bell'
  | 'shield'
  | 'calendar'
  | 'heart'
  | 'sparkles'
  | 'award'
  | 'message'
  | 'trending'
  | 'clock';

const GLYPH_ICONS: Record<StudioGlyphId, LucideIcon> = {
  book: BookOpen,
  pen: PenLine,
  trophy: Trophy,
  users: Users,
  map: Map,
  chart: BarChart3,
  bell: Bell,
  shield: Shield,
  calendar: Calendar,
  heart: Heart,
  sparkles: Sparkles,
  award: Award,
  message: MessageCircle,
  trending: TrendingUp,
  clock: Clock,
};

export type StudioGlyphVariant = 'ring' | 'tile' | 'soft';

export interface StudioGlyphProps {
  id: StudioGlyphId;
  size?: number;
  variant?: StudioGlyphVariant;
  className?: string;
}

export function StudioGlyph({
  id,
  size = 24,
  variant = 'ring',
  className,
}: StudioGlyphProps) {
  const Icon = GLYPH_ICONS[id];
  const variantClass =
    variant === 'tile' ? ' studio-glyph--tile'
    : variant === 'soft' ? ' studio-glyph--soft'
    : ' studio-glyph--ring';

  return (
    <span
      className={`studio-glyph${variantClass}${className ? ` ${className}` : ''}`}
      aria-hidden
    >
      <Icon size={size} />
    </span>
  );
}