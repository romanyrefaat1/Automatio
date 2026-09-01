# Automatio MVP — Feature List

## 1. Authentication & User Accounts

- Sign up / Sign in
- Sign out
- User profile
- Account settings
- Protected application routes

---

## 2. Automation Management

- Create automations
- Edit automation name and description
- Pause / resume automations
- Archive automations
- Delete automations
- Automation list
- Automation status

---

## 3. Automation Builder

- Visual step-based automation builder
- Add steps
- Edit steps
- Delete steps
- Reorder steps
- Step titles
- Step configuration forms
- Action validation

### Supported actions

- Go to URL
- Click
- Fill input
- Select option
- Check checkbox
- Uncheck checkbox
- Press keyboard key
- Wait
- Wait for element
- Screenshot
- Extract text
- Assert text

---

## 4. Browser Automation Engine

- Playwright-based browser worker
- Chromium execution
- Sequential step execution
- Browser/page lifecycle management
- Step-specific execution
- Execution timeouts
- Browser error handling
- Step error handling
- Graceful browser cleanup

---

## 5. Automation Runs

- Manual "Run now"
- Run queue
- Run statuses
  - Queued
  - Running
  - Completed
  - Failed
  - Cancelled
- Run duration
- Run timestamps
- Run errors
- Run history

---

## 6. Step Execution Results

- Individual step execution tracking
- Step statuses
  - Pending
  - Running
  - Completed
  - Failed
  - Skipped
- Step execution duration
- Step errors
- Action-specific results
- Historical step configuration snapshots

---

## 7. Scheduling

- One-time automation schedules
- Repeating interval schedules
- Enable / disable schedules
- Next run tracking
- Scheduled run creation
- Duplicate-run prevention

---

## 8. Scheduler System

- Scheduled automation detection
- Automatic run creation
- Supabase Edge Function scheduler
- Schedule state management
- Scheduler error handling
- Production recurring invocation

---

## 9. Screenshots & Artifacts

- Screenshot action
- Supabase Storage integration
- Artifact metadata
- Screenshot previews
- Artifact access from run details
- Artifact cleanup

---

## 10. Run Details & Debugging

- Run detail page
- Step-by-step execution timeline
- Current step status
- Failed step information
- Error messages
- Extracted values
- Screenshots
- Run metadata
- Execution duration

---

## 11. Realtime Execution Updates

- Live run status
- Live step status
- Live execution progress
- Live results
- Live failure reporting

---

## 12. Dashboard

- Automation overview
- Recent runs
- Currently running automations
- Failed runs
- Automation status overview
- Quick run actions
- Empty states

---

## 13. Data & Security

- Supabase Auth integration
- Row Level Security
- User-owned automations
- User-owned runs
- User-owned artifacts
- Secure worker credentials
- Server-only secrets
- Storage access control

---

## 14. Reliability

- Worker failure handling
- Browser failure handling
- Playwright timeout handling
- Database failure handling
- Failed-step handling
- Automatic browser cleanup
- Run consistency
- Scheduled-run idempotency

---

## 15. Production Deployment

- Next.js deployment
- Supabase production setup
- Playwright worker deployment
- Worker environment configuration
- Scheduler deployment
- Production authentication
- Production storage
- Production end-to-end testing


# MVP Success Criteria

Automatio's MVP is ready when a user can:

- Create an account
- Create an automation
- Build an automation from browser actions
- Save the automation
- Run it manually
- Have a remote Playwright worker execute it
- See each step execute
- See success/failure results
- View screenshots
- View run history
- Schedule the automation
- Have scheduled runs execute automatically
- See live execution updates