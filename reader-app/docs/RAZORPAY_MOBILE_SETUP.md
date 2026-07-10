# Razorpay mobile setup — Katha Reader

**Package:** `razorpay_flutter`  
**Checkout entry:** `lib/core/services/razorpay_checkout_io.dart`  
**API:** `POST /api/subscriptions/create` → `order_id` + `razorpay_key`

## Android

Already configured in this repo:

| Item | Location |
|------|----------|
| `INTERNET` + `ACCESS_NETWORK_STATE` | `android/app/src/main/AndroidManifest.xml` |
| UPI package visibility queries | same manifest `<queries>` |
| `minSdk ≥ 23` | `android/app/build.gradle.kts` |
| Multidex | `multiDexEnabled = true` |

### Release signing (you must do)

1. Create a keystore and set `android/key.properties` (do not commit secrets).
2. Wire `signingConfigs.release` in `build.gradle.kts` (currently debug for local release runs).
3. Register the **release SHA** in Razorpay Dashboard if using certain Android features.

### Build

```bash
cd reader-app
flutter pub get
flutter build apk --release \
  --dart-define=API_BASE=https://api.yourdomain.com/api \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## iOS

Already configured:

| Item | Location |
|------|----------|
| `LSApplicationQueriesSchemes` (UPI apps) | `ios/Runner/Info.plist` |
| ATS HTTPS-only | `NSAppTransportSecurity` |

### Xcode checklist

1. Open `ios/Runner.xcworkspace` in Xcode.
2. Set **Team** + unique **Bundle Identifier**.
3. Enable **Push Notifications** only when FCM/CPaaS is ready (optional).
4. Minimum iOS: Flutter default (usually 12+); Razorpay supports modern iOS.

### Build

```bash
cd reader-app
flutter build ios --release \
  --dart-define=API_BASE=https://api.yourdomain.com/api \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## Test cards / UPI (Razorpay test mode)

1. API must use `rzp_test_…` keys.
2. `POST /subscriptions/create` returns `payments_ready: true` and `order_id`.
3. Open a locked chapter → Subscribe → complete Razorpay sheet.
4. Confirm webhook **or** signature path activates `subscription_status=active`.

## Web

`razorpay_checkout_stub.dart` is used — no native checkout. Point readers to Android/iOS builds.

## Related

- Deploy dry-run: `MVP/scripts/production-dry-run.ps1`
- ADR-005: `docs/adr/ADR-005-razorpay-flutter-and-edge-spi.md`
