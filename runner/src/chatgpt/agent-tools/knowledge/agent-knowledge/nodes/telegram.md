# Telegram Node

## Type

`telegram`

## Purpose

Sends a message through a configured Telegram integration and can optionally save the result.

## Config

```json
{
  "integration_id": { "required": true, "type": "string" },
  "message": { "required": true, "type": "string" },
  "save_as": { "required": false, "type": "string" }
}
```

Allowed keys: `integration_id`, `message`, `save_as`.
