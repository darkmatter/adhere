---
description: An effect that subscribes to something, adds an event listener, starts a timer or an interval, or opens a connection must return a cleanup function that undoes it, never leave it running after the component unmounts or the effect runs again.
appliesTo: ["a React effect"]
---

## Must

```tsx
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);
```

## Never

```tsx
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener("resize", onResize);
}, []);
```
