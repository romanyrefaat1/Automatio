
# `automation-artifacts.md`

# automation_artifacts

## What it does

Stores metadata about files created by automation runs.

The actual binary file is stored in **Supabase Storage**.

This table stores information about that file.

Examples:

```text
Screenshot
Downloaded CSV
Generated file
```

## When to use it

Use this table when an automation produces a file that needs to be:

* Stored
* Displayed in the dashboard
* Downloaded
* Associated with a run
* Associated with a specific step

Do not put binary files directly inside PostgreSQL.

## Columns

### `id`

* Type: `uuid`
* Required: yes
* Unique: yes
* Purpose: Unique artifact ID.

### `run_id`

* Type: `uuid`
* Required: yes
* References: `automation_runs.id`
* Delete behavior: `cascade`
* Purpose: Which run produced this file.

### `run_step_id`

* Type: `uuid`
* Required: no
* References: `automation_run_steps.id`
* Delete behavior: `cascade`
* Purpose: Which exact step produced the file, if applicable.

### `type`

* Type: `automation_artifact_type`
* Required: yes

Allowed values:

```text
screenshot
download
file
```

### `storage_path`

* Type: `text`
* Required: yes
* Purpose: Path of the actual file inside Supabase Storage.

Example:

```text
runs/run-123/step-4/screenshot.png
```

### `filename`

* Type: `text`
* Required: no
* Purpose: User-facing filename.

### `mime_type`

* Type: `text`
* Required: no
* Purpose: MIME type of the stored file.

Examples:

```text
image/png
text/csv
application/pdf
```

### `size_bytes`

* Type: `bigint`
* Required: no
* Minimum: `0`
* Purpose: Size of the file.

### `created_at`

* Type: `timestamptz`
* Required: yes
* Purpose: When the artifact record was created.

## Rules

1. Every artifact belongs to exactly one run.
2. The actual file belongs in Supabase Storage.
3. `storage_path` points to the actual stored file.
4. `run_step_id` may be `NULL` if the artifact belongs to the run generally rather than a specific step.
5. Deleting a run deletes its artifact metadata.
6. Deleting the associated Storage object should also be handled when artifacts are deleted.
7. Do not put base64-encoded files into `storage_path`.
8. Do not put binary data into PostgreSQL.
9. Screenshots should normally be created by the `screenshot` step.
10. `automation_artifacts` describes files; it does not describe step execution.

## Example

```json
{
  "id": "artifact-123",
  "run_id": "run-123",
  "run_step_id": "run-step-4",
  "type": "screenshot",
  "storage_path": "runs/run-123/step-4/screenshot.png",
  "filename": "screenshot.png",
  "mime_type": "image/png",
  "size_bytes": 483920
}
```

## Relationship

```text
automation
   │
   ▼
automation_run
   │
   ├──< automation_run_steps
   │
   └──< automation_artifacts
                │
                ▼
         Supabase Storage
```
