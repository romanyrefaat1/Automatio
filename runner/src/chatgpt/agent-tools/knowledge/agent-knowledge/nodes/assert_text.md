# Assert Text Node

## Type

`assert_text`

## Purpose

Checks text from either a page element or a previously stored variable.

## Config

```json
{
  "selector": { "required": "conditionally — either selector or variable must be present", "type": "string" },
  "variable": { "required": "conditionally — either selector or variable must be present", "type": "string" },
  "expected": { "required": true, "type": "string" },
  "match": { "required": false, "type": "string", "enum": ["exact", "contains"] },
  "save_as": { "required": false, "type": "string" }
}
```

Allowed keys: `selector`, `variable`, `expected`, `match`, `save_as`.

Exactly one of `selector` or `variable` must be supplied.
