const DEVICE_ID_KEY = 'katha_device_id';

/** macOS / iOS — for keyboard shortcut labels (⌘ vs Ctrl). */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const platform = navigator.platform ?? '';
  const ua = navigator.userAgent ?? '';
  return /Mac|iPhone|iPad|iPod/.test(platform) || (/Mac/.test(ua) && 'ontouchend' in document);
}

export function modKeyLabel(): string {
  return isApplePlatform() ? '⌘' : 'Ctrl';
}

/** Stable per-browser device id for register-device (2-device limit). */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}