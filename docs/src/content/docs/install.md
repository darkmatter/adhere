---
title: "Install"
---

Install the standalone executable. It needs no Node or Bun, and runs in any
directory, inside a repo or not:

```sh
curl -fsSL https://github.com/darkmatter/adhere/raw/main/scripts/install.sh | sh
```

To pin adhere's version in a repo, so the team and CI run the same one, add it
as a dev dependency and run it from the package:

```sh
bun add -d @drkmttr/adhere
bun run adhere lint
```

With npm or pnpm, add it the same way and run `npm exec adhere` or
`pnpm exec adhere`. The package is `@drkmttr/adhere`: `adhere` on npm is an
unrelated package.

- The package includes the TypeScript compiler that
  [type awareness](/adhere/state-hooks/#what-jev-reads) needs. The standalone executable does not,
  so it runs every audit except type-aware ones.
- The [install script](https://github.com/darkmatter/adhere/blob/main/scripts/install.sh) puts this machine's executable from
  the [latest release](https://github.com/darkmatter/adhere/releases/latest) in
  `~/.local/bin`. Run it again to update. The executable is built for macOS and
  Linux, on arm64 and x64, and for Windows x64: download
  `adhere-Windows-x86_64.exe` from the release.
- adhere sends each file it judges to Jev at `api.typesafe.ai`, with what it
  [reads](/adhere/state-hooks/#what-jev-reads) beside it, authenticated with a TypeSafe AI API
  key.

## Login

```sh
adhere login             # prompts for the key, masking what you type
adhere login < key.txt   # reads it from stdin instead
adhere logout            # deletes the saved key
adhere login --openai    # saves an OpenAI API key, for the openai provider
adhere logout --openai   # deletes it, and only it
```

- The key is saved to `~/.config/adhere/credentials.json`, or under
  `$XDG_CONFIG_HOME` when that is set, readable only by you. An OpenAI key is
  saved beside the TypeSafe AI one, for a config whose provider is
  `openai()`; see [Providers](/adhere/providers/).
- `TYPESAFE_API_KEY`, when set, takes precedence over the saved key, so CI can
  pass a key without a login. `OPENAI_API_KEY` does the same for the saved
  OpenAI key.
- The key is read only when a request is about to be sent. A run that the
  cache answers in full needs no key and no network.
