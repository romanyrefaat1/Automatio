# `automation-run-steps.md`

# automation_run_steps

## What it does

Stores what happened to **each individual step during one run**.

It also stores a snapshot of the step's type and configuration.

This is important because the automation can be edited after the run finishes.

Example:

```text
Current automation:
click #new-login-button

Old run:
click #old-login-button
```

The old run must continue to show what it actually executed.

## When to use it

Use this table when you need to:

* Track step execution
* Show run progress
* Display per-step errors
* Display extracted values
* Store action results
* Debug failed automations
* Reconstruct exactly what happened during an old run

## Columns

### `id`

* Type: `uuid`
* Required: yes
* Unique: yes
* Purpose: Unique ID for this execution-step record.

### `run_id`

* Type: `uuid`
* Required: yes
* References: `automation_runs.id`
* Delete behavior: `cascade`
* Purpose: Which run this step execution belongs to.

### `step_id`

* Type: `uuid`
* Required: no
* References: `automation_steps.id`
* Delete behavior: `set null`

Purpose:

Links the execution back to the original automation step.

It may become `NULL` if the original step is deleted later.

### `position`

* Type: `integer`
* Required: yes
* Minimum: `0`
* Purpose: Position of the step when this run executed.

### `step_type`

* Type: `automation_step_type`
* Required: yes
* Purpose: Snapshot of the action type that was actually executed.

### `step_config`

* Type: `jsonb`
* Required: yes
* Purpose: Snapshot of the exact configuration used during execution.

This must follow the same `step_type → config` rules as `automation_steps.config`.

### `status`

* Type: `automation_run_step_status`
* Required: yes
* Default: `pending`

Allowed values:

```text
pending
running
completed
failed
skipped
```

### `started_at`

* Type: `timestamptz`
* Required: no
* Purpose: When this individual step began.

### `finished_at`

* Type: `timestamptz`
* Required: no
* Purpose: When this individual step finished.

### `result`

* Type: `jsonb`
* Required: no
* Purpose: Result produced by the action.

The structure depends on `step_type`.

Examples:

`goto`:

```json
{
  "finalUrl": "https://example.com"
}
```

`extract_text`:

```json
{
  "value": "$49.99"
}
```

`screenshot`:

```json
{
  "artifactId": "..."
}
```

`click`:

```json
{
  "clicked": true
}
```

### `error`

* Type: `text`
* Required: no
* Purpose: Error specific to this step.

### `created_at`

* Type: `timestamptz`
* Required: yes

## Rules

1. Every run-step belongs to exactly one run.
2. `position >= 0`.
3. A run cannot have two run-steps with the same position.
4. `step_type` records what was actually executed.
5. `step_config` records the exact configuration actually executed.
6. `step_id` is a reference to the original step, not the source of truth for historical data.
7. Historical execution data should remain correct even if the automation is later edited.
8. `result` depends on `step_type`.
9. `error` should normally exist when `status = failed`.
10. A successful step should normally have `status = completed`.
11. A step that never executes because an earlier step failed may be `skipped`.
12. Do not overwrite old execution records when re-running an automation.
13. Every execution creates a new set of run-step records.

## Example

```json
{
  "run_id": "run-123",
  "step_id": "step-456",
  "position": 2,
  "step_type": "extract_text",
  "step_config": {
    "selector": ".price",
    "save_as": "price"
  },
  "status": "completed",
  "result": {
    "value": "$49.99"
  }
}
```