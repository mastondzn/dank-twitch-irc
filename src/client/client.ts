import type { ClientConfiguration } from "~/config/config";
import type { ClientMixin, ConnectionMixin } from "~/mixins/base-mixin";
import type { ConnectionPool } from "~/mixins/connection-pool";
import { BaseClient } from "./base-client";
import { SingleConnection } from "./connection";
import { ClientError } from "./errors";
import { IgnoreUnhandledPromiseRejectionsMixin } from "~/mixins/ignore-promise-rejections";
import { ConnectionRateLimiter } from "~/mixins/ratelimiters/connection";
import { JoinRateLimiter } from "~/mixins/ratelimiters/join";
import { PrivmsgMessageRateLimiter } from "~/mixins/ratelimiters/privmsg";
import { RoomStateTracker } from "~/mixins/roomstate-tracker";
import { UserStateTracker } from "~/mixins/userstate-tracker";
import { joinChannel, joinNothingToDo } from "~/operations/join";
import { joinAll } from "~/operations/join-all";
import { partChannel, partNothingToDo } from "~/operations/part";
import { sendPing } from "~/operations/ping";
import { sendPrivmsg } from "~/operations/privmsg";
import { me, reply, say } from "~/operations/say";
import { anyCauseInstanceof } from "~/utils/any-cause-instanceof";
import { debugLogger } from "~/utils/debug-logger";
import { findAndPushToEnd } from "~/utils/find-and-push-to-end";
import { removeInPlace } from "~/utils/remove-in-place";
import { toChunked } from "~/utils/to-chunked";
import { unionSets } from "~/utils/union-sets";
import { correctChannelName, validateChannelName } from "~/validation/channel";
import { validateMessageID } from "~/validation/reply";

const log = debugLogger("dank-twitch-irc:client");

export type ConnectionPredicate = (conn: SingleConnection) => boolean;
const alwaysTrue = (): true => true as const;

export class ChatClient extends BaseClient {
  public get wantedChannels(): Set<string> {
    return unionSets(this.connections.map((c) => c.wantedChannels));
  }

  public get joinedChannels(): Set<string> {
    return unionSets(this.connections.map((c) => c.joinedChannels));
  }

  public roomStateTracker?: RoomStateTracker;
  public userStateTracker?: UserStateTracker;
  public connectionPool?: ConnectionPool;
  public readonly connectionMixins: ConnectionMixin[] = [];

  public readonly connections: SingleConnection[] = [];
  private activeWhisperConn: SingleConnection | undefined;

  public constructor(configuration?: ClientConfiguration) {
    super(configuration);

    if (this.configuration.installDefaultMixins) {
      this.use(new UserStateTracker(this));
      this.use(new RoomStateTracker());
      this.use(new ConnectionRateLimiter(this));
      this.use(new PrivmsgMessageRateLimiter(this));
      this.use(new JoinRateLimiter(this));
    }

    if (this.configuration.ignoreUnhandledPromiseRejections) {
      this.use(new IgnoreUnhandledPromiseRejectionsMixin());
    }

    this.on("error", (error) => {
      if (anyCauseInstanceof(error, ClientError)) {
        process.nextTick(() => {
          this.emitClosed(error);
          for (const conn of this.connections) conn.destroy(error);
        });
      }
    });

    this.on("close", () => {
      for (const conn of this.connections) conn.close();
    });
  }

  public async connect(): Promise<void> {
    this.requireConnection();
    if (!this.ready) {
      await new Promise<void>((resolve) => this.once("ready", () => resolve()));
    }
  }

  public close(): void {
    // -> connections are close()d via "close" event listener
    this.emitClosed();
  }

  public destroy(error?: Error): void {
    // we emit onError before onClose just like the standard node.js core modules do
    if (error == null) {
      this.emitClosed();
    } else {
      this.emitError(error);
      this.emitClosed(error);
    }
  }

  /**
   * Sends a raw IRC command to the server, e.g. <code>JOIN #forsen</code>.
   *
   * Throws an exception if the passed command contains one or more newline characters.
   *
   * @param command Raw IRC command.
   */
  public sendRaw(command: string): void {
    this.requireConnection().sendRaw(command);
  }

  public async join(channelName: string): Promise<void> {
    channelName = correctChannelName(channelName);
    validateChannelName(channelName);

    if (this.connections.some((c) => joinNothingToDo(c, channelName))) {
      // are we joined already?
      return;
    }

    // check if any existing conn wants this channel (and is not joined), if not find any conn that has space
    // if none is found, create a new connection
    const conn =
      findAndPushToEnd(this.connections, (conn) =>
        conn.wantedChannels.has(channelName),
      ) ??
      this.requireConnection(
        maxJoinedChannels(this.configuration.maxChannelCountPerConnection),
      );

    await joinChannel(conn, channelName);
  }

  public async part(channelName: string): Promise<void> {
    channelName = correctChannelName(channelName);
    validateChannelName(channelName);

    if (this.connections.every((c) => partNothingToDo(c, channelName))) {
      // are we parted already?
      return;
    }

    const conn = this.requireConnection(
      (c) => !partNothingToDo(c, channelName),
    );
    await partChannel(conn, channelName);
  }

