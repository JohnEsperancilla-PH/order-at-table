# PayMongo integration (multi-tenant / BYO PSP)

This document describes how to integrate **PayMongo** when **each restaurant** operates its own PayMongo merchant account (“bring your own PSP”). Your SaaS stores per-restaurant credentials securely and creates payments using **that tenant’s** secret keys.

> **Disclaimer:** Payment APIs and dashboard flows change. Always confirm amounts (centavos vs pesos), event names, and URL paths against the official PayMongo developer documentation at [developers.paymongo.com](https://developers.paymongo.com).

---

## 1. Goals

- Guests pay online (e.g. GCash, cards, other channels PayMongo exposes for that merchant).
- Payment authorization settles against **the restaurant’s** PayMongo account—not a global platform wallet.
- Your backend reliably marks orders **paid** using **webhooks** (redirect URLs alone are not sufficient proof).

---

## 2. Prerequisites (per restaurant)

1. Restaurant completes **PayMongo onboarding** (KYC, settlement bank, channels enabled).
2. In the PayMongo Dashboard, create **API keys**:
   - **Publishable key** (`pk_…`) — safe for client-side collect flows if your integration uses them.
   - **Secret key** (`sk_…`) — **server-only**; never expose to the browser or mobile client bundles.
3. Configure **webhooks** (see §6):
   - HTTPS endpoint on **your** domain (can be shared across all tenants).
   - Copy the **webhook signing secret** PayMongo provides for verifying payloads.

---

## 3. Data you should persist (suggested)

Store **per `restaurant_id`** (encrypt at rest):

| Field | Purpose |
|--------|--------|
| `paymongo_secret_key` | Authenticate API calls for this tenant |
| `paymongo_publishable_key` | Optional; client-side flows only |
| `paymongo_webhook_secret` | Verify webhook signatures for this tenant |
| `paymongo_environment` | `test` vs `live` |

Store **per payment attempt / order**:

| Field | Purpose |
|--------|--------|
| `order_id`, `restaurant_id` | Internal correlation |
| `paymongo_payment_intent_id` and/or `paymongo_link_id` | PayMongo references |
| `amount_minor` | Integer minor units if required by API |
| `currency` | `PHP` |
| `status` | `pending`, `processing`, `paid`, `failed`, `cancelled` |
| `idempotency_key` | Prevent duplicate charges on retries |

Always attach **metadata** on PayMongo resources (`order_id`, `restaurant_id`, optional `table_number`) so support and webhooks stay traceable.

---

## 4. Integration approaches

PayMongo’s programmable checkout generally centers on **Payment Intents**. **Links** are useful when you primarily need a hosted payable URL.

### Option A — Payment Intent workflow (recommended for full control)

High-level sequence (confirm exact endpoints in PayMongo docs):

1. **Backend** (with tenant `sk_live_…` / `sk_test_…`): create a **Payment Intent** with amount, currency, and metadata.
2. Depending on PayMongo’s current guide:
   - expose a **checkout / collect** URL or token for the guest, or
   - create / attach **payment methods** per their client SDK documentation.
3. Guest completes payment on PayMongo-hosted or assisted UI.
4. **Webhook** confirms final status; your system updates `orders` / `payments`.

Avoid legacy **Sources** APIs for new builds unless explicitly required.

### Option B — Payment Links

High-level sequence:

1. **Backend**: create a **Link** via Links API with amount, description, metadata.
2. Return **`checkout_url`** (or equivalent) to the guest device.
3. Guest pays on PayMongo-hosted page; webhook confirms outcome.

Links are simpler operationally but may offer less flexibility than Payment Intents for deep UX customization—compare current docs.

---

## 5. Guest-facing flow (order-at-table)

1. Guest confirms cart; your backend creates an **order** row (e.g. `pending_payment` or your equivalent).
2. Backend calls PayMongo **using that restaurant’s secret key** → obtains Payment Intent / Link.
3. Frontend redirects guest (or opens new tab) to PayMongo checkout / Link URL.
4. Show clear copy: “Complete payment in GCash/your bank app; this page updates when paid.”
5. Optional: success/cancel **return URLs** for UX—still reconcile via webhook/API.

---

## 6. Webhooks (critical)

### Registration

- Each PayMongo account can register webhook URLs in the dashboard **or** via API—follow current docs.
- Production endpoint example: `POST https://yourapp.com/api/webhooks/paymongo`

### Verification

1. Read raw request body.
2. Verify signature using that tenant’s **`paymongo_webhook_secret`** (PayMongo documents the scheme—often HMAC-based).
3. If verification fails → **401** and log; do not update orders.

### Routing multi-tenant events on one URL

PayMongo events reference PayMongo resource IDs. Recommended pattern:

1. On **create payment**, persist `payment_intent_id` / `link_id` ↔ `{ restaurant_id, order_id }`.
2. On webhook, extract resource id from payload → **lookup** your row → load **that restaurant’s** webhook secret → verify → update status **idempotently** (same event may retry).

### Idempotency

- Treat `(event_id)` or `(resource_id + status)` as idempotent keys so duplicate deliveries don’t double-transition state.

### Response

- Return **HTTP 200** quickly after enqueueing work; heavy logic can run async.

---

## 7. Order state machine (conceptual)

Example transitions (adjust to your schema):

```
draft → awaiting_payment → paid → confirmed → …
                      ↘ failed / expired
```

- Move to **`paid`** only after webhook (or verified API poll) confirms success.
- **`awaiting_cashier_confirmation`** may remain if your product still requires staff acknowledgment after payment—product decision.

---

## 8. Testing

1. Use **test keys** per tenant (separate webhook secret for sandbox if applicable).
2. Test paths:
   - Successful payment
   - Failed / declined payment
   - User abandons checkout (no webhook → timeout messaging)
   - **Duplicate webhook** delivery
   - **Out-of-order** events (if possible in sandbox)

---

## 9. Security checklist

- [ ] Secret keys and webhook secrets only on server; encrypted at rest (KMS / vault).
- [ ] HTTPS everywhere for webhooks.
- [ ] Strict webhook signature verification **before** DB writes.
- [ ] Rate-limit webhook endpoint; log failures.
- [ ] Never trust client-side “payment succeeded” alone.

---

## 10. Compliance & commercial notes

- Merchant-of-record and dispute handling follow **each restaurant ↔ PayMongo** agreement; document your SaaS role in Terms.
- Platform subscription billing is separate from PayMongo unless you implement explicit splits/fees supported by PayMongo for your arrangement.

---

## 11. Next steps in this codebase (when implementing)

1. Add migrations: `restaurant_payment_providers`, `payments` (or extend `orders`).
2. Add server-only module `lib/payments/paymongo.ts` wrapping create-intent / create-link + typed errors.
3. Add route `app/api/webhooks/paymongo/route.ts` with verification + idempotent handlers.
4. Gate PayMongo-enabled restaurants in cashier/settings UI for key entry (masked display).
5. Wire guest confirmation UI to start checkout after order creation.

---

## 12. References

- PayMongo Developers: [https://developers.paymongo.com](https://developers.paymongo.com)
- Sections to read first: **Accepting a payment**, **Payment Intents**, **Links**, **Webhooks**
