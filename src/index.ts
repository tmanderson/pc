type MatcherResult = [number, Array<string> | string | null];
// user defines the return value here
type FormatFunction<ReturnType = any> = (tokens: string | string[]) => ReturnType;
type MatcherFunction = (input: string) => MatcherResult;

const matcher = (pattern: MatcherFunction, min: number = 1, max: number = -1): MatcherFunction =>
  (input: string): MatcherResult => {
    let i = 0;
    let matches = 0;
    const tokens: Array<string | string[]> = [];

    while(i < input.length && (max < min || matches < max)) {
      const [n, m] = pattern(input.substring(i));
      if (m === null) break; // pattern FAILED
      // we concatenate primitive (i.e. string/regexp) matches
      tokens.push(m);
      matches++;
      i += n;
    }

    return (matches < min ? [0, null] : [i, tokens]) as MatcherResult;
  };

const regexp = (regexp: RegExp, min?: number, max?: number): MatcherFunction =>
  matcher(
    (input: string): MatcherResult =>
      regexp.test(input.charAt(0))
        ? [1, input.charAt(0)]
        : [0, null],
    min,
    max
  );

const string = (string: string, min?: number, max?: number): MatcherFunction =>
  matcher(
    (input: string): MatcherResult =>
      string === input.substring(0, string.length)
        ? [string.length, input.substring(0, string.length)]
        : [0, null],
    min,
    max
  );

export const match = (pattern: RegExp | string | MatcherFunction, min?: number, max?: number): MatcherFunction =>
  typeof pattern === 'string'
    ? string(pattern, min, max)
    : typeof pattern === 'object'
      ? regexp(pattern, min, max)
      : matcher(pattern, min, max);


export const sequence = (patterns: MatcherFunction[], min?: number, max?: number): MatcherFunction =>
  matcher(
    (input: string): MatcherResult =>
      patterns.reduce(([offset, matches], p, i) => {
        // once failed, fail to the end, fail always
        if (i > 0 && matches === null) return [0, null];
        const [n, t] = p(input.substring(offset));
        // null indicates that pattern FAILED
        if (t === null) return [0, null];
        return [offset + n, matches!.concat([t])];
      }, [0, []]),
    min,
    max
  );

export const any = (patterns: MatcherFunction[], min?: number, max?: number): MatcherFunction =>
  matcher(
    (input: string): MatcherResult =>
      patterns.reduce(([offset, matches], p, i) => {
        // once a match is found, continue to return the match
        if (matches !== null) return [offset, matches];
        const [n, t] = p(input.substring(offset));
        return [n, t];
      }, [0, null]),
    min,
    max
  );