  public async joinAll(
    channelNames: string[],
  ): Promise<Record<string, Error | undefined>> {
    channelNames = channelNames.map((v) => {
      v = correctChannelName(v);
      validateChannelName(v);
      return v;
    });

    const needToJoin = new Set(
      channelNames.filter(
        (channelName) =>
          !this.connections.some((c) => joinNothingToDo(c, channelName)),
      ),
    );

    const chunks: [SingleConnection, string[]][] = this.connections.map(
      (conn) => [conn, []],
    );

    // add channels to the connections that wants them
    for (const [conn, list] of chunks) {
      // list of channels this conn wants but is not joined to
      const channels = [...conn.wantedChannels].filter((channelName) =>
        needToJoin.has(channelName),
      );

      list.push(...channels);
      for (const channel of channels) {
        needToJoin.delete(channel);
      }
    }

    // now we can add channels to the connections that have space
    for (const [conn, list] of chunks) {
      // number of channels this conn can still join
      const count =
        this.configuration.maxChannelCountPerConnection -
        conn.wantedChannels.size;
      const channels = [...needToJoin].slice(0, count);

      list.push(...channels);
      for (const channel of channels) {
        needToJoin.delete(channel);
      }
    }

    // finally, create new connections for the remaining channels
    for (const chunk of toChunked(
      [...needToJoin],
      this.configuration.maxChannelCountPerConnection,
    )) {
      chunks.push([this.newConnection(), chunk]);
    }

    const promises: Promise<Record<string, Error | undefined>>[] = chunks.map(
      async (args) => joinAll(...args),
    );

    const errorChunks = await Promise.all(promises);
    return errorChunks.reduce(
      (accumulator, chunk) => Object.assign(accumulator, chunk),
      {},
    );
  }

  public async privmsg(channelName: string, message: string): Promise<void> {
    channelName = correctChannelName(channelName);
    validateChannelName(channelName);
    return sendPrivmsg(this.requireConnection(), channelName, message);
  }

  public async say(channelName: string, message: string): Promise<void> {
    channelName = correctChannelName(channelName);
    validateChannelName(channelName);
    await say(
      this.requireConnection(mustNotBeJoined(channelName)),
      channelName,
      message,
    );
  }

  public async me(channelName: string, message: string): Promise<void> {
    channelName = correctChannelName(channelName);
    validateChannelName(channelName);
    await me(
      this.requireConnection(mustNotBeJoined(channelName)),
      channelName,
      message,
    );
  }

  /**
   * @param channelName The channel name you want to reply in.
   * @param messageID The message ID you want to reply to.
   * @param message The message you want to send.
   */
  public async reply(
    channelName: string,
    messageID: string,
    message: string,
  ): Promise<void> {
    channelName = correctChannelName(channelName);
    validateChannelName(channelName);
    validateMessageID(messageID);
    await reply(
      this.requireConnection(mustNotBeJoined(channelName)),
      channelName,
      messageID,
      message,
    );
  }

  public async ping(): Promise<void> {
    await sendPing(this.requireConnection());
  }

  public newConnection(): SingleConnection {
    const conn = new SingleConnection(this.configuration);

    log.debug(`Creating new connection (ID ${conn.connectionID})`);

    for (const mixin of this.connectionMixins) {
      conn.use(mixin);
    }

    conn.on("connecting", () => this.emitConnecting());
    conn.on("connect", () => this.emitConnected());
    conn.on("ready", () => this.emitReady());
    conn.on("error", (error) => this.emitError(error));
    conn.on("close", (hadError) => {
      if (hadError) {
        log.warn(`Connection ${conn.connectionID} was closed due to error`);
      } else {
        log.debug(`Connection ${conn.connectionID} closed normally`);
      }

      removeInPlace(this.connections, conn);

      if (this.activeWhisperConn === conn) {
        this.activeWhisperConn = undefined;
      }

      if (!this.closed) {
        this.reconnectFailedConnection(conn);
      }
    });

    // forward commands issued by this client
    conn.on("rawCommmand", (cmd) => this.emit("rawCommmand", cmd));

    // forward events to this client
    conn.on("message", (message) => {
      // only forward whispers from the currently active whisper connection
      if (message.ircCommand === "WHISPER") {
        if (this.activeWhisperConn == null) {
          this.activeWhisperConn = conn;
        }

        if (this.activeWhisperConn !== conn) {
          // message is ignored.
          return;
        }
      }

      this.emitMessage(message);
    });

    conn.connect();

    this.connections.push(conn);
    return conn;
  }

  public use(mixin: ClientMixin): void {
    mixin.applyToClient(this);
  }

  private reconnectFailedConnection(conn: SingleConnection): void {
    // rejoin channels, creates connections on demand
    const channels = [...conn.wantedChannels];

    if (channels.length > 0) {
      void this.joinAll(channels);
    } else if (this.connections.length <= 0) {
      // this ensures that clients with zero joined channels stay connected (so they can receive whispers)
      this.requireConnection();
    }

    this.emit("reconnect", conn);
  }

  /**
   * Finds a connection from the list of connections that satisfies the given predicate,
   * or if none was found, returns makes a new connection. This means that the given predicate must be specified
   * in a way that a new connection always satisfies it.
   *
   * @param predicate The predicate the connection must fulfill.
   */
  public requireConnection(
    predicate: ConnectionPredicate = alwaysTrue,
  ): SingleConnection {
    return (
      findAndPushToEnd(this.connections, predicate) ?? this.newConnection()
    );
  }
}

function maxJoinedChannels(maxChannelCount: number): ConnectionPredicate {
  return (conn) => conn.wantedChannels.size < maxChannelCount;
}

function mustNotBeJoined(channelName: string): ConnectionPredicate {
  return (conn) =>
    !conn.wantedChannels.has(channelName) &&
    !conn.joinedChannels.has(channelName);
}
