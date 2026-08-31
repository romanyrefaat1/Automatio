# `automations.md`

# automations

## What it does

Stores the reusable automation itself.

An automation is the **recipe** that says what the browser should do. It does not represent one execution.

Example:

> "Check Product Price"

The actual actions belong in `automation_steps`.

## When to use it

Use this table when you need to:

* Create an automation
* Edit an automation
* Delete an automation
* Load a user's automations
* Pause or archive an automation
* Find which automation a run belongs to

Do **not** store individual browser actions in this table.

## Columns

### `id`

* Type: `uuid`
* Required: yes
* Unique: yes
* Default: generated UUID
* Purpose: Unique identifier for the automation.

### `user_id`

* Type: `uuid`
* Required: yes
* References: `auth.users.id`
* Delete behavior: `cascade`
* Purpose: The user who owns the automation.

### `name`

* Type: `text`
* Required: yes
* Purpose: Human-readable automation name.
* Example: `"Check Product Price"`

### `description`

* Type: `text`
* Required: no
* Purpose: Optional explanation of the automation.

### `status`

* Type: `automation_status`
* Required: yes
* Default: `active`

Allowed values:

```text
active
paused
archived
```

Meaning:

* `active`: automation is available to run.
* `paused`: automation still exists but should not be triggered by schedules.
* `archived`: no longer actively used.

### `created_at`

* Type: `timestamptz`
* Required: yes
* Purpose: When the automation was created.

### `updated_at`

* Type: `timestamptz`
* Required: yes
* Purpose: Last time the automation itself changed.

## Rules

1. Every automation belongs to exactly one user.
2. `user_id` must reference a real authenticated user.
3. Deleting a user deletes their automations.
4. Deleting an automation also deletes its:

   * steps
   * schedules
   * runs
   * run-step records
   * artifacts
5. `status = paused` does not delete anything.
6. `status = archived` does not delete anything.
7. Browser actions never belong directly in `automations`.
8. Browser actions belong in `automation_steps`.

## Relationships

```text
auth.users
    │
    └──< automations
            │
            ├──< automation_steps
            ├──< automation_schedules
            └──< automation_runs
```

## Example

```json
{
  "id": "8d5...",
  "user_id": "12a...",
  "name": "Check Product Price",
  "description": "Checks the product price every hour",
  "status": "active"
}
```