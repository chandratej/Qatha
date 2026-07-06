/**
 * JIT phone verification via WhatsApp OTP (OTP_Decisions_Features.md Module 3).
 * Triggered only at publish-to-monetize or paywall — never at initial registration.
 */
import { supabase } from './supabase';

export function normalizeIndianPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (input.startsWith('+')) return input;
  return `+${digits}`;
}

export function isValidIndianMobile(phone: string): boolean {
  const normalized = normalizeIndianPhone(phone);
  return /^\+91[6-9]\d{9}$/.test(normalized);
}

/** Send WhatsApp OTP to link/verify phone on the logged-in creator account. */
export async function triggerPhoneVerification(phoneNumber: string): Promise<void> {
  const phone = normalizeIndianPhone(phoneNumber);
  if (!isValidIndianMobile(phone)) {
    throw new Error('Enter a valid Indian mobile number (+91XXXXXXXXXX).');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in before verifying your number.');

  const { error } = await supabase.auth.updateUser({ phone });
  if (error) throw new Error(error.message);
}

/** Verify the 6-digit WhatsApp OTP and mark profile as payout-ready. */
export async function verifyPhoneVerification(phoneNumber: string, otp: string): Promise<void> {
  const phone = normalizeIndianPhone(phoneNumber);
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

export async function fetchPhoneVerificationStatus(userId: string): Promise<{
  phone: string | null;
  phoneVerified: boolean;
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
  };
}