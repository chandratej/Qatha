import { Outlet } from 'react-router-dom';
import { BackendStatusBanner } from './BackendStatusBanner';
import { DeviceConflictNotice } from './DeviceConflictNotice';
import { AppTopNav } from './AppTopNav';
import { AppMobileTabBar } from './AppMobileTabBar';
import { CommandPaletteProvider } from './dashboard/CommandPalette';

export function Layout() {
  return (
    <CommandPaletteProvider>
      <div className="app-shell app-shell--nav-v2" data-katha-mode="management">
        <AppTopNav />
        <main className="premium-main premium-main--rhythm overlay-scroll">
          <DeviceConflictNotice />
          <BackendStatusBanner />
          <Outlet />
        </main>
        <AppMobileTabBar />
      </div>
    </CommandPaletteProvider>
  );
}