/** Detect Supabase Edge Function invoke failures (undeployed, CORS, network). */
export function isEdgeFunctionUnavailable(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes('failed to send a request to the edge function')
    || msg.includes('failed to fetch')
    || msg.includes('functionsfetcherror')
    || msg.includes('functionsrelayerror')
    || msg.includes('cors')
    || msg.includes('network')
    || msg.includes('404')
    || msg.includes('not found')
  );
}