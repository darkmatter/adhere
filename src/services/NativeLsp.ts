import { Schema } from "effect";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { pathToFileURL } from "node:url";
import type { API, Snapshot } from "typescript/async";

const Message = Schema.Struct({
  id: Schema.optionalKey(Schema.Union([Schema.Number, Schema.String, Schema.Null])),
  method: Schema.optionalKey(Schema.String),
  params: Schema.optionalKey(Schema.Unknown),
  result: Schema.optionalKey(Schema.Unknown),
  error: Schema.optionalKey(Schema.Struct({ message: Schema.String })),
});
const decodeMessage = Schema.decodeUnknownSync(Schema.fromJsonString(Message));
const Initialize = Schema.Struct({
  capabilities: Schema.Struct({
    positionEncoding: Schema.optionalKey(Schema.String),
    documentSymbolProvider: Schema.Unknown,
  }),
  serverInfo: Schema.Struct({ version: Schema.String }),
});
const Session = Schema.Struct({ pipe: Schema.String });

interface Pending {
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

/** One native LSP process; its SDK API session connects to a pipe, never another compiler. */
export class NativeLsp {
  private readonly process: ChildProcessWithoutNullStreams;
  private readonly exited: Promise<void>;
  private readonly pending = new Map<number, Pending>();
  private readonly sdkPending = new Set<(error: unknown) => void>();
  private document: string | undefined;
  private input = Buffer.alloc(0);
  private stderr = "";
  private nextId = 0;
  private failure: Error | undefined;
  private attached: API<true> | undefined;
  private closing: Promise<void> | undefined;

  private constructor(executable: string, root: string) {
    this.process = spawn(executable, ["--lsp", "--stdio"], { cwd: root, stdio: "pipe" });
    this.exited = new Promise((resolve) => {
      this.process.once("error", (error) => this.fail(error));
      this.process.once("exit", (code, signal) =>
        this.fail(new Error(`Native TypeScript LSP exited (${signal ?? code}). ${this.stderr}`)),
      );
      this.process.once("close", (code, signal) => {
        this.fail(new Error(`Native TypeScript LSP closed (${signal ?? code}). ${this.stderr}`));
        resolve();
      });
    });
    for (const stream of [this.process.stdin, this.process.stdout, this.process.stderr])
      stream.on("error", (error: Error) => this.fail(error));
    this.process.stderr.on("data", (data: Buffer) => {
      this.stderr = (this.stderr + data.toString("utf8")).slice(-4096);
    });
    this.process.stdout.on("data", (data: Buffer) => {
      try {
        this.input = Buffer.concat([this.input, data]);
        for (;;) {
          const end = this.input.indexOf("\r\n\r\n");
          if (end < 0) break;
          const length = /^Content-Length:\s*(\d+)$/im.exec(
            this.input.subarray(0, end).toString("ascii"),
          );
          if (!length) throw new Error("Native TypeScript LSP sent an invalid frame header.");
          const last = end + 4 + Number(length[1]);
          if (this.input.length < last) break;
          const message = decodeMessage(this.input.subarray(end + 4, last).toString("utf8"));
          this.input = this.input.subarray(last);
          if (message.method !== undefined) {
            if (message.id !== undefined && message.id !== null) {
              const items = (message.params as { readonly items?: unknown[] } | undefined)?.items;
              const response =
                message.method === "workspace/configuration" && Array.isArray(items)
                  ? { result: items.map(() => null) }
                  : {
                      error: {
                        code: -32601,
                        message: `Unsupported client request: ${message.method}`,
                      },
                    };
              void this.write({ id: message.id, ...response }).catch((error: Error) =>
                this.fail(error),
              );
            }
            continue;
          }
          if (typeof message.id !== "number") continue;
          const pending = this.pending.get(message.id);
          if (!pending) continue;
          this.pending.delete(message.id);
          clearTimeout(pending.timer);
          if (message.error) pending.reject(new Error(message.error.message));
          else pending.resolve(message.result);
        }
      } catch (cause) {
        this.fail(cause instanceof Error ? cause : new Error(String(cause)));
        this.process.kill();
      }
    });
  }

  static async open(executable: string, root: string, version: string): Promise<NativeLsp> {
    const connection = new NativeLsp(executable, root);
    try {
      const initialized = Schema.decodeUnknownSync(Initialize)(
        await connection.request("initialize", {
          processId: process.pid,
          rootUri: pathToFileURL(root).href,
          capabilities: {
            general: { positionEncodings: ["utf-16"] },
            textDocument: { documentSymbol: { hierarchicalDocumentSymbolSupport: true } },
          },
          clientInfo: { name: "adhere" },
        }),
      );
      if (
        initialized.serverInfo.version !== version ||
        initialized.capabilities.positionEncoding !== "utf-16" ||
        !initialized.capabilities.documentSymbolProvider
      )
        throw new Error(`Native TypeScript ${version} with UTF-16 document symbols is required.`);
      await connection.notify("initialized", {});
      const session = Schema.decodeUnknownSync(Session)(
        await connection.request("custom/initializeAPISession", {}),
      );
      const { API } = await import("typescript/async");
      await connection.sdk("API attachment", async () => {
        const attached = await API.fromLSPConnection({ pipe: session.pipe });
        // A guarded attachment may finish after timeout/exit; it still belongs to this owner.
        if (connection.failure || connection.closing) {
          void attached.close().catch(() => {});
          throw connection.failure ?? new Error("Native TypeScript LSP is closing.");
        }
        connection.attached = attached;
      });
      return connection;
    } catch (cause) {
      await connection.close();
      throw cause;
    }
  }

