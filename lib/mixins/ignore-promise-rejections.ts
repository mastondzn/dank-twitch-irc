import type { ClientMixin } from "./base-mixin";
import type { ChatClient } from "../client/client";
import { applyReplacements } from "../utils/apply-function-replacements";
import { ignoreErrors } from "../utils/ignore-errors";

function genericCatcher<V, A extends unknown[]>(
  originalFunction: (...arguments_: A) => Promise<V>,
  ...arguments_: A
): Promise<V | undefined> {
  const originalPromise = originalFunction(...arguments_);
  originalPromise.catch(ignoreErrors);
  return originalPromise;
}

export class IgnoreUnhandledPromiseRejectionsMixin implements ClientMixin {
  public applyToClient(client: ChatClient): void {
    applyReplacements(this, client, {
      join: genericCatcher,
      part: genericCatcher,
      privmsg: genericCatcher,
      say: genericCatcher,
      me: genericCatcher,
      ping: genericCatcher,
    });
  }
}
