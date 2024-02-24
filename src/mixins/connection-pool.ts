import type { ClientMixin } from "./base-mixin";
import type { ChatClient, ConnectionPredicate } from "../client/client";
import type { SingleConnection } from "../client/connection";
import { applyReplacements } from "../utils/apply-function-replacements";

export interface ConnectionPoolOptions {
  poolSize: number; //how many fast connection to create
}

export class ConnectionPool implements ClientMixin {
  private client: ChatClient;
  private poolSize: number;

  constructor(client: ChatClient, options: ConnectionPoolOptions) {
    this.client = client;
    this.poolSize = options.poolSize;
  }

  public applyToClient(client: ChatClient): void {
    client.connectionPool = this;
    const replacement = (
      oldFunction: (predicate?: ConnectionPredicate) => SingleConnection,
      predicate?: ConnectionPredicate,
      // eslint-disable-next-line unicorn/consistent-function-scoping
    ): SingleConnection => {
      this.ensureEnoughConnections();
      return oldFunction(predicate);
    };

    applyReplacements(this, client, {
      requireConnection: replacement,
    });
  }

  public ensureEnoughConnections(): void {
    while (this.client.connections.length < this.poolSize) {
      this.client.newConnection();
    }
  }
}
