# Loop Node

## Type

`loop`

## Purpose

Repeats workflow execution while a comparison condition remains true according to the runtime's loop semantics.

## Config

```json
{
  "condition": {
    "left": {
      "type": "static | variable | text | input_value | attribute | url | title",
      "value": "required when type = static",
      "name": "required when type = variable",
      "selector": "required when type = text, input_value, or attribute",
      "attribute": "required when type = attribute"
    },
    "operator": "is | is_not | contains | not_contains | starts_with | ends_with",
    "right": {
      "type": "static | variable | text | input_value | attribute | url | title",
      "value": "required when type = static",
      "name": "required when type = variable",
      "selector": "required when type = text, input_value, or attribute",
      "attribute": "required when type = attribute"
    }
  },
  "max_iterations": {
    "required": false,
    "type": "number",
    "constraint": "> 0"
  }
}
```

Top-level allowed keys: `condition`, `max_iterations`.

The condition object allows only `left`, `operator`, and `right`.

Operand allowed keys: `type`, `selector`, `attribute`, `name`, `value`.
