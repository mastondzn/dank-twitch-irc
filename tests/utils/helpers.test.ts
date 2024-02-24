/* eslint-disable ts/no-explicit-any, ts/no-empty-function */
import { Duplex } from "node:stream";
import util, { inspect } from "node:util";

import { assert, expect, vi } from "vitest";

import { ChatClient } from "../client/client";
import { SingleConnection } from "../client/connection";

export function errorOf(p: Promise<any>): Promise<any> {
  // eslint-disable-next-line ts/no-unsafe-return
  return p.catch((error) => error);
}

export async function causeOf(p: Promise<any>): Promise<any> {
  // eslint-disable-next-line ts/no-unsafe-return, ts/no-unsafe-member-access
  return (await errorOf(p)).cause;
}

function assertLink(error: Error, chain: unknown[], depth = 0): void {
  const [errorType, message, ...newChain] = chain;

  const actualPrototype = Object.getPrototypeOf(
    error,
  ) as (typeof Error)["prototype"];
  const expectedPrototype = (errorType as typeof Error).prototype;
  assert.strictEqual(
    actualPrototype,
    expectedPrototype,
    `Error at depth ${depth} should be directly instanceof ` +
      `${util.inspect(expectedPrototype)}, ` +
      `is instance of: ${util.inspect(actualPrototype)}`,
  );

  assert.strictEqual(
    error.message,
    message,
    `Error at depth ${depth} should have error message "${message as string}"`,
  );

  // @ts-expect-error e.cause is unknown to the compiler
  const cause: Error | undefined = error.cause;
  if (newChain.length > 0) {
    assert("cause" in error, `Error at depth ${depth} should have a cause`);
    assert(cause != null, `Error at depth ${depth} should have a cause`);

    assertLink(cause, newChain, depth + 1);
  } else {
    assert(
      cause == null,
      `Error at depth ${depth} should not have a cause, ` +
        `but has the following cause: ${inspect(cause)}`,
    );
  }
}

export function assertErrorChain(
  promises: Promise<any> | Promise<any>[],
  ...chain: any[]
): Promise<void>;
export function assertErrorChain(
  error: Error | undefined,
  ...chain: any[]
): void;
export function assertErrorChain(
  errors: Promise<any> | Promise<any>[] | Error | undefined,
  ...chain: any[]
): Promise<void> | void {
  if (errors instanceof Error || errors == null) {
    assert(errors != null, "Error must be non-null");
    assertLink(errors, chain);
  } else {
    return (async () => {
      if (!Array.isArray(errors)) {
        // eslint-disable-next-line ts/no-floating-promises
        errors = [errors];
      }

      for (const errorElement of errors) {
        await expect(errorElement).rejects.toThrow();
        const error = (await errorOf(errorElement)) as Error;
        assertLink(error, chain);
      }
    })();
  }
}

export function assertThrowsChain(f: () => void, ...chain: any[]): void {
  try {
    f();
  } catch (error) {
    // eslint-disable-next-line ts/no-unsafe-argument
    assertErrorChain(error as Error, ...chain);
    return;
  }

  assert.fail("Function did not throw an exception");
}

export interface MockTransportData {
  transport: Duplex;

  data: any[];
  emit: (...lines: string[]) => void;
  end: (error?: Error) => void;
  emitAndEnd: (...lines: string[]) => void;
}

export function createMockTransport(): MockTransportData {
  const data: any[] = [];

  const transport = new Duplex({
    autoDestroy: true,
    emitClose: true,
    decodeStrings: false, // for write operations
    defaultEncoding: "utf8", // for write operations
    encoding: "utf8", // for read operations
    write(
      chunk: any,
      encoding: string,
      callback: (error?: Error | null) => void,
    ): void {
      // eslint-disable-next-line ts/no-unsafe-call, ts/no-unsafe-member-access
      data.push(chunk.toString());
      callback();
    },
    read(): void {},
  });

  const emit = (...lines: string[]): void => {
    transport.push(lines.map((line) => `${line}\r\n`).join(""));
  };

  const end = (error?: Error): void => {
    transport.destroy(error);
  };

  const emitAndEnd = (...lines: string[]): void => {
    setImmediate(emit, ...lines);
    setImmediate(end);
  };

  return {
    transport,
    data,
    emit,
    end,
    emitAndEnd,
  };
}

export type FakeConnectionData = {
  client: SingleConnection;
  clientError: Promise<void>;
} & MockTransportData;

export function fakeConnection(): FakeConnectionData {
  // don't start sending pings
  vi.spyOn(SingleConnection.prototype, "onConnect") //
    .mockImplementation(() => {});

  const transport = createMockTransport();

  const fakeConn = new SingleConnection({
    connection: {
      type: "duplex",
      stream: () => transport.transport,
      preSetup: true,
    },
  });

  fakeConn.connect();

  return {
    ...transport,
    client: fakeConn,
    clientError: new Promise<void>((resolve, reject) => {
      fakeConn.once("error", (error) => reject(error));
      fakeConn.once("close", () => resolve());
    }),
  };
}

export interface FakeClientData {
  client: ChatClient;
  clientError: Promise<void>;
  transports: MockTransportData[];
  emit: (...lines: string[]) => void;
  end: () => void;
  emitAndEnd: (...lines: string[]) => void;
}

export function fakeClient(connect = true): FakeClientData {
  const transports: MockTransportData[] = [];

  const getStream = (): Duplex => {
    const newTransport = createMockTransport();
    transports.push(newTransport);
    return newTransport.transport;
  };

  const client = new ChatClient({
    connection: {
      type: "duplex",
      stream: getStream,
      preSetup: true,
    },
    installDefaultMixins: false,
  });

  if (connect) {
    void client.connect();
  }

  return {
    emit: (...lines) => transports[0]!.emit(...lines),
    emitAndEnd: (...lines) => {
      transports[0]!.emit(...lines);
      setImmediate(() => client.destroy());
    },
    end: () => {
      client.destroy();
    },
    client,
    clientError: new Promise<void>((resolve, reject) => {
      client.once("error", (error) => reject(error));
      client.once("close", () => resolve());
    }),
    transports,
  };
}
