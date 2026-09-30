---
description: A component must tell its parent about a change, through a callback prop such as `onChange`, in the event handler that makes the change, never from an effect that watches the component's own state.
appliesTo: ["a React component or hook"]
---

## Must

```tsx
function Toggle({ onChange }: { onChange: (isOn: boolean) => void }) {
  const [isOn, setIsOn] = useState(false);
  const toggle = () => {
    setIsOn(!isOn);
    onChange(!isOn);
  };
  return <button onClick={toggle}>{isOn ? "On" : "Off"}</button>;
}
```

## Never

```tsx
function Toggle({ onChange }: { onChange: (isOn: boolean) => void }) {
  const [isOn, setIsOn] = useState(false);
  useEffect(() => {
    onChange(isOn);
  }, [isOn, onChange]);
  return <button onClick={() => setIsOn(!isOn)}>{isOn ? "On" : "Off"}</button>;
}
```
