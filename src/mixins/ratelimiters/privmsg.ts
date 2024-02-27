import { Sema } from "async-sema";

import { canSpamFast } from "./utils";
import type { ClientMixin } from "../base-mixin";
import type { ChatClient } from "~/client/client";
import { applyReplacements } from "~/utils/apply-function-replacements";

export class PrivmsgMessageRateLimiter implements ClientMixin {
  private readonly client: ChatClient;
  private readonly highPrivmsgSemaphore: Sema;
  private readonly lowPrivmsgSemaphore: Sema;

  public constructor(client: ChatClient) {
    this.client = client;

    this.highPrivmsgSemaphore = new Sema(
      this.client.configuration.rateLimits.highPrivmsgLimits,
    );
    this.lowPrivmsgSemaphore = new Sema(
      this.client.configuration.rateLimits.lowPrivmsgLimits,
    );
  }

  public applyToClient(client: ChatClient): void {
    const genericReplacement = async <V, A extends unknown[]>(
      oldFunction: (channelName: string, ...args: A) => Promise<V>,
      channelName: string,
      ...args: A
      // eslint-disable-next-line unicorn/consistent-function-scoping
    ): Promise<V> => {
      const releaseFunction = await this.acquire(channelName);
      try {
        return await oldFunction(channelName, ...args);
      } finally {
        setTimeout(
          releaseFunction,
          this.client.configuration.rateLimits.privmsgInMs,
        );
      }
    };

    applyReplacements(this, client, {
      say: genericReplacement,
      me: genericReplacement,
      privmsg: genericReplacement,
    });
  }

  private async acquire(channelName: string): Promise<() => void> {
    const { fastSpam } = canSpamFast(
      channelName,
      this.client.configuration.username,
      this.client.userStateTracker,
    );

    const promises: Promise<unknown>[] = [];
    promises.push(this.highPrivmsgSemaphore.acquire());
    if (!fastSpam) {
      promises.push(this.lowPrivmsgSemaphore.acquire());
    }

    const releaseFunction = (): void => {
      if (!fastSpam) {
        this.lowPrivmsgSemaphore.release();
      }

      this.highPrivmsgSemaphore.release();
    };

    await Promise.all(promises);
    return releaseFunction;
  }
}
