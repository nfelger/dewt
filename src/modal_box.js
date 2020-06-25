export default class ModalBox {
  constructor(parent, ...createArgs) {
    if (!this.maybeRemove()) { return; }

    ModalBox.element = this.createElement(...createArgs);
    parent.appendChild(ModalBox.element);
  }

  createElement() {
    throw new Error('Not implemented! Override in subclass.')
  }

  isPristine() {
    return isPristine(ModalBox.element);
  }

  maybeRemove() {
    if (!ModalBox.element) { return true; }

    if (this.isPristine()) {
      this.remove();
      return true;
    } else {
      this.flash();
      return false;
    }
  }

  remove() {
    ModalBox.element.remove();
    ModalBox.element = null;
  }

  flash() {
    flash(ModalBox.element);
  }
};

export function isPristine(element) {
  let formControls = Array.from(element.querySelectorAll('input, textarea'));
  return formControls.every(i => i.defaultValue === i.value);
}

export function flash(element) {
  element.classList.add('box-flash');
  setTimeout(() => {
    if (element) {  // User may have closed it already.
      element.classList.remove('box-flash');
    }
  }, 800);
}
