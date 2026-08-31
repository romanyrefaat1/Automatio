# `automation-schedules.md`

# automation_schedules

## What it does

Defines **when an automation should run**.

This table does not contain browser actions.

It answers:

> "When should the entire automation create a run?"

## When to use it

Use this table when you need to:

* Schedule an automation
* Change when an automation runs
* Pause a schedule
* Enable a schedule
* Find automations that are due to run

## Columns

### `id`

* Type: `uuid`
* Required: yes
* Unique: yes
* Purpose: Unique schedule ID.

### `automation_id`

* Type: `uuid`
* Required: yes
* References: `automations.id`
* Delete behavior: `cascade`
* Purpose: Automation controlled by this schedule.

### `type`

* Type: `automation_schedule_type`
* Required: yes

Allowed values:

```text
once
interval
```

### `run_at`

* Type: `timestamptz`
* Required: only for `once`
* Purpose: Exact time to execute a one-time schedule.

### `interval_seconds`

* Type: `integer`
* Required: only for `interval`
* Minimum: `60`
* Purpose: How many seconds between executions.

Example:

```text
3600 = every hour
86400 = every day
```

### `next_run_at`

* Type: `timestamptz`
* Required: normally yes for enabled schedules
* Purpose: The next time the scheduler should check/create a run.

### `enabled`

* Type: `boolean`
* Required: yes
* Default: `true`
* Purpose: Whether this schedule is currently active.

### `created_at`

* Type: `timestamptz`
* Required: yes

### `updated_at`

* Type: `timestamptz`
* Required: yes

## Rules

### `once`

Must have:

```text
type = once
run_at != null
interval_seconds = null
```

Example:

```json
{
  "type": "once",
  "run_at": "2026-09-01T18:00:00Z"
}
```

### `interval`

Must have:

```text
type = interval
interval_seconds != null
run_at = null
```

Example:

```json
{
  "type": "interval",
  "interval_seconds": 3600
}
```

Additional rules:

1. `interval_seconds` must be at least `60`.
2. A schedule does not directly execute Playwright.
3. The scheduler creates an `automation_runs` row.
4. The worker executes the resulting run.
5. Multiple schedules can belong to the same automation.
6. A disabled schedule must not create new runs.
7. `next_run_at` is managed by the scheduler.
8. Scheduling does not belong in `automation_steps`.

## Relationship

```text
automation
    │
    └──< automation_schedules
              │
              │ becomes due
              ▼
        automation_run
```