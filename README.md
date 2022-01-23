# P(arser)C(ombinator)

PC is minimal [parser combinator](https://en.wikipedia.org/wiki/Parser_combinator)
framework enabling intuitive and modular parser development.

PC provides four fundamental parsers:

- `string` for matching exact strings
- `regexp` for matching character ranges
- `sequence` for matching ordered patterns of parsers
- `any` for matching any number of patterns in any order

Both the `string` and `regexp` parser can be created with the `match` parser,
which is just a convenience function which maps your argument (a `string` or
`RegExp`) to the `string` or `regexp` parser.

### Install

```
npm i @tmanderson/pc
```

### Example

```js
const Digits = match(/[0-9]/);
const Numbers = sequence([Digits, sequence([match('.'), Digits], 0)]);
const Plus = sequence([Numbers, match('+'), Numbers]);
const Minus = sequence([Numbers, match('-'), Numbers]);
const Multiply = sequence([Numbers, match('*'), Numbers]);
const Divide = sequence([Numbers, match('/'), Numbers]);
const BinaryOp = any([Plus, Minus, Multiply, Divide]);
const Parser = any([BinaryOp, Numbers, Digits]);

Parser('5+5') // => [3, [['5', '+', '5']]]
Parser('5.1') // => [3, [['5', '.', '1']]]
```

### Formatting output

All PC parsers take a single argument (an `input` string) and return a [Match](#Types).
This makes interstitial operations (within the parsing context) a matter of defining
a function with this input/ouput signature. Within that function you can manipulate
input, output, the parser offset and/or the outputs of other parsers called within
the function itself.

```js
const AlphaNumeric = match(/[a-zA-Z0-9]/);
AlphaNumeric('Hello') // => [5, [ 'H', 'e', 'l', 'l', 'o' ] ]

const FormattedAlphaNumeric = (input) => {
  // AlphaNumeric parser returns a PrimitiveMatch [number, string]
  const [inputOffset, matches] = AlphaNumeric(input);
  // if `matches` is null, this implies no matches (so inputOffset is 0)
  if (matches === null) return [0, null];
  // Otherwise return the same offset (we're not reducing/consuming extra input)
  // and concatenate all the matches from AlphaN
  return [inputOffset, matches.join('')]
}

FormattedAlphaNumeric('Hello') // => [5, ['Hello']]
```

If you're one for concision, this function can be greatly minimized with an [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE):

```js
const FormattedAlphaNumeric = (input) =>
  (([inputOffset, matches]) =>
    [inputOffset, matches ? matches.join('') : null])(AlphaNumeric(input))
```

## API

### `match(pattern: string | RegExp, min?: number, max?: number): PrimitiveMatch`

The `match` parser takes a `pattern`. If `pattern` is a `RegExp` remember that
it will only match against _a single character of input_ at a time.

```js
match('wow')('wow') // => [3, 'wow']
match('wow')('wowwow') // => [6, 'wowwow']
match('wow')('wowow') // => [3, 'wow']

match(/[wo]/)('wo') // => [2, 'wo']
match(/[wo]/)('wowww') // => [5, 'wowww']
```

### `sequence(patterns: Array<Matcher>, min?: number, max?: number): CompoundMatch`

The `sequence` parser takes an ordered array of `Matcher`s, returning an array
of tokens, each entry pertaining to the match specified within the `patterns`.

```js
sequence([
  match('w'),
  match('o'),
  match('w')
])('wow') // => [ 3, [ [ 'w', 'o', 'w' ] ] ]

sequence([
  match(/[0-9]/, 3),
  match('-'),
  match(/[0-9]/, 3),
  match('-'),
  match(/[0-9]/, 4),
])('123-456-7890') // =>
// [ 12, [ [ '1', '2', '3', '-', '4', '5', '6', '-', '7', '8', '9', '0' ] ] ]
```

### `any(patterns: Array<Matcher>, min?: number, max?: number): CompoundMatch`

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

All parsers utilized by PC require an output of either the following types:

```ts
type PrimitiveMatch = [number, string | null];
type CompoundMatch = [number, string[] | null];
```

The `number` value represents the total number of input characters consumed by
the parser while the second argument represents the match. If `null` the input
was not successfully parsed.
