/**
 * Single source of truth for Creator Studio navigation.
 * Desktop primary/more menus and mobile tab bar/sheet all render from this config.
 */
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  IndianRupee,
  LayoutDashboard,
  Send,
  Settings,
  Trophy,
  Users,
} from 'lucide-react';
import type { StudioStringKey } from '../lib/studioLocale';
import { isFeatureEnabled } from './feature_flags';

export interface NavItemConfig {
  key: string;
  labelKey: StudioStringKey;
  icon: LucideIcon;
  route: string;
  /** Optional status chip (e.g. early-stage features) */
  statusKey?: StudioStringKey;
  end?: boolean;
  /** When set, item is omitted from nav unless the feature flag is on */
  featureFlag?: 'events' | 'marketplace' | 'magazine' | 'community';
}

/** Primary destinations — always visible on desktop and mobile tab bar */
export const NAV_PRIMARY: NavItemConfig[] = [
  {
    key: 'dashboard',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    route: '/',
    end: true,
  },
  {
    key: 'stories',
    labelKey: 'nav.stories',
    icon: BookOpen,
    route: '/stories',
  },
  {
    key: 'earn',
    labelKey: 'nav.earn',
    icon: IndianRupee,
    route: '/earn',
  },
];

/** Secondary destinations — More dropdown (desktop) / bottom sheet (mobile) */
const NAV_MORE_ALL: NavItemConfig[] = [
  {
    key: 'publishing',
    labelKey: 'nav.publishing',
    icon: Send,
    route: '/publishing',
  },
  {
    key: 'events',
    labelKey: 'nav.events',
    icon: Trophy,
    route: '/events',
    featureFlag: 'events',
  },
  {
    key: 'community',
    labelKey: 'nav.community',
    icon: Users,
    route: '/community',
    statusKey: 'nav.communityStatus',
  },
];

/** Visible secondary nav (feature flags applied — P1-21 / P1-25). */
export const NAV_MORE: NavItemConfig[] = NAV_MORE_ALL.filter(
  (item) => !item.featureFlag || isFeatureEnabled(item.featureFlag),
);

/** Mobile-only extras inside the More sheet (no room in the tab bar) */
export const NAV_MORE_MOBILE_EXTRAS: NavItemConfig[] = [
  {
    key: 'settings',
    labelKey: 'nav.settings',
    icon: Settings,
    route: '/settings',
  },
];

/** True when current path belongs to the Earn hub (reviews or payouts). */
export function isEarnPath(pathname: string): boolean {
  return (
    pathname === '/earn'
    || pathname.startsWith('/earn/')
    || pathname === '/reviewers'
    || pathname.startsWith('/reviewers/')
    || pathname === '/monetization'
    || pathname.startsWith('/monetization/')
  );
}

export function isNavItemActive(pathname: string, item: NavItemConfig): boolean {
  if (item.key === 'earn') return isEarnPath(pathname);
  if (item.end) return pathname === item.route;
  return pathname === item.route || pathname.startsWith(`${item.route}/`);
}
