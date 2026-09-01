
---

# `automation-runs.md`

# automation_runs

## What it does

Represents **one actual execution** of an automation.

An automation is a reusable recipe.

A run is one attempt to execute that recipe.

Example:

```text
Automation:
"Check Product Price"

Runs:
09:00 ✅
10:00 ✅
11:00 ❌
12:00 ✅
```

## When to use it

Use this table when you need to:

* Queue an execution
* Start an execution
* Track execution status
* View execution history
* Store top-level run errors
* Let the worker claim work

## Columns

### `id`

* Type: `uuid`
* Required: yes
* Unique: yes
* Purpose: Unique execution ID.

### `automation_id`

* Type: `uuid`
* Required: yes
* References: `automations.id`
* Delete behavior: `cascade`
* Purpose: Which automation is being executed.

### `schedule_id`

* Type: `uuid`
* Required: no
* References: `automation_schedules.id`
* Delete behavior: `set null`

Purpose:

Identifies which schedule caused the run.

`NULL` means the run was manually triggered.

### `trigger`

* Type: `automation_run_trigger`
* Required: yes
* Default: `manual`

Allowed values:

```text
manual
schedule
```

### `status`

* Type: `automation_run_status`
* Required: yes
* Default: `queued`

Allowed values:

```text
queued
running
completed
failed
cancelled
```

Meaning:

```text
queued
    The worker has not started it yet.

running
    The worker is currently executing it.

completed
    Every required step completed successfully.

failed
    At least one step failed or the worker encountered
    an unrecoverable error.

cancelled
    The run was intentionally stopped.
```

### `scheduled_for`

* Type: `timestamptz`
* Required: for scheduled runs
* Purpose: Exact schedule occurrence represented by this run.

This is also used to prevent duplicate scheduled runs.

### `started_at`

* Type: `timestamptz`
* Required: no
* Purpose: When the worker began execution.

### `finished_at`

* Type: `timestamptz`
* Required: no
* Purpose: When execution ended.

### `error`

* Type: `text`
* Required: no
* Purpose: Top-level reason for failure.

### `attempt`

* Type: `integer`
* Required: yes
* Default: `1`
* Minimum: `1`
* Purpose: Number of attempts used to execute this run.

### `created_at`

* Type: `timestamptz`
* Required: yes

## Rules

1. Every run belongs to exactly one automation.
2. A run can optionally belong to a schedule.
3. A manual run normally has:

   ```text
   trigger = manual
   schedule_id = null
   ```
4. A scheduled run normally has:

   ```text
   trigger = schedule
   schedule_id != null
   ```
5. A newly created run starts as `queued`.
6. Only the worker should normally change:

   ```text
   queued → running
   running → completed
   running → failed
   running → cancelled
   ```
7. A completed run should have `finished_at`.
8. A failed run should have an `error`.
9. A running run should have `started_at`.
10. A run is historical data and should not change its automation definition.
11. Its exact executed steps are recorded in `automation_run_steps`.
12. Scheduled runs use `schedule_id + scheduled_for` to avoid duplicate occurrences.

## Lifecycle

```text
queued
  │
  ▼
running
  │
  ├──────► completed
  │
  ├──────► failed
  │
  └──────► cancelled
```

## Important distinction

Do not confuse:

```text
automations
```

with:

```text
automation_runs
```

`automations` = the recipe.

`automation_runs` = an execution of that recipe.

One automation can have thousands of runs.