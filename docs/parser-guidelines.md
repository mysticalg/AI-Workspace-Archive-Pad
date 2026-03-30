# Parser Guidelines

- Keep parser logic platform-specific and layered.
- Prefer multiple selectors instead of one brittle selector.
- Preserve code blocks, tables, links, and attachment metadata when available.
- Fall back to raw HTML snapshot plus clean text if structured extraction degrades.
- Never collect unrelated page content outside the supported AI conversation area.

