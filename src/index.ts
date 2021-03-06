import getRawBody from "raw-body";
import { spawn, ChildProcess } from "child_process";
import { Duplex } from "stream";

class Process extends Duplex implements Promise<void> {
  private waiting = false;

  readonly then: <S = void, T = never>(
    resolve?: ((_: void) => S | PromiseLike<S>) | null,
    reject?: ((exitCode: number) => T | PromiseLike<T>) | null
  ) => Promise<S | T>;
  readonly catch: <T = never>(
    reject?: ((exitCode: number) => T | PromiseLike<T>) | null
  ) => Promise<void | T>;
  readonly finally: (cb?: (() => void) | null) => Promise<void>;

  constructor(private readonly proc: ChildProcess) {
    super();

    const promise = new Promise<void>((resolve, reject) =>
      proc.on("close", code => (code === 0 ? resolve() : reject(code)))
    );
    this.then = promise.then.bind(promise);
    this.catch = promise.catch.bind(promise);
    this.finally = promise.finally.bind(promise);

    if (this.proc.stdin) {
      this.proc.stdin.once("finish", () => this.end());
      this.once("finish", () => this.proc.stdin!.end());
    }

    if (this.proc.stdout) {
      this.proc.stdout.on("readable", () => {
        if (this.waiting) {
          this.waiting = false;
          this._read();
        }
      });
      this.proc.stdout.once("end", () => this.push(null));
    }
  }

  _read() {
    if (!this.proc.stdout) return;
    this.waiting = true;
    for (
      let buf = this.proc.stdout.read();
      buf !== null;
      buf = this.proc.stdout.read()
    ) {
      this.push(buf);
      this.waiting = false;
    }
  }

  _write(input: string, encoding: string, cb?: (error?: Error | null) => void) {
    if (this.proc.stdin) this.proc.stdin.write(input, encoding, cb);
  }

  end(cb?: () => void): this;
  end(data: string | Uint8Array, cb?: () => void): this;
  end(str: string, encoding?: string, cb?: () => void): this;
  // tslint:disable-next-line
  end(...args: any[]) {
    if (this.proc.stdin) this.proc.stdin.end(...args);
    return this;
  }

  [Symbol.toStringTag]: string;
  async toString(encoding: getRawBody.Encoding = true) {
    const promise = getRawBody(this, { encoding });
    await this;
    return promise;
  }
}

interface ModuleProxy {
  [name: string]: (...args: string[]) => Process;
}

const sh = new Proxy<ModuleProxy>(
  {},
  {
    get: (_, name: string) => (...args: string[]) =>
      new Process(
        spawn(name, args, { stdio: ["pipe", "pipe", process.stderr] })
      ),
  }
);

export = sh;
