# Contributing

## Development

From a checkout, with Bun:

```sh
bun install
bun link          # puts `adhere` on PATH
adhere lint --preset effect
```

- In a checkout no platform package is installed, so `bin/adhere.js` runs
  `src/main.ts` with Bun instead. Type-aware audits use the checkout's own
  TypeScript; the default audit does not start it.
- `symbols` and `references` use TypeScript's SDK and native compiler, pinned to
  exactly the `typescript` version in `package.json`'s `devDependencies`. The
  two must match. That prerelease includes the tuple-reference serialization
  fix from [microsoft/TypeScript#64080](https://github.com/microsoft/TypeScript/issues/64080).
  Symbol and type queries are batched, with independent SDK requests chunked to
  at most 8.
- `bun run typecheck` runs `tsc` and the linter.
- `bun run test` runs the tests.
- `bun scripts/verify-npm.ts`, after `bun run build:npm`, installs the built
  packages in a scratch project and explicitly enables `typeAware: true` to
  check `symbols` and `references`. It needs Node 24 or later, and sends Jev nothing.

## Native executable

| Command             | What it builds                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run build`     | `dist/adhere`, a single binary with Bun and the presets inside it, through Bun's [`--compile`](https://bun.sh/docs/bundler/executables) with `--asset ./presets`. It runs without Bun or `node_modules` on the target machine and still loads the repo's `config.ts` and Markdown rules from disk. It has no TypeScript compiler, so it reads no `symbols` or `references`. |
| `bun run build:npm` | The same for every published platform, each into its package under `dist/npm/`, with a copy for the GitHub release in `dist/release/` ([`scripts/npm-packages.ts`](../scripts/npm-packages.ts)).                                                                                                                                                                            |

Each platform's executable is its own npm package,
`@drkmttr/adhere-<platform>-<arch>`, limited by `os` and `cpu`, and an optional
dependency of `@drkmttr/adhere`, so an install fetches only its own machine's.
Each depends on TypeScript's native compiler for its platform,
`@typescript/typescript-<platform>-<arch>`, at exactly the SDK's version: the
`typescript` version in `package.json`'s `devDependencies`. The package's
`bin/adhere.js` finds both, and runs the executable with Node. The same
executables are attached to each GitHub release, named for `uname -s` and
`uname -m` as in `adhere-Linux-x86_64`, with `LICENSE` and
`THIRD_PARTY_NOTICES.txt`, which go with any copy you redistribute.

`adhere --version` tells the builds apart:

| Build           | What it prints                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A release       | Its version, as `adhere v0.10.0`.                                                                                                                                        |
| `bun run build` | `git describe --tags --dirty` where it was built, as `adhere v0.10.0-16-g9a41328`: 16 commits after v0.10.0, at `9a41328`, ending in `-dirty` when the tree had changes. |
| From source     | The checkout's version, marked `(source)`.                                                                                                                               |

## Release

Releases are cut by CI from pushed version tags. From a clean, up-to-date
`main`, push the release tag:

```sh
git tag v0.3.0
git push origin v0.3.0
```

1. The tag push starts `.github/workflows/release.yaml`, which checks out
   `main`, derives `0.3.0` from `v0.3.0`, and runs
   `bun run release -- --ci 0.3.0`.
2. Release-it bumps `package.json`, commits `chore: release v0.3.0` back to
   `main`, skips npm publish, and creates the GitHub Release for the existing
   tag.
3. `release.yaml` then calls the reusable publish workflow,
   `.github/workflows/publish.yaml`, directly, avoiding a chained GitHub Release
   event created by `GITHUB_TOKEN`.
4. The publish workflow verifies that `package.json` matches the release tag,
   builds the platform packages, attaches their executables to the GitHub
   Release, and publishes each package before `@drkmttr/adhere`, which it first
   lists them in as `optionalDependencies` at the same version.

CI, and the publish workflow before it publishes, run `scripts/verify-npm.ts`
on Linux and on both Macs. Windows is built, but not run.

<details>
<summary>More on publishing</summary>

- Every publish is `npm publish --access public --provenance`.
- No npm token is used, so a new package has to be published once by hand before
  it can be given trusted publishers on npmjs.com.
- npm checks the workflow that started the run, so every package has two trusted
  publishers: `release.yaml`, which calls the publish workflow for tag releases,
  and `publish.yaml`, for manual runs.
- The publish workflow can be run manually for an already-created release tag if
  a publish needs to be retried. It skips every package whose version is already
  on npm, and replaces the executables on the release with ones it builds from
  `main`.
- The main package's `files` list keeps it to `bin/`, `src/`, `presets/`, and
  `skills/`.

</details>
