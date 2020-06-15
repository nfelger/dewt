import ModalBox from '../src/modal_box';


class MyModalBox extends ModalBox {
};

let parent;
let createBox = () => new MyModalBox(parent);

beforeEach(() => {
  ModalBox.element = null;
  MyModalBox.prototype.createElement = jest.fn(() => document.createElement('div'));
  MyModalBox.prototype.isPristine = jest.fn(() => true);
  parent = document.body.appendChild(document.createElement('div'));
});

describe('constructor', () => {
  it('should return immediately if maybeRemove() fails because a dirty box is present', () => {
    ModalBox.element = 'some element';
    MyModalBox.prototype.isPristine.mockReturnValue(false);
    let origFlash = ModalBox.prototype.flash;
    ModalBox.prototype.flash = jest.fn();
    try {
      let box = createBox();
      expect(MyModalBox.prototype.createElement).toHaveBeenCalledTimes(0);
    } finally {
      ModalBox.prototype.flash = origFlash;
    }
  });

  it('should call createElement on this', () => {
    let box = createBox();
    expect(MyModalBox.prototype.createElement).toHaveBeenCalledTimes(1);
  });

  it('should append the created element to the parent', () => {
    MyModalBox.prototype.createElement.mockReturnValue('an element');
    parent.appendChild = jest.fn();
    createBox();
    expect(parent.appendChild).toHaveBeenCalledWith('an element');
  });

  it('should save the element on the ModalBox class', () => {
    MyModalBox.prototype.createElement.mockReturnValue('an element');
    parent.appendChild = jest.fn();
    createBox();
    expect(ModalBox.element).toBe('an element');
  });
});

describe('maybeRemove()', () => {
  it('should return true if there is no element', () => {
    let box = createBox();
    expect(box.maybeRemove()).toBe(true);
  });

  it('should remove() and return true if the box isPristine()', () => {
    let box = createBox();
    box.remove = jest.fn();
    expect(box.maybeRemove()).toBe(true);
    expect(box.remove).toHaveBeenCalledTimes(1);
  });

  it("should flash() and return false if the box isn't isPristine()", () => {
    let box = createBox();
    box.isPristine.mockReturnValue(false);
    box.flash = jest.fn();

    expect(box.maybeRemove()).toBe(false);
    expect(box.flash).toHaveBeenCalledTimes(1);
  });
});

describe('remove()', () => {
  it('should remove the element', () => {
    let box = createBox();
    let remove = MyModalBox.element.remove = jest.fn();

    box.remove();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('should set ModalBox.element to null', () => {
    let box = createBox();

    box.remove();
    expect(ModalBox.element).toBe(null);
  });
});
