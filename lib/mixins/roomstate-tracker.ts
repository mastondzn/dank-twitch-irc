import EventEmitter from "eventemitter3";

import type { ClientMixin } from "./base-mixin";
import type { ChatClient } from "../client/client";
import {
  type RoomState,
  type RoomstateMessage,
  hasAllStateTags,
} from "../message/twitch-types/roomstate";
import { debugLogger } from "../utils/debug-logger";

const log = debugLogger("dank-twitch-irc:roomstate-tracker");

export interface RoomStateTrackerEvents {
  newChannelState: (channelLogin: string, newState: RoomState) => void;
}

/**
 * Tracks the state of the logged in user (the bot) in all channels the bot operates in
 */
export class RoomStateTracker
  extends EventEmitter<RoomStateTrackerEvents>
  implements ClientMixin
{
  private readonly channelStates: Record<string, RoomState> = {};

  public getChannelState(channelName: string): RoomState | undefined {
    return this.channelStates[channelName];
  }

  public applyToClient(client: ChatClient): void {
    client.roomStateTracker = this;
    client.on("ROOMSTATE", this.onRoomstateMessage.bind(this));
  }

  private onRoomstateMessage(message: RoomstateMessage): void {
    const currentState: RoomState | undefined = this.getChannelState(
      message.channelName,
    );
    const extractedState: Partial<RoomState> = message.extractRoomState();

    if (currentState == null) {
      if (!hasAllStateTags(extractedState)) {
        log.warn(
          "Got incomplete ROOMSTATE before receiving complete roomstate:",
          message.rawSource,
        );
        return;
      }
      this.channelStates[message.channelName] = extractedState;
      this.emit("newChannelState", message.channelName, extractedState);
    } else {
      const newState = Object.assign({}, currentState, extractedState);
      this.channelStates[message.channelName] = newState;
      this.emit("newChannelState", message.channelName, newState);
    }
  }
}
