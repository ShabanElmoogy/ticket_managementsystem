# Tenant Admin — Feature Suggestions

This document collects suggested features specifically valuable for the **Tenant Admin** role in this Ticket Management System.

## 1) Seat / Subscription UX (already started)

### 1.1 Show seat usage in relevant places
- Users page header: show `Seats: used/total`.
- When full: show `Seats full: used/total`.
- Optional: show the same badge in the main dashboard header/top bar.

### 1.2 Disable/Block actions when seats are full
- Disable **Add User** when `used >= total` (and `total > 0`).
- If user clicks Add User anyway (or button remains enabled), show a dialog explaining seats are full.

### 1.3 “Seats full” dialog
- Title: **Seats limit reached**
- Body: explain current usage and that the plan limit is reached.
- Actions:
  - **Request more users** (WhatsApp / support link)
  - **Email support** (mailto)
  - **OK**

### 1.4 Backend enforcement (must-have)
- Enforce seat limit on the backend when creating tenant users.
- Return a clear error message and status code (e.g., `403`).

### 1.5 “Request more seats” action
- Provide a one-click action to contact support:
  - WhatsApp deep link with prefilled message
  - Email deep link with prefilled subject/body
- Include tenant slug/name (if available) and current usage in the message.

### 1.6 Subscription status UX
- If subscription is `PAST_DUE` / `EXPIRED`: show read-only banner and disable create/edit/delete.
- If subscription is `SUSPENDED`: block admin actions entirely.

---

## 2) Role-based user management improvements

### 2.1 Invite users instead of setting passwords
- Tenant admin enters email + role.
- System sends invite link (email/WhatsApp) to set password.

### 2.2 Tenant admin password reset
- Allow tenant admin to reset passwords for tenant-scoped users.
- Add audit log entry for password reset.

### 2.3 Bulk user actions
- Bulk activate/deactivate.
- Bulk role change (Employee ↔ Programmer).

### 2.4 Audit log for user management
- Track: who created/edited/deactivated users.
- Show in a simple audit table.

---

## 3) Approval / workflow controls

### 3.1 Ticket workflow rules per tenant
- Required fields per status.
- Prevent moving to Done without resolution.

### 3.2 Escalation flow
- Escalate ticket with reason.
- Notify tenant admin and optionally assign to programmer.

---

## 4) Assignment & capacity

### 4.1 Auto-assign rules
- Round-robin among employees.
- Assign by label/category/application.

### 4.2 Workload view
- Tickets per assignee.
- Aging buckets (0–2 days, 3–7, 7+).

---

## 5) Customer / requester portal

### 5.1 External portal
- Create ticket
- Track status
- Add comments/attachments

### 5.2 Portal settings
- Branding
- Allowed domains

---

## 6) Notifications & templates

### 6.1 Tenant-configurable templates
- Ticket created/assigned/status changed.

### 6.2 Quiet hours + per-user preferences
- Reduce noise.

### 6.3 WhatsApp templates
- If WhatsApp notifications are enabled.

---

## 7) Reporting

### 7.1 KPI dashboard
- Open tickets by status/priority
- Avg first response time
- Avg resolution time
- SLA breaches

### 7.2 Export
- CSV/Excel exports for tickets/users/activity.

---

## 8) Data governance / safety

### 8.1 Soft-delete + restore users

### 8.2 Transfer ownership on delete
- Reassign tickets/comments.

### 8.3 2FA for tenant admin

---

## 9) Tenant customization

### 9.1 Custom fields on tickets
- Text, dropdown, date.

### 9.2 Custom statuses

### 9.3 Branding
- Logo/colors
- PDF exports

---

## 10) Integrations

### 10.1 Webhooks
- Ticket created/updated.

### 10.2 Automation endpoints
- Zapier-like integration.

### 10.3 Email-to-ticket
- Inbound email creates ticket.
