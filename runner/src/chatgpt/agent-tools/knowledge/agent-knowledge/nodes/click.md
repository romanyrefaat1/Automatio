# Click Node

## Type

`click`

## Purpose

Clicks a browser element.

## Config

```json
{
  "selector": { "required": true, "type": "string" },
  "timeout": { "required": false, "type": "number", "constraint": ">= 0" },
  "button": { "required": false, "type": "string", "enum": ["left", "right", "middle"] }
}
```

Allowed keys: `selector`, `timeout`, `button`.
