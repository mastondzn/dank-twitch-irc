import { Sema } from "async-sema";

import type { ChatClient } from "../../client/client";
import type { SingleConnection } from "../../client/connection";
import { applyReplacements } from "../../utils/apply-function-replacements";
import type { ClientMixin, ConnectionMixin } from "../base-mixin";

export interface ConnectionRateLimits {
  parallelConnections: number;
  releaseTime: number;
}

export class ConnectionRateLimiter implements ClientMixin, ConnectionMixin {
  private readonly client: ChatClient;
  private readonly semaphore: Sema;

  public constructor(client: ChatClient) {
    this.client = client;

    this.semaphore = new Sema(
      this.client.configuration.connectionRateLimits.parallelConnections,
    );
  }

  public async acquire(): Promise<void> {
    await this.semaphore.acquire();
  }

  public releaseOnConnect(conn: SingleConnection): void {
    const unsubscribers: (() => void)[] = [];

    const unsubscribe = (): void => {
      for (const callback of unsubscribers) callback();
    };

    const done = (): void => {
      unsubscribe();
      setTimeout(
        () => this.semaphore.release(),
        this.client.configuration.connectionRateLimits.releaseTime,
      );
    };

    conn.on("connect", done);
    conn.on("close", done);

    unsubscribers.push(
      () => conn.removeListener("connect", done),
      () => conn.removeListener("close", done),
    );
  }

  public applyToClient(client: ChatClient): void {
    client.connectionMixins.push(this);
  }

  public applyToConnection(connection: SingleConnection): void {
    // override transport.connect
    applyReplacements(this, connection.transport, {
      connect(
        originalFunction: (callback?: () => void) => void,
        connectionListener?: () => void,
      ): void {
        void this.acquire().then(() => {
          originalFunction(connectionListener);
          this.releaseOnConnect(connection);
        });
      },
    });
  }
}
