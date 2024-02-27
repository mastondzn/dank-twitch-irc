import { Sema } from "async-sema";

import type { ClientMixin } from "../base-mixin";
import type { ChatClient } from "~/client/client";
import { applyReplacements } from "~/utils/apply-function-replacements";

export class JoinRateLimiter implements ClientMixin {
  private readonly client: ChatClient;
  private readonly joinLimitsSemaphore: Sema;

  public constructor(client: ChatClient) {
    this.client = client;

    this.joinLimitsSemaphore = new Sema(
      this.client.configuration.rateLimits.joinLimits,
    );
  }

  public applyToClient(client: ChatClient): void {
    const joinReplacement = async <V, A extends unknown[]>(
      oldFunction: (channelName: string, ...args: A) => Promise<V>,
      channelName: string,
      ...args: A
      // eslint-disable-next-line unicorn/consistent-function-scoping
    ): Promise<V> => {
      const releaseFunction = await this.acquire();
      try {
        return await oldFunction(channelName, ...args);
      } finally {
        setTimeout(releaseFunction, 10 * 1000); // 10 seconds per 20 joined channels.
      }
    };

    const joinAllReplacement = async <A extends unknown[]>(
      oldFunction: (
        channelNames: string[],
        ...args: A
      ) => Promise<Record<string, Error | undefined>>,
      channelNames: string[],
      ...args: A
      // eslint-disable-next-line unicorn/consistent-function-scoping
    ): Promise<Record<string, Error | undefined>> => {
      const promiseResults = [];

      for (
        let index = 0;
        index < channelNames.length;
        index += this.client.configuration.rateLimits.joinLimits
      ) {
        const chunk = channelNames.slice(
          index,
          index + this.client.configuration.rateLimits.joinLimits,
        );

        const acquireFunctions = Array.from({ length: chunk.length }).fill(
          this.acquire.bind(this),
        ) as (() => Promise<() => void>)[];

        const releaseFunctions = await Promise.all(
          acquireFunctions.map((acquire) => acquire()),
        );

        try {
          const result = await oldFunction(chunk, ...args);
          promiseResults.push(result);
        } finally {
          for (const releaseFunction of releaseFunctions) {
            setTimeout(releaseFunction, 10 * 1000); // 10 seconds per 20 joined channels.
          }
        }
      }

      return promiseResults.reduce(
        (accumulator, object) => ({ ...accumulator, ...object }),
        {},
      );
    };

    applyReplacements(this, client, {
      join: joinReplacement,
      joinAll: joinAllReplacement,
    });
  }

  private async acquire(): Promise<() => void> {
    await this.joinLimitsSemaphore.acquire();
    return () => this.joinLimitsSemaphore.release();
  }
}
