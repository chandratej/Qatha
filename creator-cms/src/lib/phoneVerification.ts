/**
 * JIT phone verification via WhatsApp OTP (OTP_Decisions_Features.md Module 3).
 * Triggered only at publish-to-monetize or paywall — never at initial registration.
 * Email OTP fallback is allowed only after a prior successful WhatsApp verification.
 */
import { supabase } from './supabase';
import { requireSessionUser } from './authSession';
import {
  getPhoneConfig,
  isValidMobile,
  normalizePhone,
  phoneValidationMessage,
} from './phoneConfig';

/** @deprecated Use normalizePhone — kept for tests */
export const normalizeIndianPhone = normalizePhone;

/** @deprecated Use isValidMobile — kept for tests */
export const isValidIndianMobile = isValidMobile;

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

async function resolveAccountEmail(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  if (session.user.email) return session.user.email;

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', session.user.id)
    .maybeSingle();

  return profile?.email ?? null;
}

/** True when user verified WhatsApp before and can re-confirm via email OTP instead. */
export async function canUseEmailVerificationFallback(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified_at')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!profile?.phone_verified_at) return false;

  const email = await resolveAccountEmail();
  return Boolean(email?.includes('@'));
}

/** Send WhatsApp OTP to link/verify phone on the logged-in creator account. */
export async function triggerPhoneVerification(phoneNumber: string): Promise<void> {
  const cfg = getPhoneConfig();
  const phone = normalizePhone(phoneNumber, cfg);
  if (!isValidMobile(phone, cfg)) {
    throw new Error(phoneValidationMessage(cfg));
  }

  await requireSessionUser();

  const { error } = await supabase.auth.updateUser({ phone });
  if (error) throw new Error(error.message);
}

/** Verify the 6-digit WhatsApp OTP and mark profile as payout-ready. */
export async function verifyPhoneVerification(phoneNumber: string, otp: string): Promise<void> {
  const phone = normalizePhone(phoneNumber);
  const token = (otp || '').replace(/\D/g, '').slice(0, 6);
  if (token.length !== 6) throw new Error('Enter the 6-digit code from WhatsApp.');

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'phone_change',
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Invalid or expired code. Request a new one.');
  }

  const verifiedAt = new Date().toISOString();
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ phone, phone_verified_at: verifiedAt })
    .eq('id', data.user.id);

  if (profileError) throw new Error(profileError.message);
}

/** Send email OTP to the account email when WhatsApp delivery fails. */
export async function sendEmailVerificationFallback(): Promise<string> {
  if (!(await canUseEmailVerificationFallback())) {
    throw new Error(
      'Email verification is only available after you have verified WhatsApp at least once.',
    );
  }

  const email = (await resolveAccountEmail())!.trim().toLowerCase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw new Error(error.message);
  return email;
}

/**
 * Verify email OTP and refresh payout verification.
 * Only available after at least one prior successful WhatsApp verification.
 */
export async function verifyEmailVerificationFallback(otp: string): Promise<void> {
  const { data: { session: priorSession } } = await supabase.auth.getSession();
  if (!priorSession) throw new Error('Sign in required.');

  const priorUserId = priorSession.user.id;

  if (!(await canUseEmailVerificationFallback())) {
    throw new Error(
      'Email verification is only available after you have verified WhatsApp at least once.',
    );
  }

  const email = (await resolveAccountEmail())!.trim().toLowerCase();
  const token = (otp || '').replace(/\D/g, '').slice(0, 6);
  if (token.length !== 6) throw new Error('Enter the 6-digit code from your email.');

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Invalid or expired code. Request a new one.');
  }

  if (data.user.id !== priorUserId) {
    throw new Error('This code does not match your account.');
  }

  const verifiedAt = new Date().toISOString();
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ phone_verified_at: verifiedAt })
    .eq('id', data.user.id);

  if (profileError) throw new Error(profileError.message);
}

export async function fetchPhoneVerificationStatus(userId: string): Promise<{
  phone: string | null;
  phoneVerified: boolean;
  priorWhatsAppSuccess: boolean;
}> {
  const { data, error } = await supabase
    .from('profiles')
    .select('phone, phone_verified_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    phone: data?.phone ?? null,
    phoneVerified: Boolean(data?.phone_verified_at && data?.phone),
    priorWhatsAppSuccess: Boolean(data?.phone_verified_at),
  };
}