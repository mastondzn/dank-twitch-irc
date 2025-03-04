import { Sema } from "async-sema";

import type { ClientMixin } from "../base-mixin";
import type { ChatClient } from "~/client/client";
import type { RoomState } from "~/message/twitch-types/roomstate";
import type { UserState } from "~/message/twitch-types/userstate";
import { canSpamFast } from "./utils";
import { applyReplacements } from "~/utils/apply-function-replacements";
import { EditableTimeout } from "~/utils/editable-timeout";

export class SlowModeRateLimiter implements ClientMixin {
  public static GLOBAL_SLOW_MODE_COOLDOWN = 1.5;

  private readonly client: ChatClient;
  private readonly maxQueueLength: number;
  private readonly semaphores: Record<string, Sema> = {};
  private readonly runningTimers: Record<string, EditableTimeout> = {};

  public constructor(client: ChatClient, maxQueueLength = 10) {
    this.client = client;
    this.maxQueueLength = maxQueueLength;
  }

  public applyToClient(client: ChatClient): void {
    const genericReplacement = async <A extends unknown[]>(
      oldFunction: (channelName: string, ...args: A) => Promise<void>,
      channelName: string,
      ...args: A
      // eslint-disable-next-line unicorn/consistent-function-scoping
    ): Promise<void> => {
      const releaseFunction = await this.acquire(channelName);
      if (!releaseFunction) {
        // queue is full & message is dropped
        return;
      }

      try {
        // eslint-disable-next-line ts/return-await
        return oldFunction(channelName, ...args);
      } finally {
        releaseFunction();
      }
    };

    applyReplacements(this, client, {
      say: genericReplacement,
      me: genericReplacement,
      privmsg: genericReplacement,
    });

    if (client.roomStateTracker) {
      client.roomStateTracker.on(
        "newChannelState",
        this.onRoomStateChange.bind(this),
      );
    }

    if (client.userStateTracker) {
      client.userStateTracker.on(
        "newChannelState",
        this.onUserStateChange.bind(this),
      );
    }
  }

  private getSemaphore(channelName: string): Sema {
    let semaphore = this.semaphores[channelName];
    if (semaphore == null) {
      semaphore = new Sema(1);
      this.semaphores[channelName] = semaphore;
    }

    return semaphore;
  }

  private onUserStateChange(channelName: string, newState: UserState): void {
    const { fastSpam } = canSpamFast(
      channelName,
      this.client.configuration.username,
      newState,
    );

    const runningTimer = this.runningTimers[channelName];
    if (fastSpam && runningTimer != null) runningTimer.update(0);
  }

  private onRoomStateChange(channelName: string, newState: RoomState): void {
    // new slow mode?

    const newSlowModeDuration = Math.max(
      newState.slowModeDuration,
      SlowModeRateLimiter.GLOBAL_SLOW_MODE_COOLDOWN,
    );

    const runningTimer = this.runningTimers[channelName];
    if (runningTimer) runningTimer.update(newSlowModeDuration);
  }

  private async acquire(
    channelName: string,
  ): Promise<(() => void) | undefined> {
    const { fastSpam, certain } = canSpamFast(
      channelName,
      this.client.configuration.username,
      this.client.userStateTracker,
    );

    // nothing is acquired and nothing has to be released
    if (fastSpam) {
      // eslint-disable-next-line ts/no-empty-function
      return () => {};
    }

    const semaphore = this.getSemaphore(channelName);

    // too many waiting. Message will be dropped.
    // note that we do NOT drop messages when we are unsure about
    // fast spam state (e.g. before the first USERSTATE is received)
    if (certain && semaphore.nrWaiting() >= this.maxQueueLength) {
      return undefined;
    }

    const releaseFunction = (): void => {
      const { fastSpam: fastSpamAfterRelease } = canSpamFast(
        channelName,
        this.client.configuration.username,
        this.client.userStateTracker,
      );

      if (fastSpamAfterRelease) {
        semaphore.release();
        return;
      }

      const slowModeDuration = this.getSlowModeDuration(channelName);

      this.runningTimers[channelName] = new EditableTimeout(() => {
        // eslint-disable-next-line ts/no-dynamic-delete
        delete this.runningTimers[channelName];
        semaphore.release();
      }, slowModeDuration * 1000);
    };

    await semaphore.acquire();

    // if we were released by a incoming USERSTATE change (the timer was
    // edited) and spam can now be fast, return the token immediately
    // and return a no-op releaseFn.
    const { fastSpam: fastSpamAfterAwait } = canSpamFast(
      channelName,
      this.client.configuration.username,
      this.client.userStateTracker,
    );

    if (fastSpamAfterAwait) {
      semaphore.release();
      // eslint-disable-next-line ts/no-empty-function
      return () => {};
    }

    return releaseFunction;
  }

  private getSlowModeDuration(channelName: string): number {
    if (this.client.roomStateTracker != null) {
      const roomState =
        this.client.roomStateTracker.getChannelState(channelName);
      if (roomState != null) {
        return Math.max(
          roomState.slowModeDuration,
          SlowModeRateLimiter.GLOBAL_SLOW_MODE_COOLDOWN,
        );
      }
    }

    return SlowModeRateLimiter.GLOBAL_SLOW_MODE_COOLDOWN;
  }
}
