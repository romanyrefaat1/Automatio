# Goto Node

## Type

`goto`

## Purpose

Navigates the browser to a URL.

## Config

```json
{
  "url": { "required": true, "type": "string" },
  "waitUntil": {
    "required": false,
    "type": "string",
    "enum": ["load", "domcontentloaded", "networkidle"]
  }
}
```

Allowed keys: `url`, `waitUntil`.

Rules:

- `url` is required and must be a string.
- `waitUntil`, when supplied, must be `load`, `domcontentloaded`, or `networkidle`.
