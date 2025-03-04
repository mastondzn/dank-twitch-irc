# @mastondzn/dank-twitch-irc

This package is a fork of [robotty/dank-twitch-irc](https://github.com/robotty/dank-twitch-irc), with additional code from [fmalk/dank-twitch-irc](https://github.com/fmalk/dank-twitch-irc), [amazeful/amazeful-twitch-irc](https://github.com/amazeful/amazeful-twitch-irc) and [kararty/dank-twitch-irc](https://github.com/kararty/dank-twitch-irc).

Node.js-only Twitch IRC lib, written in TypeScript.

Requires Node.js 18 or above.

- [View on GitHub](https://github.com/mastondzn/dank-twitch-irc)
- [View on npm](https://www.npmjs.com/package/@mastondzn/dank-twitch-irc)
- [View documentation](https://mastondzn.github.io/dank-twitch-irc)

![CI](https://github.com/mastondzn/dank-twitch-irc/actions/workflows/ci.yml/badge.svg)

## Usage

```javascript
import { ChatClient } from "@mastondzn/dank-twitch-irc";

const chat = new ChatClient();
chat.on("ready", () => console.log("Successfully connected to chat"));
chat.on("close", (error) => {
  if (error != null) {
    console.error("Client closed due to error", error);
  }
});
chat.on("PRIVMSG", (msg) => {
  console.log(`[#${msg.channelName}] ${msg.displayName}: ${msg.messageText}`);
});
// See below for more events
chat.connect();
chat.join("forsen");
```

## Available client events

- **`chat.on("connecting", () => { /* ... */ })`**: Called when the client
  starts connecting for the first time.
- **`chat.on("connect", () => { /* ... */ })`**: Called when the client
  connects for the first time. This is called when the transport layer
  connections (e.g. TCP or WebSocket connection is established), not when login
  to IRC succeeds.
- **`chat.on("ready", () => { /* ... */ })`**: Called when the client becomes
  ready for the first time (login to the chat server is successful.)
- **`chat.on("close", (error?: Error) => { /* ... */ })`**: Called when the
  client is terminated as a whole. Not called for individual connections that
  were disconnected. Can be caused for example by a invalid OAuth token (failure
  to login), or when `chat.close()` or `chat.destroy()` was called. `error`
  is only non-null if the client was closed by a call to `chat.close()`.
- **`chat.on("error", (error: Error?) => { /* ... */ })`**: Called when any
  error occurs on the client, including non-fatal errors such as a message that
  could not be delivered due to an error.
- **`chat.on("rawCommand", (cmd: string) => { /* ... */ })`**: Called when any
  command is executed by the client.
- **`chat.on("message", (message: IRCMessage) => { /* ... */ })`**: Called on
  every incoming message. If the message is a message that is further parsed (I
  called these "twitch messages" in this library) then the `message` passed to
  this handler will already be the specific type, e.g. `PrivmsgMessage` if the
  command is `PRIVMSG`.
- **`chat.on("PRIVMSG", (message: PrivmsgMessage) => { /* ... */ })`**: Called
  on incoming messages whose command is `PRIVMSG`. The `message` parameter is
  always instanceof `PrivmsgMessage`. (See the API documentation for what
  properties exist on all `PrivmsgMessage` instances)

  For example:

  ```javascript
  chat.on("CLEARCHAT", (msg) => {
    if (msg.isTimeout()) {
      console.log(
        `${msg.targetUsername} just got timed out for ` +
          `${msg.banDuration} seconds in channel ${msg.channelName}`,
      );
    }
  });
  ```

  Other message types that have specific message parsing are:

  - **`CLEARCHAT`** (maps to [`ClearchatMessage`][clearchat]) - Timeout and ban
    messages
  - **`CLEARMSG`** (maps to [`ClearmsgMessage`][clearmsg]) - Single message
    deletions (initiated by `/delete`)
  - **`HOSTTARGET`** (maps to [`HosttargetMessage`][hosttarget]) - A channel
    entering or exiting host mode.
  - **`NOTICE`** (maps to [`NoticeMessage`][notice]) - Various notices, such as
    when you `/help`, a command fails, the error response when you are timed
    out, etc.
  - **`PRIVMSG`** (maps to [`PrivmsgMessage`][privmsg]) - Normal chat messages
  - **`ROOMSTATE`** (maps to [`RoomstateMessage`][roomstate]) - A change to a
    channel's followers mode, subscribers-only mode, r9k mode, followers mode,
    slow mode etc.
  - **`USERNOTICE`** (maps to [`UsernoticeMessage`][usernotice]) - Subs, resubs,
    sub gifts, rituals, raids, etc. - See more details about how to handle this
    message type below.
  - **`USERSTATE`** (maps to [`UserstateMessage`][userstate]) - Your own state
    (e.g. badges, color, display name, emote sets, mod status), sent on every
    time you join a channel or send a `PRIVMSG` to a channel
  - **`GLOBALUSERSTATE`** (maps to
    [`GlobaluserstateMessage`][globaluserstate]) - Logged in user's "global
    state", sent once on every login (Note that due to the used connection pool
    you can receive this multiple times during your bot's runtime)
  - **`WHISPER`** (maps to [`WhisperMessage`][whisper]) - Somebody else
    whispering you
  - **`JOIN`** (maps to [`JoinMessage`][join]) - You yourself joining a channel,
    of if you have `requestMembershipCapability` enabled, also other users
    joining channels you are joined to.
  - **`PART`** (maps to [`JoinMessage`][part]) - You yourself parting (leaving)
    a channel, of if you have `requestMembershipCapability` enabled, also other
    users parting channels you are joined to.
  - **`RECONNECT`** (maps to [`ReconnectMessage`][reconnect]) - When the twitch
    server tells a client to reconnect and re-join channels (You don't have to
    listen for this yourself, this is done automatically already)
  - **`PING`** (maps to [`PingMessage`][ping]) - When the twitch server sends a
    ping, expecting a pong back from the client to verify if the connection is
    still alive. (You don't have to listen for this yourself, the client
    automatically responds for you)
  - **`PONG`** (maps to [`PongMessage`][pong]) - When the twitch server responds
    to our `PING` requests (The library automatically sends a `PING` request
    every 30 seconds to verify connections are alive)
  - **`CAP`** (maps to [`CapMessage`][cap]) - Message type received once during
    connection startup, acknowledging requested capabilities.

All other commands (if they don't have a special parsed type like the ones
listed above) will still be emitted under their command name as an
[`IRCMessage`][ircmessage], e.g.:

```javascript
// :tmi.twitch.tv 372 botfactory :You are in a maze of twisty passages, all alike.
// msg will be an instance of IRCMessage
chat.on("372", (msg) => console.log(`Server MOTD is: ${msg.ircParameters[1]}`));
```

## Handling `USERNOTICE` messages

The `USERNOTICE` message type is special because it encapsulates a wide range of
events, including:

- Subs
- Resubs
- Gift subscription
- Incoming raid and
- Channel rituals,

which are all emitted under the `USERNOTICE` event. See also
[the offical documentation](https://dev.twitch.tv/docs/irc/tags/#usernotice-twitch-tags)
about the `USERNOTICE` command.

Every `USERNOTICE` message is sent by a user, and always contains a
`msg.systemMessage` (This is a message that twitch formats for you, e.g.
`4 raiders from PotehtoO have joined!` for a `raid` message.) Additionally,
every `USERNOTICE` message can have a message that is additionally sent/shared
from the sending user, for example the "share this message with the streamer"
message sent with resubs and subs. If no message is sent by the user,
`msg.messageText` is `undefined`.

`dank-twitch-irc` currently does not have special parsing code for each
`USERNOTICE` `messageTypeID` (e.g. `sub`, `resub`, `raid`, etc...) - Instead the
parser assigns all `msg-param-` tags to the `msg.eventParams` object. See below
on what `msg.eventParams` are available for each of the `messageTypeID`s.

### Sub and resub

When a user subscribes or resubscribes with his own money/prime (this is NOT
sent for gift subs, see below)

```javascript
chat.on("USERNOTICE", (msg) => {
  // sub and resub messages have the same parameters, so we can handle them both the same way
  if (!msg.isSub() && !msg.isResub()) {
    return;
  }
  /*
   * msg.eventParams are:
   *
   * {
   *   "cumulativeMonths": 10,
   *   "cumulativeMonthsRaw": "10",
   *   "subPlan": "1000", // Prime, 1000, 2000 or 3000
   *   "subPlanName": "The Ninjas",
   *
   *   // if shouldShareStreak is false, then
   *   // streakMonths/streakMonthsRaw will be 0
   *   // (the user did not share their sub streak in chat)
   *   "shouldShareStreak": true,
   *   "streakMonths": 7,
   *   "streakMonthsRaw": "7"
   * }
   * Sender user of the USERNOTICE message is the user subbing/resubbing.
   */
  if (msg.isSub()) {
    // Leppunen just subscribed to ninja with a tier 1000 (The Ninjas) sub for the first time!
    console.log(
      `${msg.displayName} just subscribed to ${msg.channelName} with a tier ${msg.eventParams.subPlan} (${msg.eventParams.subPlanName}) sub for the first time!`,
    );
  } else if (msg.isResub()) {
    let streakMessage = "";
    if (msg.eventParams.shouldShareStreak) {
      streakMessage = `, currently ${msg.eventParams.streakMonths} months in a row`;
    }
    // Leppunen just resubscribed to ninja with a tier 1000 (The Ninjas) sub!
    // They are resubscribing for 10 months, currently 7 months in a row!
    console.log(
      `${msg.displayName} just resubscribed to ${msg.channelName} with a tier ${msg.eventParams.subPlan} (${msg.eventParams.subPlanName}) sub! They are resubscribing for ${msg.eventParams.cumulativeMonths} months${streakMessage}!`,
    );
  }
  if (msg.messageText == null) {
    console.log("They did not share a message with the streamer.");
  } else {
    // you also have access to lots of other properties also present on PRIVMSG messages,
    // such as msg.badges, msg.senderUsername, msg.badgeInfo, msg.bits/msg.isCheer(),
    // msg.color, msg.emotes, msg.messageID, msg.serverTimestamp, etc...
    console.log(
      `${msg.displayName} shared the following message with the streamer: ${msg.messageText}`,
    );
  }
});
```

### Incoming raids

Twitch says:

> Incoming raid to a channel. Raid is a Twitch tool that allows broadcasters to
> send their viewers to another channel, to help support and grow other members
> in the community.)

```javascript
chat.on("USERNOTICE", (msg) => {
  if (!msg.isRaid()) {
    return;
  }
  /*
   * msg.eventParams are:
   * {
   *   "displayName": "Leppunen",
   *   "login": "leppunen",
   *   "viewerCount": 12,
   *   "viewerCountRaw": "12"
   * }
   * Sender user of the USERNOTICE message is the user raiding this channel.
   * Note that the display name and login present in msg.eventParams are
   * the same as msg.displayName and msg.senderUsername, so it doesn't matter
   * which one you use (although I recommend the properties directly on the
   * message object, not in eventParams)
   */
  // source user is the channel/streamer raiding
  // Leppunen just raided Supinic with 12 viewers!
  console.log(
    `${msg.displayName} just raided ${msg.channelName} with ${msg.eventParams.viewerCount} viewers!`,
  );
});
```

### Subgift

When a user gifts somebody else a subscription.

```javascript
chat.on("USERNOTICE", (msg) => {
  if (!msg.isSubgift()) {
    return;
  }
  /*
   * msg.eventParams are:
   * {
   *   "months": 5,
   *   "monthsRaw": "5",
   *   "giftMonths": 5,
   *   "giftMonthsRaw": "5",
   *   "recipientDisplayName": "Leppunen",
   *   "recipientID": "42239452",
   *   "recipientUsername": "leppunen",
   *   "subPlan": "1000",
   *   "subPlanName": "The Ninjas",
   *   "senderCount": 5,
   *   "senderCountRaw": "5",
   * }
   * Sender user of the USERNOTICE message is the user gifting the subscription.
   */
  if (msg.eventParams.months === 1) {
    // Leppunen just gifted NymN a fresh tier 1000 (The Ninjas) sub to ninja!
    console.log(
      `${msg.displayName} just gifted ${msg.eventParams.recipientDisplayName} a fresh tier ${msg.eventParams.subPlan} (${msg.eventParams}) sub to ${msg.channelName}!`,
    );
  } else {
    // Leppunen just gifted NymN a tier 1000 (The Ninjas) resub to ninja, that's 7 months in a row!
    console.log(
      `${msg.displayName} just gifted ${msg.eventParams.recipientDisplayName} a tier ${msg.eventParams.subPlan} (${msg.eventParams}) resub to ${msg.channelName}, that's ${msg.eventParams.months} in a row!`,
    );
  }
  // note: if the subgift was from an anonymous user, the sender user for the USERNOTICE message will be
  // AnAnonymousGifter (user ID 274598607)
  if (msg.senderUserID === "274598607") {
    console.log("That (re)sub was gifted anonymously!");
  }
});
```

### Anonsubgift

When an anonymous user gifts a subscription to a viewer.

```javascript
chat.on("USERNOTICE", (msg) => {
  if (!msg.isAnonSubgift()) {
    return;
  }
  /*
   * msg.eventParams are:
   * {
   *   "months": 5,
   *   "monthsRaw": "5",
   *   "recipientDisplayName": "Leppunen",
   *   "recipientID": "42239452",
   *   "recipientUsername": "leppunen",
   *   "subPlan": "1000",
   *   "subPlanName": "The Ninjas"
   * }
   *
   * WARNING! Sender user of the USERNOTICE message is the broadcaster (e.g. Ninja
   * in the example below)
   */
  if (msg.eventParams.months === 1) {
    // An anonymous gifter just gifted NymN a fresh tier 1000 (The Ninjas) sub to ninja!
    console.log(
      `An anonymous gifter just gifted ${msg.eventParams.recipientDisplayName} a fresh tier ${msg.eventParams.subPlan} (${msg.eventParams}) sub to ${msg.channelName}!`,
    );
  } else {
    // An anonymous gifter just gifted NymN a tier 1000 (The Ninjas) resub to ninja, that's 7 months in a row!
    console.log(
      `An anonymous gifter just gifted ${msg.eventParams.recipientDisplayName} a tier ${msg.eventParams.subPlan} (${msg.eventParams}) resub to ${msg.channelName}, that's ${msg.eventParams.months} in a row!`,
    );
  }
});
```

### anongiftpaidupgrade, giftpaidupgrade

When a user commits to continue the gift sub by another user (or an anonymous
gifter).

```javascript
chat.on("USERNOTICE", (msg) => {
  if (!msg.isAnonGiftPaidUpgrade()) {
    return;
  }
  /*
   * msg.eventParams are:
   * EITHER: (ONLY when a promotion is running!)
   * {
   *   "promoName": "Subtember 2018",
   *   "promoGiftTotal": 3987234,
   *   "promoGiftTotalRaw": "3987234"
   * }
   * OR: (when no promotion is running)
   * {}
   *
   * Sender user of the USERNOTICE message is the user continuing their sub.
   */
  // Leppunen is continuing their ninja gift sub they got from an anonymous user!
  console.log(
    `${msg.displayName} is continuing their ${msg.channelName} gift sub they got from an anonymous user!`,
  );
});
```

```javascript
chat.on("USERNOTICE", (msg) => {
  if (!msg.isGiftPaidUpgrade()) {
    return;
  }
  /*
   * msg.eventParams are:
   * EITHER: (ONLY when a promotion is running!)
   * {
   *   "promoName": "Subtember 2018",
   *   "promoGiftTotal": 3987234,
   *   "promoGiftTotalRaw": "3987234",
   *   "senderLogin": "krakenbul",
   *   "senderName": "Krakenbul"
   * }
   * OR: (when no promotion is running)
   * {
   *   "senderLogin": "krakenbul",
   *   "senderName": "Krakenbul"
   * }
   *
   * Sender user of the USERNOTICE message is the user continuing their sub.
   */
  // Leppunen is continuing their ninja gift sub they got from Krakenbul!
  console.log(
    `${msg.displayName} is continuing their ${msg.channelName} gift sub they got from ${msg.msgParam.senderName}!`,
  );
});
```

### ritual

Channel ritual. Twitch says:

> Channel _ritual_. Many channels have special rituals to celebrate viewer
> milestones when they are shared. The rituals notice extends the sharing of
> these messages to other viewer milestones (initially, a new viewer chatting
> for the first time).

```javascript
chat.on("USERNOTICE", (msg) => {
  if (!msg.isRitual()) {
    return;
  }
  /*
   * msg.eventParams are:
   * {
   *   "ritualName": "new_chatter"
   * }
   *
   * Sender user of the USERNOTICE message is the user performing the
   * ritual (e.g. the new chatter).
   */
  // Leppunen is new to ninja's chat! Say hello!
  if (msg.eventParams.ritualName === "new_chatter") {
    console.log(
      `${msg.displayName} is new to ${msg.channelName}'s chat! Say hello!`,
    );
  } else {
    console.warn(
      `Unknown (unhandled) ritual type: ${msg.eventParams.ritualName}`,
    );
  }
});
```

### bitsbadgetier

When a user cheers and earns himself a new bits badge with that cheer (e.g. they
just cheered more than/exactly 10000 bits in total, and just earned themselves
the 10k bits badge)

```javascript
chat.on("USERNOTICE", (msg) => {
  if (!msg.isBitsBadgeTier()) {
    return;
  }
  /*
   * msg.eventParams are:
   * {
   *   "threshold": 10000,
   *   "thresholdRaw": "10000",
   * }
   *
   * Sender user of the USERNOTICE message is the user cheering the bits.
   */
  // Leppunen just earned themselves the 10000 bits badge in ninja's channel!
  console.log(
    `${msg.displayName} just earned themselves the ${msg.threshold} bits badge in ${msg.channelName}'s channel!`,
  );
});
```

### viewermilestone

When a viewer reaches a milestone in the channel (a watch streak)

```javascript
chat.on("USERNOTICE", (msg) => {
  if (!msg.isViewerMilestone()) return;

  /*
   * msg.eventParams are:
   * {
   *  // The amount of channel points (community points) the user has earned for this milestone
   *  "copoReward": 450,
   *  "copoRewardRaw": "450",
   *
   *  // The amount of streams the user has watched in a row
   *  "value": 15,
   *  "valueRaw": "15",
   *
   *  "category": "watch-streak",
   * }
   * Sender user of the USERNOTICE message is the user announcing their watch streak.
   */
  // mastondzn watched 15 consecutive streams this month and sparked a watch streak!
  console.log(
    `${msg.displayName} watched ${msg.value} consecutive streams this month and sparked a watch streak!`,
  );

  // Users are able to share a message with a milestone
  if (msg.messageText) {
    console.log(
      `${msg.displayName} shared the following message with the streamer: ${msg.messageText}`,
    );
  }
});
```

## Handling Shared Chat messages

Shared chat messages can be `USERNOTICE` messages or `PRIVMSG` messages.

```js
chat.on("USERNOTICE", (msg) => {
  if (msg.isSharedChat()) {
    // handle messages that originate from a chat that is currently in a "shared chat" session
    // NOTE: this does not necessarily mean that the message originates from a different chat
    if (msg.isSub()) {
      // do something
    } else if (msg.isResub()) {
      // do something
    }
  }

  if (msg.isSharedChat() && msg.channelID !== msg.sourceChannelID) {
    // handle messages that originate from a different chat
  }
});

chat.on("PRIVMSG", (msg) => {
  if (msg.isSharedChat()) {
    // handle messages that originate from a chat that is currently in a "shared chat" session
    // NOTE: this does not necessarily mean that the message originates from a different chat
  }

  if (msg.isSharedChat() && msg.channelID !== msg.sourceChannelID) {
    // handle messages that originate from a different chat
  }
});
```

Shared chat messages are duplicated if you are joined to 2 channels that are sharing each other's chat. [See Twitch's Documentation](https://dev.twitch.tv/docs/chat/irc/#shared-chat).

## ChatClient API

You probably will want to use these functions on `ChatClient` most frequently:

- `chat.join(channelName: string): Promise<void>` - Join (Listen to) the
  channel given by the channel name
- `chat.joinAll(channelNames: string[]): Promise<void>` - Join (Listen to) all
  of the listed channels at once (bulk join)
- `chat.part(channelName: string): Promise<void>` - Part (Leave/Unlisten) the
  channel given by the channel name
- `chat.privmsg(channelName: string, message: string): Promise<void>` - Send a
  raw `PRIVMSG` to the given channel. You can issue chat commands with this
  function, e.g. `chat.privmsg("forsen", "/timeout weeb123 5")` or normal
  messages, e.g. `chat.privmsg("forsen", "Kappa Keepo PogChamp")`.
- `chat.say(channelName: string, message: string): Promise<void>` - Say a
  normal chat message in the given channel. If a command is given as `message`,
  it will be escaped.
- `chat.me(channelName: string, message: string): Promise<void>` - Post a
  `/me` message in the given channel.
- `chat.ping()` - Send a `PING` on a connection from the pool, and awaits the
  `PONG` response. You can use this to measure server latency, for example.

Extra functionality:

- `chat.sendRaw(command: string): void` - Send a raw IRC command to a
  connection in the connection pool.
- `chat.unconnected (boolean)` - Returns whether the client is unconnected.
- `chat.connecting (boolean)` - Returns whether the client is connecting.
- `chat.connected (boolean)` - Returns whether the client is connected
  (Transport layer is connected).
- `chat.ready (boolean)` - Returns whether the client is ready (Logged into
  IRC server).
- `chat.closed (boolean)` - Returns whether the client is closed.

Note that channel names in the above functions always refer to the "login name"
of a twitch channel. Channel names may not be capitalized, e.g. `Forsen` would
be invalid, but `forsen` not. This library also does not accept the leading `#`
character and never returns it on any message objects (e.g. `msg.channelName`
would be `forsen`, not `#forsen`).

## API Documentation

Generated API documentation can be found here:
<https://mastondzn.github.io/dank-twitch-irc>

## Client options

Pass options to the `ChatClient` constructor. More available options are
documented in the Below are all possible options and their default values:

**Note! ALL of these configuration options are _optional_!** I highly recommend you
only set the very config options you need, the rest are usually at a reasonable default.  
For most bots, you only need to set `username` and `password`:

```javascript
const chat = new ChatClient({
  username: "your-bot-username",
  password: "0123456789abcdef1234567",
});
```

Nevertheless, here are examples of all possible config options:

```javascript
const chat = new ChatClient({
  username: "your-bot-username", // justinfan12345 by default - For anonymous chat connection
  password: "0123456789abcdef1234567", // undefined by default (no password)
  // Message rate limits configuration for verified and known bots
  // pick one of the presets or configure custom rates as shown below:
  rateLimits: "default",
  // or:
  rateLimits: "knownBot",
  // or:
  rateLimits: "verifiedBot",
  // or:
  rateLimits: {
    highPrivmsgLimits: 100,
    lowPrivmsgLimits: 20,
  },
  // Configuration options for the backing connections:
  // Plain TCP or TLS
  connection: {
    type: "tcp", // tcp by default
    secure: false, // true by default
    // host and port must both be specified at once
    host: "custom-chat-server.com", // irc.chat.twitch.tv by default
    port: 1234, // 6697/6667 by default, depending on the "secure" setting
  },
  // or:
  connection: {
    type: "websocket",
    secure: true, // use preset URL of irc-ws.chat.twitch.tv
  },
  // or:
  connection: {
    type: "websocket",
    url: "wss://custom-url.com/abc/def", // custom URL
  },
  // or:
  connection: {
    type: "duplex",
    stream: () => aNodeJsDuplexInstance, // read and write to a custom object
    // implementing the Duplex interface from Node.js
    // the function you specify is called for each new connection
    preSetup: true, // false by default, makes the lib skip login
    // and capabilities negotiation on connection startup
  },
  // how many channels each individual connection should join at max
  maxChannelCountPerConnection: 100, // 90 by default
  // custom parameters for connection rate limiting
  connectionRateLimits: {
    parallelConnections: 5, // 1 by default
    // time to wait after each connection before a new connection can begin
    releaseTime: 1000, // in milliseconds, 2 seconds by default
  },
  // I recommend you leave this off by default, it makes your bot faster
  // If you need live update of who's joining and leaving chat,
  // poll the tmi.twitch.tv chatters endpoint instead since it
  // is also more reliable
  requestMembershipCapability: false, // false by default
  // read more about mixins below
  // this disables the connection rate limiter, message rate limiter
  // and Room- and Userstate trackers (which are important for other mixins)
  installDefaultMixins: false, // true by default
  // Silence UnandledPromiseRejectionWarnings on all client methods
  // that return promises.
  // With this option enabled, the returned promises will still be rejected/
  // resolved as without this option, this option ONLY silences the
  // UnhandledPromiseRejectionWarning.
  ignoreUnhandledPromiseRejections: true, // false by default
});
```

## Features

This client currently supports the following features:

- Connection pooling and round-robin connection usage
- Automatic rate limiter for connection opening and chat commands
- All twitch-specific message types parsed (`CLEARCHAT`, `CLEARMSG`,
  `GLOBALUSERSTATE`, `HOSTTARGET`, `JOIN`, `NOTICE`, `PART`, `PING`, `PONG`,
  `PRIVMSG`, `RECONNECT`, `ROOMSTATE`, `USERNOTICE`, `USERSTATE`, `WHISPER`,
  `CAP`)
- Accurate response to server responses (e.g. error thrown if you are banned
  from channel/channel is suspended/login is invalid etc.)
- Bulk join functionality to join lots of channels quickly
- Implements the recommended connection control, utilizing `RECONNECT`, `PING`
  and `PONG`
- Full tracking of room state (e.g. submode, emote-only mode, followers mode,
  r9k etc.) and user state (badges, moderator state, color, etc).
- Most function calls return promises but errors can also be handled by
  subscribing to the error event
- Slow-mode rate limiter for non-VIP/moderator bots (waits either the global
  ~1.3 sec/channel-specific slow mode)
- Support for different types of transport (in-memory, TCP, WebSocket)

## Extra Mixins

There are some features you might find useful in your bot that are not necessary
for general client/bot operations, so they were packaged as **mixins**. You can
activate mixins by calling:

```javascript
import {
  AlternateMessageModifier,
  ChatClient,
} from "@mastondzn/dank-twitch-irc";

const chat = new ChatClient();
chat.use(new AlternateMessageModifier(client));
```

Available mixins are:

- `new AlternateMessageModifier(chat)` will allow your bot to send the same
  message within a 30 seconds period. You must also use `client.say` and
  `chat.me` for this mixin to behave consistently and reliably.
- `new SlowModeRateLimiter(chat, /* optional */ maxWaitingMessages)` will rate
  limit your messages in channels where your bot is not moderator, VIP or
  broadcaster and has to wait a bit between sending messages. If more than
  `maxWaitingMessages` are waiting, the outgoing message will be dropped
  silently. `maxWaitingMessages` defaults to 10. Note this mixin only has an
  effect on `chat.say` and `chat.me` functions, not `chat.privmsg`.

and the mixins installed by default:

- `new PrivmsgMessageRateLimiter(chat)` - Rate limits outgoing messages
  according to the rate limits imposed by Twitch. Configure the verified/known
  status of your bot using the config (see above).
- `new ConnectionRateLimiter(chat)` - Rate limits new connections according to
  the rate limits set in the config.
- `new UserStateTracker(chat)` - Used by other mixins. Keeps track of what
  state your bot user has in all channels.
- `new RoomStateTracker()` - Used by other mixins. Keeps track of each channel's
  state, e.g. sub-mode etc.
- `new IgnoreUnhandledPromiseRejectionsMixin()` - Silences
  `UnhandledPromiseRejectionWarning`s on promises returned by the client's
  functions. (installed for you if you activate the
  `ignoreUnhandledPromiseRejections` client option)
- `new JoinRateLimiter(chat)` - Rate limits new joins according to join rate
  limits set in the config.

## Tests

```bash
pnpm run test
```

## Lint and check code style

```bash
# Run eslint rules and checks code style with prettier
pnpm run lint
pnpm run format:check
```

```bash
# Run eslint and prettier fixing
pnpm run lint -- --fix
pnpm run format
```

[clearchat]: https://mastondzn.github.io/dank-twitch-irc/classes/ClearchatMessage
[clearmsg]: https://mastondzn.github.io/dank-twitch-irc/classes/ClearmsgMessage
[hosttarget]: https://mastondzn.github.io/dank-twitch-irc/classes/HosttargetMessage
[notice]: https://mastondzn.github.io/dank-twitch-irc/classes/NoticeMessage
[privmsg]: https://mastondzn.github.io/dank-twitch-irc/classes/PrivmsgMessage
[roomstate]: https://mastondzn.github.io/dank-twitch-irc/classes/RoomstateMessage
[usernotice]: https://mastondzn.github.io/dank-twitch-irc/classes/UsernoticeMessage
[userstate]: https://mastondzn.github.io/dank-twitch-irc/classes/UserstateMessage
[globaluserstate]: https://mastondzn.github.io/dank-twitch-irc/classes/GlobaluserstateMessage
[whisper]: https://mastondzn.github.io/dank-twitch-irc/classes/WhisperMessage
[join]: https://mastondzn.github.io/dank-twitch-irc/classes/JoinMessage
[part]: https://mastondzn.github.io/dank-twitch-irc/classes/PartMessage
[reconnect]: https://mastondzn.github.io/dank-twitch-irc/classes/ReconnectMessage
[ping]: https://mastondzn.github.io/dank-twitch-irc/classes/PingMessage
[pong]: https://mastondzn.github.io/dank-twitch-irc/classes/PongMessage
[cap]: https://mastondzn.github.io/dank-twitch-irc/classes/CapMessage
[ircmessage]: https://mastondzn.github.io/dank-twitch-irc/classes/IRCMessage
