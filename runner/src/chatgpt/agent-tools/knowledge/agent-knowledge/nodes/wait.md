# Wait Node

## Type

`wait`

## Purpose

Pauses execution for a fixed duration.

## Config

```json
{
  "milliseconds": {
    "required": true,
    "type": "number",
    "constraint": "> 0 and <= 120000"
  }
}
```

Allowed key: `milliseconds`.
