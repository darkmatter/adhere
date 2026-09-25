# alchemy/data/migrations-use-direct-url

A migration runner must connect with the database's direct URL, never Hyperdrive's runtime connection string or an Accelerate or pooled URL.

1 finding, at 0.85. It showed this hint:

```ts
export default defineConfig({ dialect: "postgresql", dbCredentials: { url: process.env.DIRECT_DATABASE_URL! } });
```

The probability, where Jev pointed, and the code around it, the line marked `>`:

```text
0.85 packages/alchemy/src/Prisma/PrismaDevDatabase.ts:104:5
   92 │ export const prismaDevDatabaseAttrsFromServer = Effect.fn(function* (
   93 │   server: Server,
   94 │ ) {
   95 │   const direct = yield* normalizeConnectionString(
   96 │     server.database.prismaORMConnectionString ??
   97 │       server.database.connectionString,
   98 │   );
   99 │   const pooled = server.ppg.url;
  100 │   const details = yield* detailsFrom(direct);
  101 │   return {
  102 │     directConnectionString: Redacted.make(direct),
  103 │     pooledConnectionString: Redacted.make(pooled),
> 104 │     accelerateConnectionString: Redacted.make(pooled),
  105 │     host: details.host,
  106 │     user: details.user,
  107 │     password: details.password,
  108 │   };
  109 │ });
```
