import { removeUndefinedFromObject } from './remove-undefined-from-object';

describe('remove-undefined-from-object', () => {
  it('should do nothing to an empty object', () => {
    expect(removeUndefinedFromObject({}))
      .toEqual({});
  });

  it('should do nothing to an object without undefineds', () => {
    expect(removeUndefinedFromObject({ a: 1, b: '2', c: false }))
      .toEqual({ a: 1, b: '2', c: false });
  });

  it('should remove undefined from only the top level', () => {
    expect(removeUndefinedFromObject({ a: undefined, b: false, c: { d: undefined } }))
      .toEqual({ b: false, c: { d: undefined }});
  });
});
