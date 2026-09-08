# Workflow Rules

These are hard invariants for every generated Automatio workflow.

1. `nodes` must contain at least two nodes: one `trigger` and one `end`.
2. Positions are zero-based.
3. Positions must be unique.
4. Positions must be contiguous: `0, 1, 2, ..., n`.
5. Exactly one node may have `type: "trigger"`.
6. The trigger must have `position: 0`.
7. No other node may have `type: "trigger"`.
8. Exactly one node may have `type: "end"`.
9. The end node must have the highest position.
10. No other node may have `type: "end"`.
11. The trigger node's config must be `{}` unless trigger-specific knowledge explicitly changes this rule.
12. The end node's config must be `{}`.
13. Every node must have a valid supported `type`.
14. Every node's `config` must obey that type's node knowledge.
15. Unknown config keys are invalid.
16. The workflow must not contain Supabase persistence fields such as IDs, timestamps, or canvas coordinates.
17. Execution order is represented by `position`; React Flow canvas coordinates are not part of the agent output.
18. The final node must be `end` regardless of whether the workflow contains branches or control-flow nodes.

Before producing the final workflow, verify all invariants.
