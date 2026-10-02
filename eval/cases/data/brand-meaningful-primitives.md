# data/brand-meaningful-primitives

A record whose id, email, count, and URL are bare strings and numbers breaks
the rule. Branded fields follow it, next to a free-text message left a string.

```ts breaks
import { Schema } from "effect";

export class Order extends Schema.Class<Order>("Order")({
  id: Schema.String,
  customerEmail: Schema.String,
  itemCount: Schema.Number,
  trackingUrl: Schema.String,
}) {}
```

```ts follows
import { Schema } from "effect";
import { Email, TrackingUrl } from "./primitives.ts";

export const OrderId = Schema.String.pipe(Schema.brand("OrderId"));
export type OrderId = typeof OrderId.Type;

export const ItemCount = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(0)),
  Schema.brand("ItemCount"),
);
export type ItemCount = typeof ItemCount.Type;

export class Order extends Schema.Class<Order>("Order")({
  id: OrderId,
  customerEmail: Email,
  itemCount: ItemCount,
  trackingUrl: TrackingUrl,
  giftMessage: Schema.String,
}) {}
```

A schema that mirrors a provider's payload until it is mapped is not a domain
type, and neither are a view's props.

```ts follows
import { Schema } from "effect";
import { IssueId, type Issue } from "./domain.ts";

const IssuePayload = Schema.Struct({
  id: Schema.Number,
  html_url: Schema.String,
  title: Schema.String,
});

export const toIssue = (payload: typeof IssuePayload.Type): Issue => ({
  id: IssueId.make(String(payload.id)),
  title: payload.title,
});

export const decodeIssue = Schema.decodeUnknownEffect(IssuePayload);
```

```ts follows
import type { Issue } from "./domain.ts";

export interface IssueRowProps {
  readonly title: string;
  readonly href: string;
  readonly commentCount: number;
}

export const rowOf = (issue: Issue): IssueRowProps => ({
  title: issue.title,
  href: `/issues/${issue.id}`,
  commentCount: issue.comments.length,
});
```

An event a module emits is a domain type, whatever else its file holds.

```ts breaks
import { Schema } from "effect";

export class JobClaimed extends Schema.TaggedClass<JobClaimed>("JobClaimed")("JobClaimed", {
  jobId: Schema.String,
  threadId: Schema.String,
  claimedAt: Schema.DateTimeUtc,
}) {}
```
