/**
 * Splits a stream of text chunks into complete lines.
 *
 * Supports both CRLF and LF line endings, including a CRLF pair that is split
 * across two chunks.
 */
export class LineSplitter {
  private buffer = "";

  public push(chunk: string): string[] {
    this.buffer += chunk;
    return this.drain();
  }

  public flush(): string[] {
    const lines = this.drain();

    if (this.buffer.length > 0) {
      let line = this.buffer;
      if (line.endsWith("\r")) {
        line = line.slice(0, -1);
      }

      this.buffer = "";
      if (line.length > 0) {
        lines.push(line);
      }
    }

    return lines;
  }

  private drain(): string[] {
    const lines: string[] = [];
    let start = 0;

    for (let index = 0; index < this.buffer.length; index++) {
      if (this.buffer[index] !== "\n") {
        continue;
      }

      let line = this.buffer.slice(start, index);
      if (line.endsWith("\r")) {
        line = line.slice(0, -1);
      }

      lines.push(line);
      start = index + 1;
    }

    this.buffer = this.buffer.slice(start);
    return lines;
  }
}
