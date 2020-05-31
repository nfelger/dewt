import * as helpers from '../src/helpers';

test('divmod should return integer quotient and remainder', () => {
 expect(helpers.divmod(10, 6)).toEqual([1, 4]);
});

test('zeroPad should pad single digits', () => {
  expect(helpers.zeroPad(1)).toBe('01');
});

test('zeroPad should leave double digits alone', () => {
  expect(helpers.zeroPad(10)).toBe('10');
});

test('minutesToTimeStr should convert minutes to the appropriate 24h time', () => {
  expect(helpers.minutesToTimeStr(8*60 + 13)).toBe('08:13');
});

test('timeStrToMinutes should parse minutes from 24h time', () => {
  expect(helpers.timeStrToMinutes('8:13')).toBe(8*60 + 13);
});

test('iso8601date should return yyyy-mm-dd formated date', () => {
  expect(helpers.iso8601date(new Date(2020, 0, 1))).toBe('2020-01-01');
});

test('kebabToCamel should convert kebab-case to lowerCamelCase', () => {
  expect(helpers.kebabToCamel('some-identifier')).toBe('someIdentifier');
});
