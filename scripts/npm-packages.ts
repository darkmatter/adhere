/**
 * The npm packages that carry the compiled executable, one per platform. Each
 * is an optional dependency of `@drkmttr/adhere` limited by `os` and `cpu`, so
 * an install fetches only its own machine's, and `bin/adhere.js` runs it. The
 * publish job also attaches each executable to the GitHub release, from which
 * adhere installs without Node.
 *
 *   bun scripts/npm-packages.ts build   compile every platform into dist/npm/, with a copy in dist/release/
 *   bun scripts/npm-packages.ts pin     list them in package.json at its version
 *
 * Only the publish job runs `pin`. The committed package.json leaves them out
 * because a version is not on npm until that job has published it.
 */
import packageJson from "../package.json";
import { $ } from "bun";
import { copyFile, mkdir, rm } from "node:fs/promises";

process.chdir(new URL("../", import.meta.url).pathname);

/**
 * `os` and `cpu` are Node's `process.platform` and `process.arch`, which the
 * launcher names the package from. `release` names the copy on the GitHub
 * release as `uname -s` and `uname -m` print the platform, so a shell fetches
 * its own as `adhere-$(uname -s)-$(uname -m)`. Windows, with no `uname`, is
 * named to match.
 */
const platforms = [
  { os: "darwin", cpu: "arm64", target: "bun-darwin-arm64", release: "adhere-Darwin-arm64" },
  { os: "darwin", cpu: "x64", target: "bun-darwin-x64", release: "adhere-Darwin-x86_64" },
  { os: "linux", cpu: "arm64", target: "bun-linux-arm64", release: "adhere-Linux-aarch64" },
  { os: "linux", cpu: "x64", target: "bun-linux-x64", release: "adhere-Linux-x86_64" },
  { os: "win32", cpu: "x64", target: "bun-windows-x64", release: "adhere-Windows-x86_64.exe" },
] as const;

type Platform = (typeof platforms)[number];

const packageName = ({ os, cpu }: Platform) => `${packageJson.name}-${os}-${cpu}`;

const writeJson = (path: string, value: unknown) =>
  Bun.write(path, `${JSON.stringify(value, null, 2)}\n`);

const build = async () => {
  await mkdir("dist/release", { recursive: true });
  for (const platform of platforms) {
    const directory = `dist/npm/${platform.os}-${platform.cpu}`;
    const executable = platform.os === "win32" ? "adhere.exe" : "adhere";
    await rm(directory, { recursive: true, force: true });
    await $`bun build --compile --minify --sourcemap --target=${platform.target} src/main.ts --asset ./presets --outfile ${directory}/bin/${executable}`;
    // The executable is a copy of the software, so it carries the license.
    await copyFile("LICENSE", `${directory}/LICENSE`);
    await copyFile(`${directory}/bin/${executable}`, `dist/release/${platform.release}`);
    await writeJson(`${directory}/package.json`, {
      name: packageName(platform),
      version: packageJson.version,
      description: `The adhere executable for ${platform.os}-${platform.cpu}. Install ${packageJson.name}, which depends on it.`,
      license: packageJson.license,
      repository: packageJson.repository,
      os: [platform.os],
      cpu: [platform.cpu],
      files: [`bin/${executable}`],
      preferUnplugged: true,
      publishConfig: packageJson.publishConfig,
    });
  }
};

const pin = () =>
  writeJson("package.json", {
    ...packageJson,
    optionalDependencies: Object.fromEntries(
      platforms.map((platform) => [packageName(platform), packageJson.version]),
    ),
  });

const command = Bun.argv[2];
if (command === "build") await build();
else if (command === "pin") await pin();
else {
  console.error("usage: bun scripts/npm-packages.ts build|pin");
  process.exit(2);
}
