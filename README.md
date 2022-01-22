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

### Example

```
const Digits = match(/[0-9]/);
const Numbers = sequence([Digits, sequence([match('.'), Digits], 0)]);
const Plus = sequence([Numbers, match('+'), Numbers]);
const Minus = sequence([Numbers, match('-'), Numbers]);
const Multiply = sequence([Numbers, match('*'), Numbers]);
const Divide = sequence([Numbers, match('/'), Numbers]);
const BinaryOp = any([Plus, Minus, Multiply, Divide]);
const Parser = any([BinaryOp, Numbers, Digits]);

Parser('5+5') // => [3, [['5', '+', '5']]];
```

## API

### `match(pattern: string | RegExp, min?: number, max?: number): Matcher`

The `match` parser takes a `pattern`. If `pattern` is a `RegExp` remember that
it will only match against _a single character of input_ at a time.

```
match('wow')('wow') // => [3, 'wow']
match('wow')('wowwow') // => [6, 'wowwow']
match('wow')('wowow') // => [3, 'wow']

match(/[wo]/)('wo') // => [2, 'wo']
match(/[wo]/)('wowww') // => [5, 'wowww']
```

### `sequence(patterns: Array<Matcher>, min?: number, max?: number): Matcher`

The `sequence` parser takes an ordered array of `Matcher`s, returning an array
of tokens, each entry pertaining to the match specified within the `patterns`.

```
sequence([
  match('w'),
  match('o'),
  match('w')
])('wow') // => [3, [ ['w', 'o', 'w'] ] ]

sequence([
  match(/[0-9]/, 3),
  match('-'),
  match(/[0-9]/, 3),
  match('-'),
  match(/[0-9]/, 4),
])('123-456-7890') // => [ 12, [ [ '123', '-', '456', '-', '7890' ] ] ]
```

### `any(patterns: Array<Matcher>, min?: number, max?: number): Matcher`

The `any` parser takes an unordered array of `Matcher`s, returning an array
of tokens, each entry pertaining to _any_ match within the `patterns`.

```
any([
  match(/[0-9]/),
  match(/[a-z ]/),
  match('Jodabalocky'),
])('Jodabalocky is 33') // => [ 17, [ [ 'jodabalocky' ], [ ' is ' ], [ '33' ] ] ]
```

## Types

```
PrimitiveMatch: [number, string | null]
CompoundMatch: [number, string[] | null]
```
