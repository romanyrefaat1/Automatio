
---

# `automation-steps.md`

# automation_steps

## What it does

Stores the individual browser actions that make up an automation.

Each row is **one step**.

Example:

```text
0 → goto
1 → fill
2 → click
3 → screenshot
```

The worker executes these steps in `position` order.

## When to use it

Use this table when you need to:

* Create a step
* Edit a step
* Delete a step
* Load the steps for an automation
* Build the automation editor
* Give the worker the actions it must execute

## Columns

### `id`

* Type: `uuid`
* Required: yes
* Unique: yes
* Default: generated UUID
* Purpose: Unique identifier for this step.

### `automation_id`

* Type: `uuid`
* Required: yes
* References: `automations.id`
* Delete behavior: `cascade`
* Purpose: Which automation owns this step.

### `position`

* Type: `integer`
* Required: yes
* Minimum: `0`
* Purpose: Execution order.

Example:

```text
0 = first
1 = second
2 = third
```

`automation_id + position` must be unique.

### `type`

* Type: `automation_step_type`
* Required: yes
* Purpose: Tells the worker which action to execute.

Allowed values:

```text
goto
click
fill
select
check
uncheck
press
wait
wait_for_element
screenshot
extract_text
assert_text
```

### `title`

* Type: `text`
* Required: yes
* Purpose: Human-readable label shown in the builder.

Example:

```text
"Open product page"
"Enter email"
"Click login"
```

### `config`

* Type: `jsonb`
* Required: yes
* Default: `{}`

Purpose:

Contains the configuration required by the selected `type`.

The shape of `config` **depends on `type`**.

## Type → Config rules

### `goto`

```ts
{
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
}
```

Required:

```text
url
```

Optional:

```text
waitUntil
```

---

### `click`

```ts
{
  selector: string;
  timeout?: number;
  button?: "left" | "right" | "middle";
}
```

Required:

```text
selector
```

Optional:

```text
timeout
button
```

---

### `fill`

```ts
{
  selector: string;
  value: string;
  timeout?: number;
}
```

Required:

```text
selector
value
```

Optional:

```text
timeout
```

---

### `select`

```ts
{
  selector: string;
  value: string;
}
```

Required:

```text
selector
value
```

No other properties are allowed.

---

### `check`

```ts
{
  selector: string;
}
```

Required:

```text
selector
```

No other properties are allowed.

---

### `uncheck`

```ts
{
  selector: string;
}
```

Required:

```text
selector
```

No other properties are allowed.

---

### `press`

```ts
{
  selector: string;
  key: string;
}
```

Required:

```text
selector
key
```

No other properties are allowed.

---

### `wait`

```ts
{
  milliseconds: number;
}
```

Required:

```text
milliseconds
```

Rules:

* Must be greater than `0`.
* Maximum for V1: `120000` milliseconds (2 minutes).

---

### `wait_for_element`

```ts
{
  selector: string;
  state?: "attached" | "detached" | "visible" | "hidden";
  timeout?: number;
}
```

Required:

```text
selector
```

Optional:

```text
state
timeout
```

---

### `screenshot`

```ts
{
  fullPage?: boolean;
}
```

Optional:

```text
fullPage
```

The screenshot itself is **not stored in this JSON**.

The actual file goes into Supabase Storage.

---

### `extract_text`

```ts
{
  selector: string;
  save_as: string;
}
```

Required:

```text
selector
save_as
```

`save_as` is the name used to reference the extracted value.

Example:

```json
{
  "selector": ".price",
  "save_as": "product_price"
}
```

---

### `assert_text`

```ts
{
  selector: string;
  expected: string;
  match?: "exact" | "contains";
}
```

Required:

```text
selector
expected
```

Optional:

```text
match
```

Allowed `match` values:

```text
exact
contains
```

## Rules

1. Every step belongs to exactly one automation.
2. `position >= 0`.
3. Two steps belonging to the same automation cannot have the same `position`.
4. Steps are executed in ascending `position`.
5. `type` determines the exact valid shape of `config`.
6. `config` must always be a JSON object.
7. Unknown properties in `config` are not allowed.
8. A property that belongs to another action type must not be added.
9. Required properties cannot be omitted.
10. Required properties must have exactly the correct JSON type.
11. The TypeScript discriminated union must match the database validation rules.
12. Do not use `any` for step configuration.
13. Do not put scheduling information in this table.
14. Do not put execution results in this table.
15. If an automation is edited later, old runs retain their original step configuration through `automation_run_steps.step_config`.

## Example

Valid:

```json
{
  "type": "goto",
  "config": {
    "url": "https://example.com"
  }
}
```

Invalid:

```json
{
  "type": "goto",
  "config": {
    "selector": "#login"
  }
}
```

Invalid:

```json
{
  "type": "click",
  "config": {
    "selector": "#login",
    "url": "https://example.com"
  }
}
```
