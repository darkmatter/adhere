<div align="center">
<h1>adhere</h1>
  <br/>
  <sup>A linter for non-deterministic rules. Powered by TypeSafe AI.</sup><br><br/>
  <a href="https://dm.sh/adhere/"><img src="https://img.shields.io/website?url=https%3A%2F%2Fdm.sh%2Fadhere%2Fgetting-started%2F&up_message=healthy&logo=readme&logoColor=%23dddddd&label=docs&labelColor=%23000000" /></a>
  &nbsp;
  <img src="https://img.shields.io/npm/dm/%40drkmttr%2Fadhere?style=flat&logo=github&labelColor=%23181926&color=%23000000" />
  &nbsp;
  <a href="https://www.npmjs.com/package/@drkmttr/adhere"><img src="https://img.shields.io/npm/v/%40drkmttr%2Fadhere" /></a>
</div>

<br />

A linter for rules a normal linter cannot check, such as "business logic should
live in services" or "modules should expose lots of functionality behind a
small API". You can write a rule as a Markdown file, with code that shows it:

````md
---
description: A third-party API going offline should not also take our app down.
---

Our APIs should not depend on a third-party API on a critical path. The
user-facing side should be unaffected if it goes offline, and ingestion should
happen in a separate, asynchronous process.

## Should

```ts
// GET /api/restaurants/:zipCode reads only our own database.
export async function findRestaurants(zipCode: string) {
  return db.restaurants.find({ where: { zipCode } });
}
```

## Should not

```ts
// When Google Maps is down, slow, or over quota, so is this endpoint.
export async function findRestaurants(zipCode: string) {
  return googleMaps.findAll({ where: { zipCode } });
}
```
````

adhere asks [Jev](https://typesafe.ai), TypeSafe AI's System One model, whether
each file breaks each rule. Jev answers with a calibrated probability. adhere
reports each rule whose probability is above a threshold, and shows the part of
the file Jev points at. The report looks like Oxlint's:

![adhere lint demo](https://github.com/darkmatter/adhere/raw/main/eval/demo.gif)

Rules a normal linter can check exactly, such as a banned import or a type
error, belong in that linter.
[`adhere validate`](https://dm.sh/adhere/validating-rules/) lists the rules Jev
thinks a linter could check, and finds rules that contradict each other.

## Get started

```sh
curl -fsSL https://github.com/darkmatter/adhere/raw/main/scripts/install.sh | sh
adhere login                           # save your TypeSafe AI API key
adhere lint --preset typescript,react  # try the built-in presets on your code
adhere init                            # scaffold .adhere/config.ts and two example rules
adhere rules create                    # write a rule with a coding agent: claude, codex, or omp
```

The script installs to `~/.local/bin`. If your shell can't find `adhere`
afterwards, add that directory to your `PATH`. `adhere lint` estimates what
judging will cost. When stdin and stdout are terminals, it asks before it sends
anything; otherwise, or with `--yes`, it sends without asking. The package is
`@drkmttr/adhere`: `adhere` on npm is an unrelated package.

## Docs

- **Start:** [Introduction](https://dm.sh/adhere/), [Install](https://dm.sh/adhere/install/), [Getting started](https://dm.sh/adhere/getting-started/)
- **Rules:** <a id="rules-as-markdown-files"></a>[Rule format](https://dm.sh/adhere/rule-format/), <a id="rule-writing-tips"></a>[Writing good rules](https://dm.sh/adhere/writing-good-rules/), [Generate rules from your repo](https://dm.sh/adhere/generate-rules/), [Install rules from other repos](https://dm.sh/adhere/install-rules/), [Presets](https://dm.sh/adhere/presets/)
- **Usage:** [Reading the report](https://dm.sh/adhere/reading-the-report/), [Config](https://dm.sh/adhere/config/), [Running lint](https://dm.sh/adhere/running-lint/)
- **Validate & improve rules:** [Validating rules](https://dm.sh/adhere/validating-rules/), [Live evals](https://dm.sh/adhere/live-evals/)
- **Advanced features:** [State Hooks and Type-Awareness](https://dm.sh/adhere/state-hooks/), [Providers](https://dm.sh/adhere/providers/), [Comments and suppressions](https://dm.sh/adhere/comments-and-suppressions/)
- [Agent skills](https://dm.sh/adhere/agent-skills/)
- **Reference:** [Commands](https://dm.sh/adhere/reference/commands/), [Config file](https://dm.sh/adhere/reference/config-file/), [Cache](https://dm.sh/adhere/cache/), [How a file is judged](https://dm.sh/adhere/how-a-file-is-judged/)
- [Compose your AGENTS.md](https://dm.sh/adhere/compose-agents-md/)

## Contributing and license

MIT. See [LICENSE](LICENSE). The executables attached to each GitHub release
come with `LICENSE` and `THIRD_PARTY_NOTICES.txt`, which go with any copy you
redistribute. To build, test, or release adhere from a checkout, see
[CONTRIBUTING.md](.github/CONTRIBUTING.md).
