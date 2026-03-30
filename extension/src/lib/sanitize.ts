import createDOMPurify from "dompurify";

let purifier: ReturnType<typeof createDOMPurify> | undefined;

function getPurifier() {
  if (typeof window === "undefined") {
    return undefined;
  }

  purifier ??= createDOMPurify(window);
  return purifier;
}

export function sanitizeHtml(input: string) {
  const instance = getPurifier();
  if (!instance) {
    return input
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "");
  }

  return instance.sanitize(input, {
    ALLOW_DATA_ATTR: false,
  });
}

