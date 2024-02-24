import { ParseError } from "./parse-error";
import { parseTags } from "./tags";
import { IRCMessage } from "../irc/irc-message";
import type { IRCMessageTags } from "../irc/tags";

const VALID_CMD_REGEX = /^(?:[A-Za-z]+|\d{3})$/;

export function parseIRCMessage(messageSource: string): IRCMessage {
  let remainder = messageSource;

  let ircTags: IRCMessageTags;
  if (messageSource.startsWith("@")) {
    remainder = remainder.slice(1); // remove @ sign

    const spaceIndex = remainder.indexOf(" ");
    if (spaceIndex < 0) {
      // not found
      throw new ParseError(
        `No space found after tags declaration (given src: "${messageSource}")`,
      );
    }

    const tagsSource = remainder.slice(0, spaceIndex);

    if (tagsSource.length === 0) {
      throw new ParseError(
        `Empty tags declaration (nothing after @ sign) (given src: "${messageSource}")`,
      );
    }

    ircTags = parseTags(tagsSource);
    remainder = remainder.slice(spaceIndex + 1);
  } else {
    ircTags = {};
  }

  let ircPrefix;
  let ircPrefixRaw;
  if (remainder.startsWith(":")) {
    remainder = remainder.slice(1); // remove : sign

    const spaceIndex = remainder.indexOf(" ");
    if (spaceIndex < 0) {
      // not found
      throw new ParseError(
        `No space found after prefix declaration (given src: "${messageSource}")`,
      );
    }

    ircPrefixRaw = remainder.slice(0, spaceIndex);
    remainder = remainder.slice(spaceIndex + 1);

    if (ircPrefixRaw.length === 0) {
      throw new ParseError(
        `Empty prefix declaration (nothing after : sign) (given src: "${messageSource}")`,
      );
    }

    if (ircPrefixRaw.includes("@")) {
      // full prefix (nick[[!user]@host])
      // valid forms:
      // nick (but this is not really possible to differentiate
      //       from the hostname only, so if we don't get any @
      //       we just assume it's a hostname.)
      // nick@host
      // nick!user@host

      // split on @ first, then on !
      const atIndex = ircPrefixRaw.indexOf("@");
      const nickAndUser = ircPrefixRaw.slice(0, atIndex);
      const host = ircPrefixRaw.slice(atIndex + 1);

      // now nickAndUser is either "nick" or "nick!user"
      // => split on !
      const exclamationIndex = nickAndUser.indexOf("!");
      let nick;
      let user;
      if (exclamationIndex < 0) {
        // no ! found
        nick = nickAndUser;
        user = undefined;
      } else {
        nick = nickAndUser.slice(0, exclamationIndex);
        user = nickAndUser.slice(exclamationIndex + 1);
      }

      if (
        host.length === 0 ||
        nick.length === 0 ||
        (user != null && user.length === 0)
      ) {
        throw new ParseError(
          `Host, nick or user is empty in prefix (given src: "${messageSource}")`,
        );
      }

      ircPrefix = {
        nickname: nick,
        username: user,
        hostname: host,
      };
    } else {
      // just a hostname or just a nickname
      ircPrefix = {
        nickname: undefined,
        username: undefined,
        hostname: ircPrefixRaw,
      };
    }
  } else {
    ircPrefix = undefined;
    ircPrefixRaw = undefined;
  }

  const spaceAfterCommandIndex = remainder.indexOf(" ");

  let ircCommand;
  let ircParameters;

  if (spaceAfterCommandIndex < 0) {
    // no space after commands, i.e. no params.
    ircCommand = remainder;
    ircParameters = [];
  } else {
    // split command off
    ircCommand = remainder.slice(0, spaceAfterCommandIndex);
    remainder = remainder.slice(spaceAfterCommandIndex + 1);

    ircParameters = [];

    // introduce a new variable so it can be null (typescript shenanigans)
    let parametersRemainder: string | null = remainder;
    while (parametersRemainder !== null) {
      if (parametersRemainder.startsWith(":")) {
        // trailing param, remove : and consume the rest of the input
        ircParameters.push(parametersRemainder.slice(1));
        parametersRemainder = null;
      } else {
        // middle param
        const spaceIndex = parametersRemainder.indexOf(" ");

        let parameter;
        if (spaceIndex < 0) {
          // no space found
          parameter = parametersRemainder;
          parametersRemainder = null;
        } else {
          parameter = parametersRemainder.slice(0, spaceIndex);
          parametersRemainder = parametersRemainder.slice(spaceIndex + 1);
        }

        if (parameter.length === 0) {
          throw new ParseError(
            `Too many spaces found while trying to parse middle parameters (given src: "${messageSource}")`,
          );
        }
        ircParameters.push(parameter);
      }
    }
  }

  if (!VALID_CMD_REGEX.test(ircCommand)) {
    throw new ParseError(
      `Invalid format for IRC command (given src: "${messageSource}")`,
    );
  }

  ircCommand = ircCommand.toUpperCase();

  return new IRCMessage({
    rawSource: messageSource,
    ircPrefixRaw,
    ircPrefix,
    ircCommand,
    ircParameters,
    ircTags,
  });
}
