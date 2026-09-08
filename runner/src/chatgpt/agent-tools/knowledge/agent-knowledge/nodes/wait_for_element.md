# Wait For Element Node

## Type

`wait_for_element`

## Purpose

Waits for an element to reach a specified state.

## Config

```json
{
  "selector": { "required": true, "type": "string" },
  "state": {
    "required": false,
    "type": "string",
    "enum": ["attached", "detached", "visible", "hidden"]
  },
  "timeout": { "required": false, "type": "number", "constraint": ">= 0" }
}
```

Allowed keys: `selector`, `state`, `timeout`.
