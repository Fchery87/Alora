# Alora — Privacy Policy (draft v1)

**Status: DRAFT — agent-prepared, founder-review pending, legal sign-off gates submission (Launch checklist §3, ties to MVP issue 14 COPPA posture).** Not yet published. To publish: fill in the company/contact fields below, host at a public URL, and set `EXPO_PUBLIC_PRIVACY_POLICY_URL` in `mobile/.env`.

*Effective date: [date]* · *Contact: [founder name/email]* · *Operated by: [legal name, address if any]*

## 1. What Alora is

Alora is a baby-care logging app for parents and trusted caregivers. It stores information you enter about your baby's daily care (feeds, diapers, sleep, growth measurements), coordinates that information between caregivers you invite, and offers a private, optional, non-clinical daily check-in about your own wellbeing.

Alora is built **for caregivers, not children**. We do not collect information directly from children, and the app is not directed to children under 13.

## 2. Information we collect

| Data | Where it lives | Purpose |
|---|---|---|
| **Account** (email address, display name) | Supabase (US region) | Sign-in and caregiver identity |
| **Baby-care records** you enter (feed, diaper, sleep, growth events; baby name, birth date, sex) | Your devices + synced between your invited caregivers via PowerSync/Supabase (US region) | Core app function; two-caregiver coordination |
| **Private daily check-ins** (mood + optional private reflection) | Your devices; synced **only to your own devices** | Your private wellbeing record — **never visible to your co-caregiver or any other user** |
| **Trust events** (invites, role changes, seat-limit changes, exports, deletion) | Supabase (US region) | Audit log of trust-sensitive actions |
| **Crash reports** | Sentry (error-reporting service) | Fixing bugs. No names, emails, or user identifiers are attached to crash events |

## 3. What we do NOT do

- **No ads.**
- **No selling of data** — ever. We do not sell, rent, or trade personal information to third parties.
- **No product analytics**: we do not track how you use the app for marketing purposes.
- We do **not** read or use your baby-care data or check-ins for any purpose beyond operating the app for you.
- The app is **non-clinical**: it does not provide medical advice, diagnosis, or treatment.

## 4. Who can see your data

- Your baby-care records are shared **only with caregivers you explicitly invite** (each invite is single-use and revocable, and you can limit how many seats your family has).
- Your private daily check-ins are **never shared with anyone** — not even the other caregiver in your family.
- Alora's operators access data only to maintain and secure the service.

## 5. Where data is stored

- Your data is stored locally on your devices (local-first) and synced through US-region infrastructure (Supabase + PowerSync) between your own devices and your invited caregivers.
- Crash reports go to Sentry (their processing terms apply).

## 6. Your choices

- **Export**: you can export your data from the app at any time ("Export my data"). Private check-ins appear only in the author's own export.
- **Revoke**: you can remove a caregiver from your family at any time.
- **Seat limits**: your family can cap how many caregivers can join.
- **Delete your account**: in-app account deletion removes your account, transfers family ownership when possible, and **permanently deletes your private check-ins and reflections** (scrubbed per our deletion rules).
- **Contact us**: to exercise any privacy right, email [contact email].

## 7. Children's privacy (COPPA posture)

Alora is intended for use by caregivers 18 and over. It does not knowingly collect personal information from children under 13. Baby information you enter belongs to you, not to a child account. If you believe a child has provided us personal information, contact us and we will delete it.

## 8. Data retention

Account and family data are retained while your account exists. Deleting your account removes your private data and personal identifiers per our deletion flow. Crash reports are retained per Sentry's retention policy and are not tied to your identity.

## 9. Security

We use industry-standard protections: encrypted connections (TLS), database row-level security so each caregiver can only see what your family's rules allow, single-use invite codes, and least-privilege service accounts. No system is perfectly secure; you use Alora at your own risk within reason.

## 10. Changes to this policy

If we change this policy, we will update the effective date and notify you in-app before the change takes effect. Material changes will require your acknowledgment before continued use.

## 11. Contact

Questions or requests: **[contact email]**. We respond to privacy requests within a reasonable time and in any case as required by law.
