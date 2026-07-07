import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initOverlayScrollRegions } from '../lib/overlayScroll';

/** Binds macOS-style overlay scrollbars whenever the route or DOM updates. */
export function OverlayScrollManager() {
  const { pathname } = useLocation();

  useEffect(() => initOverlayScrollRegions(), [pathname]);

  return null;
}