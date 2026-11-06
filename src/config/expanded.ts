import type {
  ClientConfiguration,
  CustomTransportConfiguration,
  RateLimitsConfig,
  TransportConfiguration,
  WebSocketTransportConfiguration,
} from "./config";
import { type RateLimits, rateLimitPresets } from "./rate-limits";
import { setDefaults } from "~/utils/set-defaults";

export type ExpandedCustomTransportConfiguration =
  CustomTransportConfiguration & {
    preSetup: boolean;
  };

export type ExpandedWebSocketTransportConfiguration =
  WebSocketTransportConfiguration & {
    url: string;
    preSetup: false;
  };

export type ExpandedTransportConfiguration =
  | ExpandedCustomTransportConfiguration
  | ExpandedWebSocketTransportConfiguration;

export type ExpandedClientConfiguration = Required<
  Omit<ClientConfiguration, "connection" | "password" | "rateLimits">
> & {
  password: string | undefined;
  connection: ExpandedTransportConfiguration;
  rateLimits: RateLimits;
};

const DEFAULT_WEBSOCKET_URL = "wss://irc-ws.chat.twitch.tv";

const defaults: Omit<
  ExpandedClientConfiguration,
  "connection" | "rateLimits"
> & {
  connection: WebSocketTransportConfiguration;
} = {
  username: "justinfan12345",
  password: undefined,
  requestMembershipCapability: false,

  maxChannelCountPerConnection: 90,

  connection: {
    type: "websocket",
  },

  connectionRateLimits: {
    parallelConnections: 1,
    releaseTime: 2000, // 2 seconds
  },

  installDefaultMixins: true,
};

export function expandTransportConfig(
  config: TransportConfiguration | undefined,
): ExpandedTransportConfiguration {
  if (config == null) {
    return expandTransportConfig({
      type: "websocket",
    });
  }

  switch (config.type) {
    case "custom": {
      return {
        ...config,
        preSetup: config.preSetup ?? false,
      };
    }

    case "websocket": {
      return {
        type: "websocket",
        url: config.url ?? DEFAULT_WEBSOCKET_URL,
        preSetup: false,
      };
    }

    default: {
      throw new Error("Unknown transport type");
    }
  }
}

export function expandRateLimitsConfig(
  config: RateLimitsConfig | undefined,
): RateLimits {
  if (config == null) {
    return rateLimitPresets.default;
  }

  return typeof config === "string" ? rateLimitPresets[config] : config;
}

export function expandConfig(
  config?: ClientConfiguration,
): ExpandedClientConfiguration {
  const newConfig = setDefaults(
    config,
    defaults,
  ) as ExpandedClientConfiguration;

  newConfig.username = newConfig.username.toLowerCase();
  newConfig.connection = expandTransportConfig(newConfig.connection);
  newConfig.rateLimits = expandRateLimitsConfig(newConfig.rateLimits);
  return newConfig;
}
