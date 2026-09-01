import goto from "./nodes/goto";
import click from "./nodes/click";
import fill from "./nodes/fill";
import select from "./nodes/select";
import check from "./nodes/check";
import uncheck from "./nodes/uncheck";
import press from "./nodes/press";
import wait from "./nodes/wait";
import wait_for_element from "./nodes/wait_for_element";
import screenshot from "./nodes/screenshot";
import extract_text from "./nodes/extract_text";
import assert_text from "./nodes/assert_text";

// Finds the correct node
export async function dispatcher(workflowNode, browser, page) {
  switch (workflowNode.type) {
    case "goto":
      return goto(workflowNode.config, page);

    case "click":
      return click(workflowNode.config, page);

    case "fill":
      return fill(workflowNode.config, page);

    case "select":
      return select(workflowNode.config, page);

    case "check":
      return check(workflowNode.config, page);

    case "uncheck":
      return uncheck(workflowNode.config, page);

    case "press":
      return press(workflowNode.config, page);

    case "wait":
      return wait(workflowNode.config, page);

    case "wait_for_element":
      return wait_for_element(workflowNode.config, page);

    case "screenshot":
      return screenshot(workflowNode.config, page);

    case "extract_text":
      return extract_text(workflowNode.config, page);

    case "assert_text": // find text that matches this exact word
      return assert_text(workflowNode.config, page);

    default:
      throw new Error(`Unknown workflow node type: ${workflowNode.type}`);
  }
}