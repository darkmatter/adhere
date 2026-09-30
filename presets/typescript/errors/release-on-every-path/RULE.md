---
description: A resource the code acquires and must give back, such as a file handle, a lock, a database connection or transaction, a temporary file, or a child process, must be released on every path, including when an error is thrown between acquiring and releasing it, with `finally` or `using`; it must never be released only after the work succeeds. A resource whose owner releases it, such as a framework or a pool's query method, is out of scope.
---

## Must

```ts
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, from]);
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}
```

## Never

```ts
const client = await pool.connect();
await client.query("BEGIN");
await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, from]);
await client.query("COMMIT");
client.release();
```
