# Fill Node

## Type

`fill`

## Purpose

Fills an input element with text.

## Config

```json
{
  "selector": { "required": true, "type": "string" },
  "value": { "required": true, "type": "string" },
  "timeout": { "required": false, "type": "number", "constraint": ">= 0" }
}
```

Allowed keys: `selector`, `value`, `timeout`.