  get api(): API<true> {
    if (!this.attached) throw new Error("The native TypeScript API session is not initialized.");
    return this.attached;
  }

  get pid(): number | undefined {
    return this.process.pid;
  }

  async openDocument(file: string, text: string): Promise<void> {
    if (this.document !== undefined)
      throw new Error(`Native TypeScript is already reading ${this.document}.`);
    await this.sdk("didOpen", () =>
      this.notify("textDocument/didOpen", {
        textDocument: {
          uri: pathToFileURL(file).href,
          languageId: file.endsWith(".tsx") ? "typescriptreact" : "typescript",
          version: 1,
          text,
        },
      }),
    );
    this.document = file;
    // Order didOpen before the separate API pipe captures its snapshot, without type/hover work.
    await this.request("textDocument/documentSymbol", {
      textDocument: { uri: pathToFileURL(file).href },
    });
  }

  async closeDocument(file: string): Promise<void> {
    await this.sdk("didClose", () =>
      this.notify("textDocument/didClose", { textDocument: { uri: pathToFileURL(file).href } }),
    );
    this.document = undefined;
  }

  snapshot(): Promise<Snapshot> {
    return this.sdk("getCurrentLanguageServerSnapshot", async () => {
      // The LSP document owns discovery and text; do not retain a second API openFiles lease.
      const snapshot = await this.api.getCurrentLanguageServerSnapshot();
      if (this.failure || this.closing) {
        void snapshot.dispose().catch(() => {});
        throw this.failure ?? new Error("Native TypeScript LSP is closing.");
      }
      return snapshot;
    });
  }

  // SDK pipe closure does not reject pending requests; bound each phase, not the whole audit.
  sdk<A>(phase: string, work: () => Promise<A>): Promise<A> {
    if (this.failure || this.closing)
      return Promise.reject(this.failure ?? new Error("Native TypeScript LSP is closing."));
    return new Promise<A>((resolve, reject) => {
      const finish = () => {
        clearTimeout(timer);
        this.sdkPending.delete(refuse);
      };
      const refuse = (error: unknown) => {
        finish();
        reject(error);
      };
      const timer = setTimeout(
        () => this.fail(new Error(`Native TypeScript SDK timed out: ${phase}`)),
        30_000,
      );
      this.sdkPending.add(refuse);
      try {
        // Both handlers stay attached after refusal so late SDK errors are never unhandled.
        void work().then((value) => {
          finish();
          resolve(value);
        }, refuse);
      } catch (cause) {
        refuse(cause);
      }
    });
  }

  close(): Promise<void> {
    return (this.closing ??= (async () => {
      const kill = setTimeout(() => this.process.kill("SIGKILL"), 2000);
      try {
        if (this.attached) await Promise.race([this.attached.close(), this.exited]).catch(() => {});
        if (this.process.exitCode === null && this.process.signalCode === null) {
          await this.request("shutdown").catch(() => {});
          await this.notify("exit").catch(() => {});
        }
      } finally {
        this.document = undefined;
        this.process.stdin.end();
        await this.exited;
        clearTimeout(kill);
        this.fail(new Error("Native TypeScript LSP is closed."));
      }
    })());
  }

  private fail(error: Error): void {
    this.failure ??= error;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
    for (const refuse of this.sdkPending) refuse(this.failure);
    this.sdkPending.clear();
  }

  private write(message: object): Promise<void> {
    if (this.failure) return Promise.reject(this.failure);
    const body = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...message }), "utf8");
    const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "ascii");
    return new Promise((resolve, reject) => {
      this.process.stdin.write(Buffer.concat([header, body]), (error) =>
        error ? reject(error) : resolve(),
      );
    });
  }

  private notify(method: string, params?: unknown): Promise<void> {
    return this.write({ method, ...(params === undefined ? {} : { params }) });
  }

  private request(method: string, params?: unknown): Promise<unknown> {
    if (this.failure) return Promise.reject(this.failure);
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Native TypeScript LSP timed out: ${method}`));
      }, 30_000);
      this.pending.set(id, { resolve, reject, timer });
      void this.write({ id, method, ...(params === undefined ? {} : { params }) }).catch(
        (error: Error) => {
          this.pending.delete(id);
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }
}
