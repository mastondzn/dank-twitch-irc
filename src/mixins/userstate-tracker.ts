import EventEmitter from "eventemitter3";

import type { ClientMixin } from "./base-mixin";
import type { ChatClient } from "~/client/client";
import type {
  GlobalUserState,
  GlobaluserstateMessage,
} from "~/message/twitch-types/globaluserstate";
import type { PrivmsgMessage } from "~/message/twitch-types/privmsg";
import type {
  UserState,
  UserstateMessage,
} from "~/message/twitch-types/userstate";

export interface UserStateTrackerEvents {
  newGlobalState: (newState: GlobalUserState) => void;
  newChannelState: (channelLogin: string, newState: UserState) => void;
}

/**
 * Tracks the state of the logged in user (the bot) in all channels the bot operates in
 */
export class UserStateTracker
  extends EventEmitter<UserStateTrackerEvents>
  implements ClientMixin
{
  public globalState?: GlobalUserState;
  public channelStates: Record<string, UserState> = {};
  private readonly client: ChatClient;

  public constructor(client: ChatClient) {
    super();
    this.client = client;
  }

  public getChannelState(channelName: string): UserState | undefined {
    return this.channelStates[channelName];
  }

  public getGlobalState(): GlobalUserState | undefined {
    return this.globalState;
  }

  public applyToClient(client: ChatClient): void {
    client.on("USERSTATE", this.onUserstateMessage.bind(this));
    client.on("GLOBALUSERSTATE", this.onGlobaluserstateMessage.bind(this));
    client.on("PRIVMSG", this.onPrivmsgMessage.bind(this));
  }

  private onUserstateMessage(message: UserstateMessage): void {
    const newState = message.extractUserState();
    this.channelStates[message.channel.login] = newState;
    this.emit("newChannelState", message.channel.login, newState);
  }

  private onGlobaluserstateMessage(message: GlobaluserstateMessage): void {
    this.globalState = message.extractGlobalUserState();
    this.emit("newGlobalState", this.globalState);
  }

  private onPrivmsgMessage(message: PrivmsgMessage): void {
    if (message.sender.login !== this.client.configuration.username) {
      return;
    }

    const channelState = this.channelStates[message.channel.login];
    if (channelState == null) {
      return;
    }

    const newState = Object.assign({}, channelState, {
      badgeInfo: message.sender.badgeInfo,
      badgeInfoRaw: message.sender.badgeInfoRaw,
      badges: message.sender.badges,
      badgesRaw: message.sender.badgesRaw,
      color: message.sender.color,
      colorRaw: message.sender.colorRaw,
      displayName: message.sender.displayName,
      isMod: message.sender.isMod,
      isModRaw: message.sender.isModRaw,
    });
    this.channelStates[message.channel.login] = newState;
    this.emit("newChannelState", message.channel.login, newState);
  }
}
