---
description: A caught error must be handled, rethrown, or returned as a failure the caller can tell apart from success, never discarded or turned into a value that reads as a successful result, such as `null`, an empty array, or a default. Logging an error and carrying on as if nothing failed discards it. Recovering from one specific, expected error, such as a missing file that has a default, handles it.
---

## Must

```ts
async function loadSettings(path: string): Promise<Settings> {
  try {
    return parseSettings(await readFile(path, "utf8"));
  } catch (error) {
    if (isNotFound(error)) return DEFAULT_SETTINGS;
    throw new Error(`Could not load settings from ${path}`, { cause: error });
  }
}
```

## Never

```ts
async function loadInvoices(customerId: string): Promise<Invoice[]> {
  try {
    return await api.invoices.list({ customerId });
  } catch (error) {
    console.error(error);
    return [];
  }
}
```
