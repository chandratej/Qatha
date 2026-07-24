import { redirect } from 'next/navigation';

/**
 * Gateway root — marketing lives on the main landing host.
 * Deep links are /read/[slug]/[chapter]. Avoid a bare 404 for curiosity traffic.
 */
export default function GatewayHome() {
  const landing = process.env.NEXT_PUBLIC_LANDING_URL || process.env.NEXT_PUBLIC_WEB_BASE || 'https://katha.app';
  redirect(landing);
}
