type PrimitiveMatch = [number, string | null];
type CompoundMatch = [number, Array<string> | null];
// user defines the return value here
type FormatFunction<ReturnType = any> = (tokens: string | string[]) => ReturnType;
type MatcherFunction = (input: string) => PrimitiveMatch | CompoundMatch;
type MatchLimit = number | '*' | '+';

const matcher = (pattern: MatcherFunction, _min: MatchLimit = 1, _max?: MatchLimit): MatcherFunction =>
  (input: string): PrimitiveMatch | CompoundMatch => {
    const min = _min === '*' || _min === 0 ? 0 : _min === '+' ? 1 : _min;
    const max = !_max && _max !== 0 ? -1 : _max;
    
    let i = 0;
    let matches = 0;
    const tokens: Array<string | string[]> = [];

    while(i < input.length && (max < min || matches < max)) {
      const [n, m] = pattern(input.substring(i));
      if (m === null) break; // pattern FAILED
      // we concatenate primitive (i.e. string/regexp) matches
      tokens.push(m as string | string[]);
      matches++;
      i += n;
    }

    return (matches < min ? [0, null] : [i, tokens]) as PrimitiveMatch | CompoundMatch;
  };

const regexp = (regexp: RegExp, min?: number, max?: number): MatcherFunction =>
  matcher(
    (input: string): PrimitiveMatch =>
      regexp.test(input.charAt(0))
        ? [1, input.charAt(0)]
        : [0, null],
    min,
    max
  );

const string = (string: string, min?: number, max?: number): MatcherFunction =>
  matcher(
    (input: string): PrimitiveMatch =>
      string === input.substring(0, string.length)
        ? [string.length, input.substring(0, string.length)]
        : [0, null],
    min,
    max
  );

export const match = (pattern: RegExp | string, min?: number, max?: number): MatcherFunction =>
  typeof pattern === 'string' ? string(pattern, min, max) : regexp(pattern, min, max);

export const sequence = (patterns: MatcherFunction[], min?: number, max?: number): MatcherFunction =>
  matcher(
    (input: string): CompoundMatch | PrimitiveMatch =>
      patterns.reduce(([offset, matches], p, i) => {
        if (i > 0 && matches === null) return [0, null];
        const [n, t] = p(input.substring(offset));
        // null indicates that pattern FAILED
        if (t === null) return [0, null];
        return [offset + n, matches!.concat(t.length === 1 ? t[0] : t)];
      }, [0, []]),
    min,
    max
  );

export const any = (patterns: MatcherFunction[], min?: number, max?: number): MatcherFunction =>
  matcher(
    (input: string): CompoundMatch | PrimitiveMatch =>
      patterns.reduce(([offset, matches], p, i) => {
        if (matches !== null) return [offset, matches];
        const [n, t] = p(input.substring(offset));
        // null indicates that pattern FAILED
        if (t === null) return [0, null];
        return [n, t.length === 1 ? t[0] : t];
      }, [0, null]),
    min,
    max
  );
