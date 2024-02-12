import type { ClientMixin } from "./base-mixin";
import { canSpamFast } from "./ratelimiters/utils";
import type { ChatClient } from "../client/client";
import type { PrivmsgMessage } from "../message/twitch-types/privmsg";
import { applyReplacements } from "../utils/apply-function-replacements";

export const invisibleSuffix = " \u{000E0000}";

interface LastMessage {
  messageText: string;
  action: boolean;
}

export class AlternateMessageModifier implements ClientMixin {
  private readonly client: ChatClient;
  private readonly lastMessages: Record<string, LastMessage> = {};

  public constructor(client: ChatClient) {
    this.client = client;
  }

  public appendInvisibleCharacter(
    channelName: string,
    messageText: string,
    action: boolean,
  ): string {
    const lastMessage: LastMessage | undefined = this.lastMessages[channelName];

    return lastMessage != null &&
      lastMessage.messageText === messageText &&
      lastMessage.action === action
      ? messageText + invisibleSuffix
      : messageText;
  }

  public applyToClient(client: ChatClient): void {
    type GenericReplacementFunction = (
      oldFunction: (channelName: string, message: string) => Promise<void>,
      channelName: string,
      message: string,
    ) => Promise<void>;

    const genericReplament =
      (action: boolean): GenericReplacementFunction =>
      async <A extends unknown[]>(
        oldFunction: (
          channelName: string,
          message: string,
          ...arguments_: A
        ) => Promise<void>,
        channelName: string,
        message: string,
        ...arguments_: A
      ): Promise<void> => {
        const { fastSpam } = canSpamFast(
          channelName,
          client.configuration.username,
          client.userStateTracker,
        );

        if (fastSpam) {
          await oldFunction(channelName, message, ...arguments_);
          return;
        }

        const newMessage = this.appendInvisibleCharacter(
          channelName,
          message,
          action,
        );
        await oldFunction(channelName, newMessage, ...arguments_);

        if (!this.client.joinedChannels.has(channelName)) {
          // in this case we won't get our own message back via the
          // onPrivmsg handler, so this will have to do. (Save the sent
          // message)
          this.lastMessages[channelName] = {
            messageText: newMessage,
            action,
          };
        }
      };

    applyReplacements(this, client, {
      say: genericReplament(false),
      me: genericReplament(true),
    });

    client.on("PRIVMSG", this.onPrivmsgMessage.bind(this));
  }

  private onPrivmsgMessage(message: PrivmsgMessage): void {
    // msg must be from us (the logged in user)
    if (!(message.senderUsername === this.client.configuration.username)) {
      return;
    }

    this.lastMessages[message.channelName] = {
      messageText: message.messageText,
      action: message.isAction,
    };
  }
}
