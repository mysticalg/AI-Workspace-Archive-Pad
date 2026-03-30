export function detectDocumentTitle(document: Document, selectors: string[] = []) {
  for (const selector of selectors) {
    const text = document.querySelector(selector)?.textContent?.trim();
    if (text) {
      return text;
    }
  }

  return document.title.replace(/\s*[-|]\s*[^-|]+$/, "").trim() || document.title;
}

export function detectModelLabel(document: Document, selectors: string[] = []) {
  for (const selector of selectors) {
    const text = document.querySelector(selector)?.textContent?.trim();
    if (text) {
      return text;
    }
  }

  const fallbacks = Array.from(document.querySelectorAll("button, [role='button'], nav, header"))
    .map((element) => element.textContent?.trim())
    .filter(Boolean) as string[];

  return fallbacks.find((text) => /(gpt|claude|gemini|sonnet|opus|haiku|flash|pro)/i.test(text));
}

