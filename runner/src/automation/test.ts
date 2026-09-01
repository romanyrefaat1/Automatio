import { index } from "./index";

index([
  // 1. GOTO
  {
    type: "goto",
    config: {
      url: "https://the-internet.herokuapp.com/",
      waitUntil: "domcontentloaded",
    },
  },

  // 2. CLICK
  // Click the "Form Authentication" link
  {
    type: "click",
    config: {
      selector: 'a[href="/login"]',
      timeout: 5000,
      button: "left",
    },
  },

  // 3. ASSERT TEXT
  {
    type: "assert_text",
    config: {
      selector: "h2",
      expected: "Login Page",
      match: "exact",
    },
  },

  // 4. FILL
  {
    type: "fill",
    config: {
      selector: "#username",
      value: "tomsmith",
      timeout: 5000,
    },
  },

  // 5. FILL
  {
    type: "fill",
    config: {
      selector: "#password",
      value: "SuperSecretPassword!",
      timeout: 5000,
    },
  },

  // 6. PRESS
  // Press Enter on the password field
  {
    type: "press",
    config: {
      selector: "#password",
      key: "Enter",
    },
  },

  // 7. ASSERT TEXT
  {
    type: "assert_text",
    config: {
      selector: "h2",
      expected: "Secure Area",
      match: "exact",
    },
  },

  // 8. EXTRACT TEXT
  {
    type: "extract_text",
    config: {
      selector: "#flash",
      save_as: "login_message",
    },
  },

  // 9. GOTO CHECKBOXES
  {
    type: "goto",
    config: {
      url: "https://the-internet.herokuapp.com/checkboxes",
      waitUntil: "domcontentloaded",
    },
  },

  // 10. CHECK
  {
    type: "check",
    config: {
      selector: 'input[type="checkbox"]:first-of-type',
    },
  },

  // 11. UNCHECK
  {
    type: "uncheck",
    config: {
      selector: 'input[type="checkbox"]:nth-of-type(2)',
    },
  },

  // 12. WAIT FOR ELEMENT
  {
    type: "wait_for_element",
    config: {
      selector: 'input[type="checkbox"]:first-of-type',
      state: "visible",
      timeout: 5000,
    },
  },

  // 13. GOTO DROPDOWN
  {
    type: "goto",
    config: {
      url: "https://the-internet.herokuapp.com/dropdown",
      waitUntil: "domcontentloaded",
    },
  },

  // 14. SELECT
  {
    type: "select",
    config: {
      selector: "#dropdown",
      value: "1",
    },
  },

  // 15. SCREENSHOT
  {
    type: "screenshot",
    config: {
      fullPage: true,
    },
  },

  // 16. WAIT
  {
    type: "wait",
    config: {
      milliseconds: 1000,
    },
  },

  // Final verification
  {
    type: "assert_text",
    config: {
      selector: "h3",
      expected: "Dropdown List",
      match: "contains",
    },
  },
]);