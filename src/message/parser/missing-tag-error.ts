import { MissingDataError } from "./missing-data-error";
import { reasonForValue } from "~/utils/reason-for-value";

export class MissingTagError extends MissingDataError {
  tagKey: string;
  actualValue: string | null | undefined;

  constructor(
    tagKey: string,
    actualValue: string | null | undefined,
    cause?: Error,
  ) {
    super(
      `Required tag value not present at key "${tagKey}" (is ${reasonForValue(
        actualValue,
      )})`,
      cause,
    );

    this.tagKey = tagKey;
    this.actualValue = actualValue;
  }
}
