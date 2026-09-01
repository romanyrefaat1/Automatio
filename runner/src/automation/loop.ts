import { Browser, Page } from "@playwright/test";
import { dispatcher } from "./dispatcher";

export default async function loop(workflowArray, browser: Browser, page: Page) {
     if (workflowArray.length === 0) {
        throw new Error("Empty workflowArray")
    }

 for (let i = 0; i <workflowArray.length; i++) {
        const currItem = workflowArray[i];

        const response = await dispatcher(currItem, browser, page)

        if (response.success) {
            console.log("Success:", response)
        } else {
            console.error("Error:", response)
        }
    }

    browser.close()
}