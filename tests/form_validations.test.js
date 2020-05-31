import { validatesStartBeforeEnd } from '../src/form_validations'

describe('validatesStartBeforeEnd', () => {
  let start, end;
  beforeEach(() => {
    start = { value: "10:00", setCustomValidity: jest.fn() };
    end = { value: "11:00", setCustomValidity: jest.fn() };
  });

  it('should return a function', () => {
    expect(validatesStartBeforeEnd(start, end)).toBeInstanceOf(Function);
  });

  it('should call setCustomValidity with an empty string', () => {
    validatesStartBeforeEnd(start, end)();
    expect(start.setCustomValidity.mock.calls[0][0]).toBe('');
  });

  describe('when start is earlier than end', () => {
    beforeEach(() => {
      start.value = "10:00";
      end.value = "09:00";
    });

    it('should call setCustomValidity with an error message', () => {
      validatesStartBeforeEnd(start, end)();
      expect(start.setCustomValidity.mock.calls[0][0]).not.toBe('');
    });
  });

  describe('when start is the same as end', () => {
    beforeEach(() => {
      start.value = "10:00";
      end.value = "10:00";
    });

    it('should call setCustomValidity with an error message', () => {
      validatesStartBeforeEnd(start, end)();
      expect(start.setCustomValidity.mock.calls[0][0]).not.toBe('');
    });
  });
});
