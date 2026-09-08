# Workflow Output Contract

The agent's `result` is an execution-ready workflow description.

It is NOT a Supabase row representation.

The application first shows the generated workflow to the user. Only after the user accepts it does the application convert it into `public.automation_steps` rows.

## Output shape

```json
{
  "nodes": [
    {
      "position": 0,
      "type": "trigger",
      "title": "Start",
      "description": "",
      "config": {}
    }
  ],
  "edges": []
}
```

## Node fields

Each node may contain exactly these workflow-level fields:

- `position` — zero-based execution position.
- `type` — an existing Automatio node type.
- `title` — short human-readable title.
- `description` — optional human-readable description.
- `config` — execution configuration for that node.

The agent must NOT output these Supabase-only fields:

- `id`
- `automation_id`
- `created_at`
- `updated_at`
- `position_x`
- `position_y`

The application creates those fields when persisting the accepted workflow.

## Config

`config` must always be a JSON object.

The exact allowed configuration keys are defined by the corresponding node knowledge file under `nodes/`.

Never invent configuration keys.

## Edges

Edges describe execution relationships between generated nodes. See `workflow/edges.md` for the exact edge contract.
