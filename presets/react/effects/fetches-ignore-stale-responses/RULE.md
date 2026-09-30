---
description: An effect that requests data over the network must ignore or abort a response that arrives after its inputs changed or the component unmounted, such as with an `ignore` flag or an AbortController that its cleanup sets, never set state from every response in whatever order they arrive.
appliesTo: ["a React effect"]
---

## Must

```tsx
useEffect(() => {
  let ignore = false;
  fetchResults(query).then((results) => {
    if (!ignore) setResults(results);
  });
  return () => {
    ignore = true;
  };
}, [query]);
```

## Never

```tsx
useEffect(() => {
  fetchResults(query).then((results) => setResults(results));
}, [query]);
```
