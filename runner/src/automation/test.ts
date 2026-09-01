import { index } from "./index";

index(
  [
    {
      id: "1",
      type: "goto",
      config: {
        url: "data:text/html,<p id='status'>The task is ready</p>",
        waitUntil: "domcontentloaded",
      },
    },

    {
      id: "2",
      type: "extract_text",
      config: {
        selector: "#status",
        save_as: "status",
      },
    },

    {
      id: "3",
      type: "call_chatgpt",
      config: {
        query:
          "The status is: {{status}}\n\n" +
          "If the status says 'The task is ready', reply with exactly YES. " +
          "Otherwise reply with exactly NO.",
        save_as: "answer",
      },
    },

    {
      id: "4",
      type: "goto",
      config: {
        url: "data:text/html,<p id='ai-result'>{{answer}}</p>",
        waitUntil: "domcontentloaded",
      },
    },

    {
      id: "5",
      type: "condition",
      config: {
        source: "text",
        selector: "#ai-result",
        operator: "is",
        value: "{{answer}}",
      },
    },

    {
      id: "6",
      type: "goto",
      config: {
        url: "data:text/html,<h1 id='result'>AI branch succeeded</h1>",
        waitUntil: "domcontentloaded",
      },
    },

    {
      id: "7",
      type: "assert_text",
      config: {
        selector: "#result",
        expected: "AI branch succeeded",
        match: "exact",
      },
    },

    {
      id: "8",
      type: "goto",
      config: {
        url: "data:text/html,<h1 id='result'>AI branch failed</h1>",
        waitUntil: "domcontentloaded",
      },
    },

    {
      id: "9",
      type: "assert_text",
      config: {
        selector: "#result",
        expected: "AI branch failed",
        match: "exact",
      },
    },
  ],

  [
    { source: "1", target: "2" },
    { source: "2", target: "3" },
    { source: "3", target: "4" },

    // Condition branches
    {
      source: "4",
      target: "5",
    },

    {
      source: "5",
      sourceHandle: "true",
      target: "6",
    },

    {
      source: "5",
      sourceHandle: "false",
      target: "8",
    },

    { source: "6", target: "7" },
    { source: "8", target: "9" },
  ]
);
