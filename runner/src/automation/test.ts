import { index } from "./index";

index(
  [
    // ============================================================
    // 1. GOTO
    // ============================================================
    {
      id: "1",
      type: "goto",
      config: {
        url: "data:text/html,<html><body><h1 id='title'>Automation Test</h1><div id='status'>0</div><button id='increment' onclick=\"document.getElementById('status').textContent = Number(document.getElementById('status').textContent) + 1\">Increment</button></body></html>",
        waitUntil: "domcontentloaded",
      },
    },

    // ============================================================
    // 2. ASSERT
    // ============================================================
    {
      id: "2",
      type: "assert_text",
      config: {
        selector: "#title",
        expected: "Automation Test",
        match: "exact",
      },
    },

    // ============================================================
    // 3. CONDITION
    //
    // Should be TRUE.
    // ============================================================
    {
      id: "3",
      type: "condition",
      config: {
        selector: "#status",
        operator: "is",
        value: "0",
      },
    },

    // ============================================================
    // TRUE BRANCH
    // ============================================================

    // 4. CLICK
    {
      id: "4",
      type: "click",
      config: {
        selector: "#increment",
      },
    },

    // 5. ASSERT
    {
      id: "5",
      type: "assert_text",
      config: {
        selector: "#status",
        expected: "1",
        match: "exact",
      },
    },

    // ============================================================
    // 6. CONDITION
    //
    // Should be TRUE because status is now 1.
    // ============================================================
    {
      id: "6",
      type: "condition",
      config: {
        selector: "#status",
        operator: "is",
        value: "1",
      },
    },

    // ============================================================
    // TRUE → LOOP
    // ============================================================

    // 7. LOOP
    //
    // Continue while status is NOT 4.
    // Maximum 5 iterations as a safety limit.
    {
      id: "7",
      type: "loop",
      config: {
        max_iterations: 5,
        condition: {
          selector: "#status",
          operator: "is_not",
          value: "4",
        },
      },
    },

    // ============================================================
    // LOOP BODY
    // ============================================================

    // 8. CLICK
    {
      id: "8",
      type: "click",
      config: {
        selector: "#increment",
      },
    },

    // 9. WAIT
    {
      id: "9",
      type: "wait",
      config: {
        milliseconds: 100,
      },
    },

    // Loop returns to node 7 through an edge.
    //
    // ============================================================
    // 10. FINAL ASSERT
    // ============================================================

    {
      id: "10",
      type: "assert_text",
      config: {
        selector: "#status",
        expected: "4",
        match: "exact",
      },
    },

    // ============================================================
    // 11. CONDITION FALSE TEST
    //
    // status is 4, so this should return false.
    // ============================================================

    {
      id: "11",
      type: "condition",
      config: {
        selector: "#status",
        operator: "is_not",
        value: "4",
      },
    },

    // ============================================================
    // 12. FALSE BRANCH
    //
    // If condition is false, go here.
    // ============================================================

    {
      id: "12",
      type: "assert_text",
      config: {
        selector: "#status",
        expected: "4",
        match: "exact",
      },
    },
  ],

  [
    // ============================================================
    // NORMAL FLOW
    // ============================================================

    { source: "1", target: "2" },

    // Condition 3
    { source: "2", target: "3" },

    // condition 3 TRUE
    { source: "3", sourceHandle: "true", target: "4" },

    // condition 3 FALSE
    // Intentionally no false edge because status starts at 0.

    { source: "4", target: "5" },

    // Condition 6
    { source: "5", target: "6" },

    // condition 6 TRUE → loop
    { source: "6", sourceHandle: "true", target: "7" },

    // condition 6 FALSE
    // No false edge needed for this test.

    // ============================================================
    // LOOP
    // ============================================================

    // Loop body
    { source: "7", sourceHandle: "body", target: "8" },

    // Body
    { source: "8", target: "9" },

    // Loop back
    { source: "9", target: "7" },

    // Loop done
    { source: "7", sourceHandle: "done", target: "10" },

    // ============================================================
    // TEST CONDITION FALSE
    // ============================================================

    { source: "10", target: "11" },

    // condition 11 is FALSE
    { source: "11", sourceHandle: "false", target: "12" },
  ]
);