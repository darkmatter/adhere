# alchemy/data/never-disable-tls-verification

A database client or migration config must verify the server's TLS certificate, or connect inside the private network, never setting rejectUnauthorized: false or sslmode=no-verify to make a connection work.

5 findings, from 0.96 down to 0.72. Each showed this hint:

```ts
const url = new URL(connection.connectionString);
url.searchParams.set("sslmode", "verify-full");
const db = yield* Drizzle.Postgres(url.toString());
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.96 packages/alchemy/src/Neon/Migrations.ts:58:11
  51 │ ): Effect.Effect<A, PgError | E, R> =>
  52 │   Effect.acquireUseRelease(
  53 │     Effect.tryPromise({
  54 │       try: async () => {
  55 │         const { Client } = await importPg();
  56 │         const client = new Client({
  57 │           connectionString: stripSslQueryParams(Redacted.value(connectionUri)),
> 58 │           ssl: { rejectUnauthorized: false },
  59 │         });
  60 │         await client.connect();
  61 │         return client;
  62 │       },
  63 │       catch: toPgError,
  64 │     }),
  65 │     use,
  66 │     (client) => Effect.promise(() => client.end().catch(() => {})),
  67 │   );

0.93 packages/alchemy/src/AWS/RDS/ConnectHttp.ts:177:15
  159 │           return {
  160 │             host,
  161 │             port: resolvedPort,
  162 │             database: options.database,
  163 │             username: options.username,
  164 │             password: Redacted.value(token),
  165 │             ssl,
  166 │             url: formatSqlConnectionUrl({
  167 │               scheme,
  168 │               host,
  169 │               port: resolvedPort,
  170 │               database: options.database,
  171 │               username: options.username,
  172 │               password: token,
  173 │               ssl,
  174 │               // RDS certificates chain to a private AWS CA that Node's
  175 │               // trust store doesn't carry — `no-verify` keeps TLS on
  176 │               // (mandatory for IAM auth) with libpq `require` semantics.
> 177 │               sslMode: "no-verify",
  178 │             }),
  179 │             refreshPassword: mintToken,
  180 │           };

0.88 packages/alchemy/src/SQL/PostgresTls.ts:44:3
  31 │ export const resolveSsl = (
  32 │   url: Redacted.Redacted<string>,
  33 │   ssl: PgSsl,
  34 │ ): PgSsl => {
  35 │   if (ssl !== undefined) return ssl;
  36 │   let parsed: URL;
  37 │   try {
  38 │     parsed = new URL(Redacted.value(url));
  39 │   } catch {
  40 │     // Let `@effect/sql-pg` report the malformed URL.
  41 │     return ssl;
  42 │   }
  43 │   const sslmode = parsed.searchParams.get("sslmode");
> 44 │   if (sslmode === "no-verify") return { rejectUnauthorized: false };
  45 │   return sslmode !== null && OPPORTUNISTIC_SSL_MODES.has(sslmode) ? true : ssl;
  46 │ };

0.85 packages/alchemy/src/Railway/Postgres.ts:641:3
  635 │ const listProxies = (environmentId: string, serviceId: string) =>
  636 │   railway.tcpProxies({ environmentId, serviceId }, proxySelection).pipe(
  637 │     Effect.map((items) => items.filter((proxy) => !isGoneProxy(proxy))),
  638 │     railway.catchTags(["RailwayNotFound"], () =>
  639 │       Effect.succeed([] as TcpProxiesResultItem[]),
  640 │     ),
> 641 │   );

0.72 packages/alchemy/src/AWS/DocDB/Connect.ts:212:7
  206 │   if (options.tls === true) {
  207 │     query.set("tls", "true");
  208 │     // DocumentDB certs chain to the private Amazon RDS CA — keep TLS on with
  209 │     // identity verification off unless the caller supplies the CA bundle
  210 │     // (see `mongo`'s `ca` option, which restores full verification).
  211 │     if (!query.has("tlsCAFile")) {
> 212 │       query.set("tlsAllowInvalidCertificates", "true");
  213 │     }
  214 │   }
```
