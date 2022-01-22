/* eslint-env jest */
const { match, any, sequence } = require("../dist");

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
});

describe('any', () => {
  const MatchAny = any([match(/[a-zA-Z]/), match(/[0-9]/), match('!')]);

  it('unordered consecutive matches', () => {
    const [i, m] = MatchAny('hello!123!a');
    expect(i).toEqual(11);
    expect(m).toEqual(expect.arrayContaining([['h', 'e', 'l', 'l', 'o'], '!', ['1', '2', '3'], '!', 'a']))
  });
});

describe('sequence', () => {
  const MatchSeq = sequence([match('"'), match(/[a-zA-Z0-9]/), match('"')]);

  it('matches sequence', () => {
    const [i, m] = MatchSeq('"Hello" is what he said');
    expect(i).toEqual(7);
    expect(m).toEqual(expect.arrayContaining([['"', "H", "e", "l", "l", "o", '"']]));
  });
});
