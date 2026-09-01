import { index } from "./index";

index(
  [
    {
      id: "1",
      type: "goto",
      config: {
        url: "data:text/html,<html><body><h1 id='title'>Romany</h1><div id='result'>success</div></body></html>",
        waitUntil: "domcontentloaded",
      },
    },

    {
      id: "2",
      type: "extract_text",
      config: {
        selector: "#title",
        save_as: "name",
      },
    },

    {
      id: "3",
      type: "condition",
      config: {
        source: "text",
        selector: "#title",
        operator: "is",
        value: "{{name}}",
      },
    },

    {
      id: "4",
      type: "assert_text",
      config: {
        selector: "#result",
        expected: "success",
        match: "exact",
      },
    },

    {
      id: "5",
      type: "assert_text",
      config: {
        selector: "#result",
        expected: "THIS SHOULD NOT RUN",
        match: "exact",
      },
    },
  ],

  [
    {
      source: "1",
      target: "2",
    },

    {
      source: "2",
      target: "3",
    },

    {
      source: "3",
      sourceHandle: "true",
      target: "4",
    },

    {
      source: "3",
      sourceHandle: "false",
      target: "5",
    },
  ]
);