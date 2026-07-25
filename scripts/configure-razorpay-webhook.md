# Razorpay test webhook — Mode B (one-time dashboard)

Edge endpoint (already deployed + secret configured on API health):

```text
https://qviedmvezaehfcbmfmbc.supabase.co/functions/v1/payment-webhook
```

## Steps (≈3 minutes)

1. Open https://dashboard.razorpay.com → toggle **Test Mode**.
2. **Account & Settings** → **Webhooks** → **Add New Webhook**.
3. **URL:**  
   `https://qviedmvezaehfcbmfmbc.supabase.co/functions/v1/payment-webhook`
4. **Secret:** same value as `RAZORPAY_WEBHOOK_SECRET` in Render `katha-api` + Supabase edge secrets.
5. **Events:**
   - `payment.captured` (required)
   - `order.paid` (recommended)
   - `payment.failed` (optional)
6. Save → Active.

## Verify

```powershell
# Expect 401 Invalid signature (proves function is up)
curl -X POST https://qviedmvezaehfcbmfmbc.supabase.co/functions/v1/payment-webhook `
  -H "Content-Type: application/json" `
  -d "{\"event\":\"payment.captured\"}"

# Full Mode B smoke
.\scripts\verify-mode-b-smoke.ps1
```

Then one real **test** UPI payment from reader → user becomes unlimited without relying only on in-app confirm.

**Do not** point the webhook at the Render Node `/api/subscriptions/webhook` for MVP1 — edge is production.
