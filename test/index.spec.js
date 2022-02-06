/* eslint-env jest */
const { match, any, sequence } = require("../dist");

describe('string', () => {
  it('matches entire string', () => {
    const Name = match('jodabalocky yodaleyeehoo')
    expect(Name('jodabalocky yodaleyeehoo')).toEqual([24, ['jodabalocky yodaleyeehoo']]);
  });
});

describe('regexp', () => {
  it('regexp matches single character', () => {
    const Telephone = match(/[-0-9]/);
    expect(Telephone('123-456-7890')).toEqual(
      expect.arrayContaining([
        12, ['1', '2', '3', '-', '4', '5', '6', '-', '7', '8', '9', '0']
      ])
    );
  });
});

describe('match', () => {
  const MatchWord = match(/[a-zA-Z]/);

  it('tracks offset', () => {
    const [i] = MatchWord('abc123');
    expect(i).toEqual(3);
  });

  it('captures matches', () => {
    const [,m] = MatchWord('abc123');
    expect(m).toEqual(expect.arrayContaining(['a', 'b', 'c']));
  });

  it('returns null no match', () => {
    const [i, m] = MatchWord('&&*&^#');
    expect(i).toEqual(0);
    expect(m).toEqual(null);
  });

  it('imposes limits', () => {
    const MatchWordLimit = match(/[a-zA-Z]/, 1, 4);
    const [i, m] = MatchWordLimit('supercalifragilisticexpialidocious');
    expect(i).toEqual(4);
    expect(m).toEqual(expect.arrayContaining(['s', 'u', 'p', 'e']));
  });
});

describe('any', () => {
  it('matches', () => {
    const MatchAny = any([match(/[a-zA-Z]/), match(/[0-9]/), match('!')]);

    const [i, m] = MatchAny('hello!123!a');
    expect(i).toEqual(11);
    expect(m).toEqual(expect.arrayContaining([['h', 'e', 'l', 'l', 'o'], ['!'], ['1', '2', '3'], ['!'], ['a']]))
  });
  
  it('returns null without a match', () => {
    const MatchAny = any([match(/ /), match('=')]);
    const [i, m] = MatchAny('111');
    expect(i).toEqual(0);
    expect(m).toEqual(null);
  });

  it('imposes limits', () => {
    const MatchAny = any([match(/[a-z]/), match(/[A-Z]/), match(' '), match(/[0-9]/)], 2, 4);
    const [i, m] = MatchAny('TELLING 25 jokes');
    expect(i).toEqual(11);
    expect(m).toEqual(expect.arrayContaining([['T', 'E', 'L', 'L', 'I', 'N', 'G'], [' '], ['2', '5'], [' ']]));
  });
});

describe('sequence', () => {
  it('matches', () => {
    const MatchSeq = sequence([match('"'), match(/[a-zA-Z0-9]/), match('"')]);

    const [i, m] = MatchSeq('"Hello" is what he said');
    expect(i).toEqual(7);
    expect(m).toEqual(expect.arrayContaining([[['"'], ["H", "e", "l", "l", "o"], ['"']]]));
  });

  it('returns null without a match', () => {
    const MatchSeq = sequence([match(/\d/), match(/ /, 0), match(/[+*/-]/), match(/ /, 0), match(/\d/)]);
    const [i, m] = MatchSeq('a|b');
    expect(i).toEqual(0);
    expect(m).toEqual(null);
  })

  it('optionals without matches', () => {
    const MatchSeq = sequence([match(/\d/), match(/ /, 0), match(/[+*/-]/), match(/ /, 0), match(/\d/)]);

    const [i, [m]] = MatchSeq('1+2');
    expect(i).toEqual(3);
    expect(m[0]).toEqual(expect.arrayContaining(['1']));
    // optionals without matches are empty arrays
    expect(Array.isArray(m[1])).toEqual(true);
    expect(m[1].length).toEqual(0);
    expect(m[2]).toEqual(expect.arrayContaining(['+']));
    // optionals without matches are empty arrays
    expect(Array.isArray(m[3])).toEqual(true);
    expect(m[3].length).toEqual(0);
    expect(m[4]).toEqual(expect.arrayContaining(['2']));
  });

  it('optionals with matches', () => {
    const MatchSeq = sequence([match(/\d/), match(/ /, 0), match(/[+*/-]/), match(/ /, 0), match(/\d/)]);

    const [i, [m]] = MatchSeq('1 + 2');
    expect(i).toEqual(5);
    expect(m).toEqual(expect.arrayContaining([['1'], [' '], ['+'], [' '], ['2']]));
  });
});
