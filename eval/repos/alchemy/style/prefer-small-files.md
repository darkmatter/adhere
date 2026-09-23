# style/prefer-small-files

Prefer small focused files with one primary responsibility.

An example rule from `adhere init`, in the checkout's `.adhere/style/`, not a preset rule.

7 findings, from 0.84 down to 0.81. Each showed this hint:

```ts
export const parsePort = (value: string) =>
  Port.make(Number.parseInt(value, 10));
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.84 packages/alchemy/src/Util/Node.ts:15
     export const initialCwd: string = process.cwd();
0.83 packages/alchemy/src/AWS/MediaPackageV2/internal.ts:1
     import * as mediapackagev2 from "@distilled.cloud/aws/mediapackagev2";
0.82 packages/alchemy/src/AWS/IAM/common.ts:24
     export const toTagRecord = (
0.82 packages/alchemy/src/AWS/IdentityCenter/common.ts:1
     import * as identitystore from "@distilled.cloud/aws/identitystore";
0.81 packages/alchemy/src/Bundle/InstalledPackages.ts:1
     import * as Effect from "effect/Effect";
0.81 packages/alchemy/src/Nuke.ts:16
     // Account-wide teardown: enumerate everything the registered providers can see
0.81 packages/alchemy/src/Util/extraFiles.ts:204
     export const copyExtraFiles = Effect.fn(function* (
```
