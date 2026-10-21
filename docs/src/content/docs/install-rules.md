---
title: "Install rules from other repos"
---

An organization's rules can live in one repo's `.adhere/rules/`, and other repos
copy them in with `adhere install`:

```sh
adhere list darkmatter/standards                        # each rule there, with its description
adhere install darkmatter/standards                     # every rule
adhere install darkmatter/standards/data                # the data topic
adhere install darkmatter/standards/data/brand-ports    # one rule
adhere install darkmatter/standards#v3                  # every rule, as tagged v3
```

- Copies land in this repo's `.adhere/rules/org/repo/`, so `data/brand-ports`
  from darkmatter/standards lands in
  `.adhere/rules/darkmatter/standards/data/brand-ports/` as the rule
  `darkmatter/standards/data/brand-ports`, and two repos' rules never collide.
- The copies are the repo's own rules from then on: commit them, edit them, or
  start new rules from them. Nothing tracks where they came from.
- A later install skips a rule already there, just as init does. `--force`
  replaces its directory, edits and all.
- A rule's whole directory is copied. The source's config, its inline rules, and
  its cache are not.

> **Read what you install.** A `RULE.ts` is copied with the helpers beside it,
> and runs whenever lint does, in CI too. `adhere list` names a `RULE.ts`
> without its description, since reading the description would run the file.

The source is cloned with `git` from `https://github.com/org/repo.git`, so a
private repo needs git's credentials for GitHub, which `gh auth setup-git` sets
up. To clone over SSH instead, let git rewrite the URL:
`git config --global url.git@github.com:.insteadOf https://github.com/`.

## Creating a shared repo

`adhere init --shared org/repo` scaffolds a repo whose rules other repos copy in
with `adhere install`, instead of one that lints itself. It writes the two
example rules and no config, since install copies only rule files, and with
them:

- **`README.md`** says what the repo is for, how to install its rules, and how
  to add one.
- **`.github/workflows/adhere.yaml`** runs `adhere validate` on every push to
  main and every pull request, with the `TYPESAFE_API_KEY` secret. A pull
  request from a fork gets no secrets, so validate refuses there.
- **`alchemy.run.ts`** is an [alchemy](https://alchemy.run) stack that creates
  the GitHub repo, or adopts it, and sets that secret from `TYPESAFE_API_KEY`
  when deployed with `npx alchemy deploy`.
- **`package.json`** pins alchemy and effect, which init installs, to versions
  that work together.
- **`.gitignore`** keeps the installed packages and alchemy's state out of git.

The repo is public unless you answer yes when init asks, at a terminal, whether
to make it private. Other repos then need git's credentials for it to list and
install its rules. Without a terminal it is public: change `visibility` in the
stack to make it private.
