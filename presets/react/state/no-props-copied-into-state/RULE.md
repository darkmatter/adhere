---
description: A component must read a prop, or compute from it, during render, never copy it into state, where the copy stops following the prop when the parent passes a new value.
appliesTo: ["a React component or hook"]
excludeIf: ["a prop meant only as the starting value and named for that, such as initialColor or defaultValue"]
---

## Must

```tsx
function Message({ messageColor }: { messageColor: string }) {
  const color = messageColor;
  return <p style={{ color }}>Hello</p>;
}
```

## Never

```tsx
function Message({ messageColor }: { messageColor: string }) {
  const [color, setColor] = useState(messageColor);
  return <p style={{ color }}>Hello</p>;
}
```
