# Call ChatGPT Node

## Type

`call_chatgpt`

## Purpose

Sends a query to ChatGPT and can optionally store the result in a variable.

## Config

```json
{
  "query": { "required": true, "type": "string" },
  "save_as": { "required": false, "type": "string" }
}
```

Allowed keys: `query`, `save_as`.
