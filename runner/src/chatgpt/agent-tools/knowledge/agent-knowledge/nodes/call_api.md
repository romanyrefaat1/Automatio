# Call API Node

## Type

`call_api`

## Purpose

Makes an HTTP API request and can optionally save a response value as a variable.

## Config

```json
{
  "url": { "required": true, "type": "string" },
  "method": {
    "required": false,
    "type": "string",
    "enum": ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
  },
  "query": { "required": false, "type": "object" },
  "headers": { "required": false, "type": "object" },
  "body": {
    "required": false,
    "type": "any",
    "note": "declared in allowed_keys but not validated in the trigger"
  },
  "save_as": { "required": false, "type": "string" }
}
```

Allowed keys: `url`, `method`, `query`, `headers`, `body`, `save_as`.
