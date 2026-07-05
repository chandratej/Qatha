export function isMockMode() {
  return (
    process.env.MOCK_MODE === 'true' ||
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL === 'http://placeholder' ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}