# 🚀 Feature Suggestions — Ticket Management System

## 🔴 High Impact — Core Lifecycle

These features directly improve how tickets are created, tracked, and resolved.

---

### 5. 🔍 Backend Search
**What:** Full-text search across ticket title and description from the backend.

**Why:** Current search is client-side and limited to loaded tickets. Backend search covers all tickets.

**Implementation:**
- Add `search` query param to `GET /tickets`
- Use PostgreSQL `ILIKE` or `tsvector` full-text search
- Debounced search input in dashboard filters
- Replace client-side filter with API call

---

### 6. ⏰ Priority Auto-Escalation
**What:** Automatically escalate ticket priority if it remains unresolved past its due date.

**Why:** Ensures overdue tickets get attention without manual intervention.

**Implementation:**
- Backend cron job (e.g. every hour) checks tickets where `dueDate < now` and `status IN (OPEN, IN_PROGRESS)`
- Escalate: LOW → MEDIUM → HIGH → URGENT
- Log `PRIORITY_CHANGED` activity with reason `"Auto-escalated: overdue"`
- Send notification to assigned employee and admin

---

### 7. 📎 File Attachments
**What:** Allow users to attach files (screenshots, logs, documents) to tickets or comments.

**Why:** Context is critical for technical support — attachments reduce back-and-forth.

**Implementation:**
- Add file upload to ticket creation and comment forms
- Store files in S3 / local storage
- Show attachment thumbnails/links in ticket detail view
- Backend: `POST /tickets/:id/attachments` endpoint

---

### 8. 🏷️ Ticket Templates
**What:** Pre-defined ticket templates for common issue types (e.g. "Bug Report", "Feature Request", "Access Issue").

**Why:** Speeds up ticket creation and ensures consistent information is captured.

**Implementation:**
- Admin creates templates with pre-filled title, description, priority, labels
- "Use Template" button in ticket creation dialog
- Store templates in DB: `ticketTemplates` table
- Frontend: template selector dropdown in create dialog

---

### 9. 👥 Ticket Watchers
**What:** Allow users to "watch" a ticket and receive notifications on updates without being the assignee.

**Why:** Managers, QA, or stakeholders may need visibility without owning the ticket.

**Implementation:**
- Add `ticketWatchers` join table (`ticketId`, `userId`)
- "Watch / Unwatch" button in ticket detail
- Include watchers in notification dispatch on ticket updates
- Show watcher count/avatars in ticket card

---

### 10. 💬 Comment Mentions
**What:** `@mention` users in comments to notify them directly.

**Why:** Speeds up collaboration and ensures the right person sees a comment.

**Implementation:**
- Parse `@username` in comment content on submit
- Highlight mentions in rendered comment text
- Send targeted notification to mentioned users
- Backend: extract mentions before saving comment

---

### 11. 📊 Resolution Time KPI
**What:** Track and display average time from ticket creation to resolution.

**Why:** Key metric for support team performance and SLA compliance.

**Implementation:**
- Compute `resolvedAt - createdAt` when status changes to `RESOLVED`
- Store `resolvedAt` timestamp on ticket
- Dashboard KPI card: "Avg Resolution Time"
- Breakdown by priority, employee, or customer in reports

---

### 12. 📤 Export Tickets
**What:** Export filtered ticket list to CSV or PDF.

**Why:** Reporting, auditing, and sharing with stakeholders outside the system.

**Implementation:**
- "Export" button in dashboard filters bar
- Exports currently filtered/visible tickets
- CSV: raw data for spreadsheets
- PDF: formatted report with logo, date range, summary stats
- Backend: `GET /tickets/export?format=csv|pdf`

---

## 📋 Summary Table

| # | Feature | Impact | Effort | Priority |
|---|---------|--------|--------|----------|
| 5 | Backend Search | 🔴 High | 🟡 Medium | ⭐⭐⭐⭐ |
| 6 | Priority Auto-Escalation | 🔴 High | 🟡 Medium | ⭐⭐⭐⭐ |
| 7 | File Attachments | 🟡 Medium | 🔴 High | ⭐⭐⭐ |
| 8 | Ticket Templates | 🟡 Medium | 🟡 Medium | ⭐⭐⭐ |
| 9 | Ticket Watchers | 🟡 Medium | 🟡 Medium | ⭐⭐⭐ |
| 10 | Comment Mentions | 🟡 Medium | 🟡 Medium | ⭐⭐⭐ |
| 11 | Resolution Time KPI | 🟡 Medium | 🟢 Low | ⭐⭐⭐⭐ |
| 12 | Export Tickets | 🟡 Medium | 🟡 Medium | ⭐⭐⭐ |
