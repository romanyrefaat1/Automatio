# Workflow Edges

Edges describe which workflow node executes after another node.

## Output shape

Each edge should identify its source and target workflow positions:

```json
{
  "source": 0,
  "target": 1
}
```

`source` and `target` refer to node `position` values in the generated workflow.

Do not include Supabase edge identifiers or database metadata.

## Rules

- Every referenced source position must exist.
- Every referenced target position must exist.
- Do not reference nonexistent nodes.
- Do not create duplicate edges unless a control-flow rule explicitly requires distinct branches and the edge representation supports that distinction.
- Normal sequential execution should connect each step to the next step.
- Control-flow nodes such as `condition`, `loop`, and `parallel` may require multiple outgoing relationships according to their node-specific execution semantics.
