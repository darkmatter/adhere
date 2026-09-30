---
description: A Server Function, one marked `"use server"`, is an endpoint any client can call with any arguments, so it must check that the caller is signed in and allowed to do what it does, and validate its arguments at runtime; it must never trust that only the app's own UI calls it.
appliesTo: ["a Server Function, marked \"use server\""]
---

## Must

```ts
"use server";

export async function deletePost(input: unknown) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  const { postId } = DeletePostInput.parse(input);
  const post = await db.post.findUnique({ where: { id: postId } });
  if (post?.authorId !== session.userId) throw new Error("Not allowed");
  await db.post.delete({ where: { id: postId } });
}
```

## Never

```ts
"use server";

export async function deletePost(postId: string) {
  await db.post.delete({ where: { id: postId } });
}
```
