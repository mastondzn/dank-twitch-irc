import type { SingleConnection } from "./connection";
import type { IRCMessage } from "~/message/irc/irc-message";
import type { TwitchCommands } from "~/message/parser/twitch-message";

export const CLIENT_STATES = [
  "UNCONNECTED",
  "CONNECTING",
  "CONNECTED",
  "READY",
  "CLOSED",
] as const;

export type ClientState = (typeof CLIENT_STATES)[number];

export interface ClientStateChangeEvent {
  oldState: ClientState;
  newState: ClientState;
}

export interface SpecificConnectionEvents {
  connecting: [];
  connect: [];
  ready: [];
  close: [Error | undefined];
  error: [Error];

  message: [IRCMessage];
}

export interface SpecificClientEvents {
  connecting: [];
  connect: [];
  ready: [];
  close: [Error | undefined];
  error: [Error];
  message: [IRCMessage];
  reconnect: [SingleConnection];

  rawCommmand: [string];
}

// these are the events that are mapped to twitch messages (e.g. PRIVMSG)
export type TwitchMessageEvents = {
  [P in keyof TwitchCommands]: [InstanceType<TwitchCommands[P]>];
};

export type ClientEvents = SpecificClientEvents & TwitchMessageEvents;
