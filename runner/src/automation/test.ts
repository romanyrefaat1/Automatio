import { index } from "./index";

async function runTest(
  name: string,
  workflow: any[],
  edges: any[]
) {
  console.log("\n========================================");
  console.log(`TEST: ${name}`);
  console.log("========================================\n");

  try {
    await index(workflow, edges);
    console.log(`\n✓ ${name} PASSED`);
  } catch (error) {
    console.error(`\n✗ ${name} FAILED`);
    console.error(error);
  }
}

async function testVariableInterpolation() {
  await runTest(
    "Variable interpolation inside API body",
    [
      {
        id: "1",
        type: "call_chatgpt",
        config: {
          query: "Return only this exact word: Romany",
          save_as: "name",
        },
      },
      {
        id: "2",
        type: "call_api",
        config: {
          method: "POST",
          url: "https://httpbin.org/post",
          body: {
            username: "{{name}}",
            message: "Hello {{name}}",
          },
          save_as: "response",
        },
      },
    ],
    [
      {
        source: "1",
        target: "2",
      },
    ]
  );
}

testVariableInterpolation();