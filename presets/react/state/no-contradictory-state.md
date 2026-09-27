---
description: State that describes one thing's status, such as whether a request is being sent, was sent, or failed, should be a single state that holds one status at a time, and should not be separate booleans that can say contradictory things at once.
appliesTo: ["a React component or hook"]
---

## Should

```tsx
const [status, setStatus] = useState<"typing" | "sending" | "sent">("typing");
```

## Should not

```tsx
const [isSending, setIsSending] = useState(false);
const [isSent, setIsSent] = useState(false);
```
