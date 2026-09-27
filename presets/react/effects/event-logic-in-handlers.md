---
description: Code that runs because the user did something, such as submitting a form, clicking a button, or choosing an option, must run in that event's handler, never in an effect that watches state the handler set. An effect is for keeping a component in sync with something outside React while it is shown.
appliesTo: ["a React component or hook"]
---

## Must

```tsx
function CheckoutForm({ cart }: { cart: Cart }) {
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await placeOrder(cart);
    showToast("Order placed");
  };
  return <form onSubmit={handleSubmit}>{/* fields */}</form>;
}
```

## Never

```tsx
function CheckoutForm({ cart }: { cart: Cart }) {
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (submitted) placeOrder(cart).then(() => showToast("Order placed"));
  }, [submitted, cart]);
  return <form onSubmit={() => setSubmitted(true)}>{/* fields */}</form>;
}
```
