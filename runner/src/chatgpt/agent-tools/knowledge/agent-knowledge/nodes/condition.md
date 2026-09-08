# Condition Node

## Type

`condition`

## Purpose

Evaluates a comparison between two operands.

## Config

```json
{
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
}
```

Top-level allowed keys: `left`, `operator`, `right`.

Operand allowed keys: `type`, `selector`, `attribute`, `name`, `value`.

No other operand keys are allowed.
