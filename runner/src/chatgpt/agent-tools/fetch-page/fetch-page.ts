import { Browser, Page, chromium } from "@playwright/test";

async function cleanDOM(page: Page) {
  return await page.evaluate(`
    (() => {
      function parseElement(el) {
        const style = window.getComputedStyle(el);

        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0'
        ) {
          return '';
        }

        const tagName = el.tagName.toLowerCase();

        if (
          ['script', 'style', 'svg', 'path', 'link', 'noscript', 'iframe']
            .includes(tagName)
        ) {
          return '';
        }

        const attributes = [];

        if (el.id) {
          attributes.push('id="' + el.id + '"');
        }

        if (el.type) {
          attributes.push('type="' + el.type + '"');
        }

        if (el.getAttribute('role')) {
          attributes.push(
            'role="' + el.getAttribute('role') + '"'
          );
        }

        if (el.getAttribute('aria-label')) {
          attributes.push(
            'aria-label="' + el.getAttribute('aria-label') + '"'
          );
        }

        if (el.getAttribute('aria-expanded')) {
          attributes.push(
            'aria-expanded="' + el.getAttribute('aria-expanded') + '"'
          );
        }

        if (el.getAttribute('aria-disabled') || el.disabled) {
          attributes.push('disabled="true"');
        }

        if (el.getAttribute('data-testid')) {
          attributes.push(
            'data-testid="' + el.getAttribute('data-testid') + '"'
          );
        }

        const attrString =
          attributes.length > 0
            ? ' [' + attributes.join(' ') + ']'
            : '';

        let directText = '';

        el.childNodes.forEach(node => {
          if (
            node.nodeType === Node.TEXT_NODE &&
            node.textContent
          ) {
            const trimmed = node.textContent.trim();

            if (trimmed) {
              directText += ' "' + trimmed + '"';
            }
          }
        });

        let childrenOutput = '';

        Array.from(el.children).forEach(child => {
          const childStr = parseElement(child);

          if (childStr) {
            childrenOutput +=
              '\\n  ' +
              childStr.replace(/\\n/g, '\\n  ');
          }
        });

        if (
          !attrString &&
          !directText &&
          !childrenOutput.trim()
        ) {
          return '';
        }

        return (
          '<' +
          tagName +
          attrString +
          '>' +
          directText +
          childrenOutput
        );
      }

      return parseElement(document.body);
    })()
  `);
}

export async function fetchPage(
  url: string,
  browser?: Browser
) {
  let browserInner = browser;
  let launchedLocally = false;

  if (!browserInner) {
    browserInner = await chromium.launch({
      headless: false,
    });

    launchedLocally = true;
  }

  const page = await browserInner.newPage();

  try {
    await page.goto(url, {
      waitUntil: "networkidle",
    });

    const cleanedDOM = await cleanDOM(page);

    return cleanedDOM;
  } finally {
    await page.close();

    if (launchedLocally) {
      await browserInner.close();
    }
  }
}