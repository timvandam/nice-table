declare module 'wrap-ansi' {
  /**
   * Wrap words to the specified column width.
   *
   * @param input   String with ANSI escape codes. Like one styled by chalk.
   * @param columns Number of columns to wrap the text to.
   * @param options By default the wrap is soft, meaning long words may extend past the column width. Setting
   *                this to true will make it hard wrap at the column width.
   */
  export default function wrapAnsi(
    input: string,
    columns: number,
    options: Partial<Options> = {
      hard: false,
      wordWrap: true,
      trim: true,
    },
  ): string;

  export interface Options {
    hard: boolean;
    wordWrap: boolean;
    trim: boolean;
  }
}
