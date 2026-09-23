# errors/wrap-external-errors

An SDK call whose rejection passes through unwrapped breaks the rule; the same
call with its error wrapped in a tagged error with a `Schema.Defect` field
follows it.

```ts breaks
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Effect, Schedule } from "effect";
import type { UserId } from "./ids.ts";

const s3 = new S3Client({});

export const uploadAvatar = Effect.fn("uploadAvatar")(function* (
  userId: UserId,
  bytes: Uint8Array,
) {
  return yield* Effect.tryPromise(() =>
    s3.send(new PutObjectCommand({ Bucket: "avatars", Key: userId, Body: bytes })),
  ).pipe(Effect.timeout("10 seconds"), Effect.retry(Schedule.recurs(2)));
});
```

```ts follows
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Effect, Schedule, Schema } from "effect";
import type { UserId } from "./ids.ts";

const s3 = new S3Client({});

export class StorageError extends Schema.TaggedError<StorageError>()("StorageError", {
  key: Schema.String,
  error: Schema.Defect(),
}) {}

export const uploadAvatar = Effect.fn("uploadAvatar")(function* (
  userId: UserId,
  bytes: Uint8Array,
) {
  return yield* Effect.tryPromise({
    try: () => s3.send(new PutObjectCommand({ Bucket: "avatars", Key: userId, Body: bytes })),
    catch: (error) => new StorageError({ key: userId, error }),
  }).pipe(Effect.timeout("10 seconds"), Effect.retry(Schedule.recurs(2)));
});
```
