const DEVICE_ID_KEY = 'katha_device_id';

/** Stable per-browser device id for register-device (2-device limit). */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}