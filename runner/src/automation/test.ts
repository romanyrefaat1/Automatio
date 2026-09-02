import { index } from "./index";

const start = Date.now();

index(
  [
    {
      id: "parallel",
      type: "parallel",
      config: {
        merge_variables: true,
      },
    },

    {
      id: "api-1",
      type: "call_api",
      config: {
        method: "GET",
        url: "https://httpbin.org/anything/one",
        save_as: "response1",
      },
    },

    {
      id: "api-2",
      type: "call_api",
      config: {
        method: "GET",
        url: "https://httpbin.org/anything/two",
        save_as: "response2",
      },
    },

    {
      id: "api-3",
      type: "call_api",
      config: {
        method: "GET",
        url: "https://httpbin.org/anything/three",
        save_as: "response3",
      },
    },

    {
      id: "join",
      type: "call_chatgpt",
      config: {
        query: `
Tell me whether these variables exist:

response1 = {{response1}}

response2 = {{response2}}

response3 = {{response3}}
`,
      },
    },
  ],
  [
    {
      source: "parallel",
      target: "api-1",
    },
    {
      source: "parallel",
      target: "api-2",
    },
    {
      source: "parallel",
      target: "api-3",
    },

    {
      source: "api-1",
      target: "join",
    },
    {
      source: "api-2",
      target: "join",
    },
    {
      source: "api-3",
      target: "join",
    },
  ]
).then(() => {
  const elapsed =
    (Date.now() - start) / 1000;

  console.log(
    `\nTOTAL TIME: ${elapsed.toFixed(2)} seconds`
  );
});