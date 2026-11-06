import type { PresetKeys, RateLimits } from "./rate-limits";
import type { Transport } from "~/client/transport/transport";
import type { ConnectionRateLimits } from "~/mixins/ratelimiters/connection";

export interface CustomTransportConfiguration {
  type: "custom";

  /**
   * Creates the transport for a single connection. This is called once per
   * pooled connection, so it should return a new transport instance.
   */
  createTransport: () => Transport;

  /**
   * Whether this transport is already set up (user logged in and
   * capabilities enabled). Defaults to false.
   */
  preSetup?: boolean;
}

export interface WebSocketTransportConfiguration {
  type: "websocket";

  /**
   * WebSocket URL. Defaults to wss://irc-ws.chat.twitch.tv
   */
  url?: string;
}

export type TransportConfiguration =
  | CustomTransportConfiguration
  | WebSocketTransportConfiguration;

export type CustomRateLimitsConfig = RateLimits;

// "default" | "knownBot" | "verifiedBot" | { ... } (custom config)
export type RateLimitsConfig = PresetKeys | CustomRateLimitsConfig;

export interface ClientConfiguration {
  /**
   * lowercase twitch login name
   */
  username?: string;

  /**
   * Optional password. If unset no PASS is sent to the server.
   *
   * If set, this must begin with "<code>oauth:</code>"
   */
  password?: string;

  /**
   * Can be disabled to lower the load on the bot by not requesting useless membership messages.
   *
   * Disabled by default.
   */
  requestMembershipCapability?: boolean;

  connection?: TransportConfiguration;

  /**
   * Maximum number of channels the client will allow one connection to be joined to. 90 by default.
   */
  maxChannelCountPerConnection?: number;

  rateLimits?: RateLimitsConfig;
  connectionRateLimits?: ConnectionRateLimits;
  installDefaultMixins?: boolean;
}
