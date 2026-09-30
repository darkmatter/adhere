---
description: A Server Component must pass a Client Component only the fields it shows, never a whole database record, a secret, a token, or other data the user must not see, since every prop passed to a Client Component is sent to the browser.
appliesTo: ["a React Server Component"]
level: warning
---

## Must

```tsx
export default async function ProfilePage({ params }: { params: { id: string } }) {
  const user = await db.user.findUniqueOrThrow({ where: { id: params.id } });
  return <ProfileCard name={user.name} avatarUrl={user.avatarUrl} />;
}
```

## Never

```tsx
export default async function ProfilePage({ params }: { params: { id: string } }) {
  const user = await db.user.findUniqueOrThrow({ where: { id: params.id } });
  return <ProfileCard user={user} />;
}
```
