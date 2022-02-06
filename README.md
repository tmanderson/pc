# P(arser)C(ombinator)

PC is minimal zero-dependency [parser combinator](https://en.wikipedia.org/wiki/Parser_combinator)
framework enabling intuitive and modular parser development.

PC provides four fundamental parsers:

- `string` for matching exact strings
- `regexp` for matching character ranges
- `sequence` for matching ordered patterns of parsers (i.e. all patterns must match, one after the other)
- `any` for matching any number of patterns in any order (i.e. at least one pattern must match)

Both the `string` and `regexp` parser can be created with the `match` parser,
which is just a convenience function which maps your argument (a `string` or
`RegExp`) to the `string` or `regexp` parser.

All parsers in PC have the following signature:

```ts
(input: string) => [offset: number, matches: string[] | string | null]
```

Where `input` is the remaining input to be parsed, `offset` is the length of input
consumed or matched by the parser and `matches` is an array of strings or single
string (signifying a successful match) or `null` (signifying no match). See the
[Types](#Types) section for more detail.

### Install

```
npm i @tmanderson/pc
```

### Example

A toy XML parser could begin with something like this

```js
const TagOpen = match('<', 1, 1); // match for one and only one `<` character
const TagClose = match('>', 1, 1); // matches for one and only one `>`
const Slash = match('/', 1, 1); // matches for one and only one `/`
const Word = match(/[-a-zA-Z]/); // capital and lowercase letters and `-` characters
const Whitespace = match(/[\n\t\r ]/); // zero or more matches
const OptionalWhitespace = match(/[\n\t\r ]/, 0); // zero or more matches

const Words = any([Word, Whitespace, match(/[:\/_.]/)]); // words and whitespace

const OptionalAttributes = sequence([
  OptionalWhitespace, // ` `
  Word, // a word
  match('='),
  match('"', 1, 1), // followed by a double-quote
  Words, // then words
  match('"', 1, 1) // and finally a closing double-quote
], 0);

const TagChildren = any([
  Words,
  Whitespace,
  i => Tag(i) // lazy evaluation (also enables self-recursive matches)
], 0);

// <tag attr="val" ... />
const SelfClosingTag = sequence([TagOpen, Word, OptionalAttributes, OptionalWhitespace, Slash, TagClose]);
// <tag attr="val" ...>
const OpeningTag = sequence([TagOpen, Word, OptionalAttributes, OptionalWhitespace, TagClose]);
// </tag>
const ClosingTag = sequence([TagOpen, Slash, Word, TagClose]);
// <tag attr="val" ...> ... </tag>
const TagWithChildren = sequence([OpeningTag, TagChildren, ClosingTag]);
const Tag = any([SelfClosingTag, TagWithChildren]);

const Parse = any([Whitespace, Words, Tag]);

Parse('<body></body>');
Parse(`
  <body>
    PC is minimal <a href="https://en.wikipedia.org/wiki/Parser_combinator">
    parser combinator</a> framework enabling intuitive and modular parser
    development.  
  </body>
`);
```

### Formatting output

All PC parsers take a single argument (an `input` string) and return a [`MatcherResult`](#Types).
This makes interstitial operations (within the parsing context) a matter of defining
a function with this input/ouput signature. Within that function you can manipulate
input, output, the parser offset and/or the outputs of other parsers called within
the function itself.

A common use-case of this might be in the concatenation of consecutive `string`
matches. For example, the parser `match('a')` would, given the input `'aaab'`,
return `['a', 'a', 'a']` which can become daunting when reading through your parser
output. It would be better if the output were `['aaa']`. We can resolve this issue
by creating a `concat` utility for our simple parser:

```js
const SimpleParser = match('a');
SimpleParser('aaab') // => [ 3, [ 'a', 'a', 'a' ] ]

const concat = (input) => {
  // SimpleParser returns a PrimitiveMatch [number, string]
  const [inputOffset, matches] = SimpleParser(input);
  // if `matches` is null, this implies no matches (so inputOffset is 0)
  if (matches === null) return [0, null];
  // Otherwise return the same offset (we're not reducing/consuming extra input)
  // and concatenate all the matches from AlphaN
  return [inputOffset, matches.join('')]
}

concat('aaab') // => [ 3, [ 'aaa' ] ]
```

If you're one for concision, this function can be greatly minimized with an
[IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE):

```js
const concat = (input) =>
  (([inputOffset, matches]) =>
    [inputOffset, matches ? matches.join('') : null])(SimpleParser(input))
```

## API

### `match(pattern: string | RegExp, min?: number, max?: number): MatcherResult`

The `match` parser takes a `pattern`. If `pattern` is a `RegExp` remember that
it will only match against _a single character of input_ at a time (because the
length of a match is assumed _intentionally_ indeterminate).

```js
match('wow')('wow') // => [3, 'wow']
match('wow')('wowwow') // => [6, ['wow', 'wow']]
match('wow')('wowow') // => [3, 'wow']

match(/[wo]/)('wo') // => [2, ['w' ,'o']]
match(/[wo]/)('wowww') // => [5, ['w', 'o', 'w', 'w', 'w']]
```

### `sequence(patterns: Array<Matcher>, min?: number, max?: number): MatcherResult`

The `sequence` parser takes an ordered array of `Matcher`s, returning an array
of tokens, each entry pertaining to the match specified within the `patterns`.

```js
sequence([
  match('w'),
  match('o'),
  match('w')
])('wow') // => [ 3, [ [ ['w'], ['o'], ['w'] ] ] ]

sequence([
  match(/[0-9]/, 3),
  match('-'),
  match(/[0-9]/, 3),
  match('-'),
  match(/[0-9]/, 4),
])('123-456-7890') /* =>
[ 12, [
    [
      [ '1', '2', '3' ],
      [ '-' ],
      [ '4', '5', '6' ],
      [ '-' ],
      [ '7', '8', '9', '0' ]
    ]
  ]
] */
```

### `any(patterns: Array<Matcher>, min?: number, max?: number): MatcherResult`

The `any` parser takes an unordered array of `Matcher`s, returning an array
of tokens, each entry pertaining to _any_ match within the `patterns`.

```js
any([
  match(/[0-9]/),
  match(/[a-z ]/),
  match('Jodabalocky'),
])('Jodabalocky is 77') // =>
// [ 17, [ [ 'jodabalocky' ], [ ' ', 'i', 's', ' ' ], [ '7', '7' ] ] ]
```

## Types

All parsers utilized by PC require an output of `MatcherResult`. The following
breaks down the definition a bit more:

```ts
type NoMatch = null;
type Match = string;
type Matches = string[];

type MatcherResult = [offset: number, matches: MatchGroup | Match | NoMatch];
```

The `offset` value represents the total number of input characters consumed by
the parser while the second argument represents the matches made by it. If `matches`
returns `null` this indicates that the input was not successfully parsed.
