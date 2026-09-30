---
description: State that says which item of a list is selected, or otherwise points into data held elsewhere, should hold the item's id and look the item up during render, and should not hold a copy of the item, which goes stale when the list changes.
appliesTo: ["a React component or hook"]
level: warning
---

## Should

```tsx
const [items, setItems] = useState(initialItems);
const [selectedId, setSelectedId] = useState(initialItems[0].id);
const selectedItem = items.find((item) => item.id === selectedId);
```

## Should not

```tsx
const [items, setItems] = useState(initialItems);
const [selectedItem, setSelectedItem] = useState(initialItems[0]);
```
