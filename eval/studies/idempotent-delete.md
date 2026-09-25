# Idempotent deletes on alchemy

**Question.** adhere 0.9.5 reported 20 findings on alchemy under
`alchemy/providers/idempotent-delete`, which says a custom provider's delete
must treat a resource that is already gone as success. Only one was real.
Would Jev do better with the file's comments taken out, or with the rule
scoped to a provider's delete handler?

**Verdicts.** Whether each delete fails when its resource is already gone was
checked on 2026-09-25 by calling the API with a name no resource had, with the
AWS CLI and with distilled, alchemy's AWS client:

| file                                 | delete                                     | when the resource is gone                                      | verdict |
| ------------------------------------ | ------------------------------------------ | -------------------------------------------------------------- | ------- |
| `AWS/AutoScaling/ScalingPolicy.ts`   | `deletePolicy`                             | `ValidationError: Policy … not found`, also on a second delete | real    |
| `AWS/AutoScaling/ScheduledAction.ts` | `deleteScheduledAction`                    | `ValidationError: Scheduled action name not found`             | real    |
| `AWS/AutoScaling/LifecycleHook.ts`   | `deleteLifecycleHook`                      | `ValidationError: No Lifecycle Hook found …`                   | real    |
| `AWS/CloudWatch/Alarm.ts`            | `deleteAlarms`                             | succeeds, though distilled types it `ResourceNotFound`         | false   |
| `AWS/CloudWatch/CompositeAlarm.ts`   | `deleteAlarms`                             | succeeds                                                       | false   |
| `AWS/CloudWatch/AlarmMuteRule.ts`    | `deleteAlarmMuteRule`                      | succeeds, as AWS documents                                     | false   |
| `AWS/StepFunctions/Activity.ts`      | `deleteActivity`                           | succeeds                                                       | false   |
| `ACME/Certificate.ts`                | `revokeCertificate`                        | `ACME/Client.ts` treats "already revoked" as success           | false   |
| ten more                             | runtime bindings, clients, a local gateway | not a provider's delete, so out of the rule's scope            | false   |

The three AutoScaling cases ran against an Auto Scaling group created with no
capacity for the purpose and deleted after. ScheduledAction and LifecycleHook
were not reported: both carry a comment saying a missing resource returns
success, which AWS contradicts. IoT FleetWise's `deleteFleet` is left out: the
account could not call it. The three findings in test helpers are left out too,
since adhere no longer judges tests against rules that are not about them.

**Setup.** jev-1.13.0, 2026-09-25. The files adhere reads in an alchemy
checkout at `8a284d0`, outside tests, that mention delete and fit Jev's
context: 1,930 of them, which include the 17 reported files outside tests and
both missed ones. Four arms, each one question per file: the preset's rule, and
the rule scoped to its subject, each with the file's comments kept and taken
out. The scoped rule's description:

> The delete handler of a resource provider, the `delete:` lifecycle method
> given the resource's `output`, must treat a resource that is already gone as
> success, catching the not-found error, never failing when it runs again.
> Code outside a provider's delete handler, such as a runtime binding, a
> Worker route, or a storage client, is not in scope.

```sh
bun eval/studies/idempotent-delete.ts <alchemy checkout> results.json
```

The four arms cost $1.26 at $0.042 per million input tokens.

## Results

The 33 files either rule flagged above 0.8 without comments, and nothing
labeled yet, were checked the same way, Cloudflare's through its API: each is a
provider delete, and 32 of them carry a comment saying a missing resource
returns success. Six fail anyway: EC2's `deleteFlowLogs`, Entity Resolution's
four deletes, and X-Ray's `deleteResourcePolicy`. IoT FleetWise's three could
not be called and stay unlabeled. With them, 9 deletes are labeled real and 42
false:

| arm                 | real above 0.8 | false above 0.8 | real among labeled above 0.8 | all above 0.7 | all above 0.8 | all above 0.9 |
| ------------------- | -------------- | --------------- | ---------------------------- | ------------- | ------------- | ------------- |
| preset              | 1 of 9         | 6 of 42         | 14%                          | 18            | 7             | 0             |
| preset, no comments | 9 of 9         | 39 of 42        | 19%                          | 66            | 51            | 18            |
| scoped              | 1 of 9         | 3 of 42         | 25%                          | 11            | 4             | 0             |
| scoped, no comments | 9 of 9         | 31 of 42        | 23%                          | 53            | 43            | 21            |

The labels were found through the arms without comments, so recall is measured
on deletes they flagged. Above 0.8, the arms with comments flagged no unlabeled
file, and those without flagged only FleetWise's three.

## What we learned

- **Scoping keeps the rule on its subject.** The ten findings outside
  providers, bindings and clients that merely delete, fell from 0.67 to 0.88
  to 0.08 to 0.21, and nothing real was lost.
- **Jev believes comments.** Eight of the nine real deletes carry a comment
  saying a missing resource returns success, and with it Jev scored them 0.31
  to 0.62. Without it, all nine scored 0.81 or more.
- **Comments were right more often than wrong.** Of the 35 claims checked, 27
  held, 8 did not. A delete whose comment is right reads the same without it
  as one whose comment is wrong, so taking comments out flagged both: about
  the same share of flags real, 23% against 25%, with every known real delete
  among them.
- **What the rule needs is not in the file.** Whether an API fails on a missing
  resource is a fact about the API. A comment is the only place a file states
  it, and Jev cannot check the claim, so it trusts it or, without it, flags
  every delete that catches nothing.
