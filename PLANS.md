# PLANS.md
> Awaiting human approval before any implementation begins.

---

## Plan C — Domain & Email Infrastructure (2026-06-26)

### What changed
- Bought `sendrow.app` on Cloudflare Registrar
- Connected to Vercel via auto-configure DNS
- Set up Zoho Mail (Mail Lite, $1/mo/user)
  - `malachi.nguyen@sendrow.app` + `contact@sendrow.app` alias → Malachi's inbox
  - `masao.honda@sendrow.app` → Masao's inbox
- Added `malachi.nguyen@sendrow.app` to Gmail via SMTP (smtppro.zoho.com)

### Code changes (approved + executed)
| # | File | Change |
|---|------|--------|
| C1 | `lib/email.ts` | `ADMIN_EMAIL` fallback updated from personal Gmail → `malachi.nguyen@sendrow.app` |

### Vercel env vars to set (manual — user action required)
| Var | Value |
|-----|-------|
| `FROM_EMAIL` | `contact@sendrow.app` |
| `ADMIN_EMAIL` | `malachi.nguyen@sendrow.app` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `contact@sendrow.app` |
| `NEXT_PUBLIC_APP_URL` | `https://sendrow.app` |
| `RESEND_API_KEY` | get from resend.com |

### Resend domain setup (manual — user action required)
1. resend.com → Domains → Add `sendrow.app`
2. Paste the 3 DNS records (SPF, DKIM, DMARC) into Cloudflare DNS
3. Hit Verify in Resend
4. Set `FROM_EMAIL=contact@sendrow.app` in Vercel
