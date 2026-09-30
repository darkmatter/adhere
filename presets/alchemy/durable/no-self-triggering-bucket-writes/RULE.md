---
description: A bucket-event handler that writes back into the bucket it listens to should filter its subscription by prefix or suffix so its own writes do not match, and should not subscribe to every object created in that bucket.
---

## Should

```ts
yield* AWS.S3.consumeBucketEvents(bucket, { events: ["s3:ObjectCreated:*"], prefix: "incoming/" }, (stream) =>
  stream.pipe(Stream.runForEach((event) => putObject({ Key: `processed/${event.key}`, Body: "..." }))),
);
```

## Should not

```ts
yield* AWS.S3.consumeBucketEvents(bucket, { events: ["s3:ObjectCreated:*"] }, (stream) =>
  stream.pipe(Stream.runForEach((event) => putObject({ Key: `processed/${event.key}`, Body: "..." }))), // triggers itself
);
```
