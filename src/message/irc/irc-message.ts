import type { IRCMessagePrefix } from "./prefix";
import type { IRCMessageTags } from "./tags";
import { MissingDataError } from "../parser/missing-data-error";

export interface IRCMessageData {
  readonly rawSource: string;

  readonly ircPrefixRaw: string | undefined;
  readonly ircPrefix: IRCMessagePrefix | undefined;

  /**
   * The parser ensures this is always uppercase
   */
  readonly ircCommand: string;
  readonly ircParameters: string[];
  readonly ircTags: IRCMessageTags;
}

export class IRCMessage implements IRCMessageData {
  public readonly rawSource: string;

  public readonly ircPrefixRaw: string | undefined;
  public readonly ircPrefix: IRCMessagePrefix | undefined;

  /**
   * The parser ensures this is always uppercase
   */
  public readonly ircCommand: string;
  public readonly ircParameters: string[];
  public readonly ircTags: IRCMessageTags;

  public constructor(messageData: IRCMessageData) {
    this.rawSource = messageData.rawSource;
    this.ircPrefixRaw = messageData.ircPrefixRaw;
    this.ircPrefix = messageData.ircPrefix;
    this.ircCommand = messageData.ircCommand;
    this.ircParameters = messageData.ircParameters;
    this.ircTags = messageData.ircTags;
  }
}

export function getParameter(
  message: Pick<IRCMessage, "ircParameters">,
  index: number,
): string {
  // TODO: check where this may result in undefined
  return message.ircParameters[index]!;
}

export function requireParameter(
  message: Pick<IRCMessage, "ircParameters">,
  index: number,
): string {
  if (message.ircParameters.length <= index) {
    throw new MissingDataError(`Parameter at index ${index} missing`);
  }

  return message.ircParameters[index]!;
}

export function requireNickname(
  message: Pick<IRCMessage, "ircPrefix">,
): string {
  if (message.ircPrefix?.nickname == null) {
    throw new MissingDataError("Missing prefix or missing nickname in prefix");
  }

  return message.ircPrefix.nickname;
}
