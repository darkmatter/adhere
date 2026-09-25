# alchemy/providers/diff-guards-unresolved-props

A custom provider's diff must check isResolved(news) and return undefined before comparing props that may still be unresolved Outputs, never comparing them directly.

8 findings, from 0.83 down to 0.72. Each showed this hint:

```ts
diff: Effect.fn(function* ({ news, olds }) {
  if (!isResolved(news)) return undefined;
  if (news.region !== olds.region) return { action: "replace" } as const;
}),
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.83 packages/alchemy/src/Cloudflare/DNS/Record.ts:301:9
  297 │     diff: Effect.fn(function* ({ olds = {}, news }) {
  298 │       const o = olds as RecordProps;
  299 │       const n = news as RecordProps;
  300 │       if (o.type !== undefined && o.type !== n.type) {
> 301 │         return { action: "replace" } as const;
  302 │       }
  303 │       if (o.name !== undefined && o.name !== n.name) {
  304 │         return { action: "replace" } as const;
  305 │       }
  306 │       // zoneId is Input<string>; by reconcile time both sides are
  307 │       // concrete strings.
  308 │       if (
  309 │         typeof o.zoneId === "string" &&
  310 │         typeof n.zoneId === "string" &&
  311 │         o.zoneId !== n.zoneId
  312 │       ) {
  313 │         return { action: "replace" } as const;
  314 │       }
  315 │     }),

0.77 packages/alchemy/src/Cloudflare/Gateway/Rule.ts:304:13
  302 │         diff: Effect.fn(function* ({ olds = {}, news }) {
  303 │           if ((olds as RuleProps).action !== undefined) {
> 304 │             if ((olds as RuleProps).action !== (news as RuleProps).action) {
  305 │               return { action: "replace" } as const;
  306 │             }
  307 │           }
  308 │         }),

0.74 packages/alchemy/src/AWS/ImageBuilder/Component.ts:227:11
  215 │         diff: Effect.fn(function* ({ olds, news }) {
  216 │           const immutableKeys = [
  217 │             "componentName",
  218 │             "semanticVersion",
  219 │             "platform",
  220 │             "data",
  221 │             "uri",
  222 │             "description",
  223 │             "changeDescription",
  224 │             "supportedOsVersions",
  225 │             "kmsKeyId",
  226 │           ] as const;
> 227 │           if (immutableVersionKeysChanged(olds, news, immutableKeys)) {
  228 │             return { action: "replace" } as const;
  229 │           }
  230 │         }),

0.74 packages/alchemy/src/Cloudflare/Alerting/NotificationPolicy.ts:209:7
  198 │     diff: Effect.fn(function* ({ olds = {}, news, output }) {
  199 │       const { accountId } = yield* yield* CloudflareEnvironment;
  200 │       if ((output?.accountId ?? accountId) !== accountId) {
  201 │         return { action: "replace" } as const;
  202 │       }
  203 │       // The valid filter/mechanism shape depends on the alert type — a
  204 │       // policy alerting on a different event is a different policy.
  205 │       // `alertType` is a plain string prop, statically knowable here.
  206 │       const o = olds as NotificationPolicyProps;
  207 │       const n = news as NotificationPolicyProps;
  208 │       const oldAlertType = output?.alertType ?? o.alertType;
> 209 │       if (oldAlertType !== undefined && oldAlertType !== n.alertType) {
  210 │         return { action: "replace" } as const;
  211 │       }
  212 │     }),

0.73 packages/alchemy/src/Cloudflare/Speed/TestSchedule.ts:241:7
  231 │     diff: Effect.fn(function* ({ olds, news }) {
  232 │       const o = olds as TestScheduleProps | undefined;
  233 │       const n = news as TestScheduleProps;
  234 │       // No prior props to compare against — let the engine decide.
  235 │       if (o?.url === undefined) return undefined;
  236 │       // The URL is the schedule's path identity.
  237 │       if (normalizeUrl(o.url) !== normalizeUrl(n.url)) {
  238 │         return { action: "replace" } as const;
  239 │       }
  240 │       // Schedules are keyed per region — a region change is a new schedule.
> 241 │       if ((o.region ?? DEFAULT_REGION) !== (n.region ?? DEFAULT_REGION)) {
  242 │         return { action: "replace" } as const;
  243 │       }
  244 │       // zoneId is Input<string>; compare only once both are concrete.
  245 │       if (
  246 │         typeof o.zoneId === "string" &&
  247 │         typeof n.zoneId === "string" &&
  248 │         o.zoneId !== n.zoneId
  249 │       ) {
  250 │         return { action: "replace" } as const;
  251 │       }
  252 │       // frequency converges in place (reconcile deletes + re-creates).
  253 │       return undefined;
  254 │     }),

0.72 packages/alchemy/src/Cloudflare/CustomHostname/CustomHostname.ts:326:7
  323 │     diff: Effect.fn(function* ({ olds = {}, news }) {
  324 │       const o = olds as Props;
  325 │       const n = news as Props;
> 326 │       if (o.hostname !== undefined && o.hostname !== n.hostname) {
  327 │         return { action: "replace" } as const;
  328 │       }
  329 │       // zoneId is Input<string>; compare only once both sides are
  330 │       // concrete strings.
  331 │       if (
  332 │         typeof o.zoneId === "string" &&
  333 │         typeof n.zoneId === "string" &&
  334 │         o.zoneId !== n.zoneId
  335 │       ) {
  336 │         return { action: "replace" } as const;
  337 │       }
  338 │     }),

0.72 packages/alchemy/src/Cloudflare/Healthcheck/Healthcheck.ts:321:9
  311 │     diff: Effect.fn(function* ({ olds = {}, news }) {
  312 │       const o = olds as Props;
  313 │       const n = news as Props;
  314 │       // zoneId is Input<string>; by diff time both sides are concrete
  315 │       // strings when statically known.
  316 │       if (
  317 │         typeof o.zoneId === "string" &&
  318 │         typeof n.zoneId === "string" &&
  319 │         o.zoneId !== n.zoneId
  320 │       ) {
> 321 │         return { action: "replace" } as const;
  322 │       }
  323 │     }),

0.72 packages/alchemy/src/Neon/OrganizationVPCEndpoint.ts:141:7
  125 │     diff: Effect.fn(function* ({ olds, news, output }) {
  126 │       const previous = output ?? olds;
  127 │       if (
  128 │         !("orgId" in news) ||
  129 │         !("regionId" in news) ||
  130 │         !("vpcEndpointId" in news)
  131 │       ) {
  132 │         return { action: "replace", deleteFirst: true } as const;
  133 │       }
  134 │       for (const key of ["orgId", "regionId", "vpcEndpointId"] as const) {
  135 │         if (!isResolved(news[key]) || news[key] !== previous[key]) {
  136 │           return { action: "replace", deleteFirst: true } as const;
  137 │         }
  138 │       }
  139 │       if (!isResolved<OrganizationVPCEndpointProps>(news)) return;
  140 │       yield* validateOrganizationVPCEndpoint(news);
> 141 │       if ((yield* observe(news))?.label !== news.label) {
  142 │         return { action: "update" } as const;
  143 │       }
  144 │     }),
```
