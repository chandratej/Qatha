import { Outlet } from 'react-router-dom';
import { BackendStatusBanner } from './BackendStatusBanner';
import { DeviceConflictNotice } from './DeviceConflictNotice';
import { AppTopNav } from './AppTopNav';
import { CommandPaletteProvider } from './dashboard/CommandPalette';
export function Layout() {
  return (
    <CommandPaletteProvider>
      <div className="app-shell" data-katha-mode="management">
        <AppTopNav />
        <main className="premium-main overlay-scroll">
          <DeviceConflictNotice />
          <BackendStatusBanner />
          <Outlet />
        </main>
      </div>
    </CommandPaletteProvider>
  );
}