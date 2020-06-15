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
    let formControls = Array.from(ModalBox.element.querySelectorAll('input, textarea'));
    return formControls.every(i => i.defaultValue === i.value);
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
    ModalBox.element.classList.add('box-flash');
    setTimeout(() => {
      if (ModalBox.element) {  // User may have closed it already.
        ModalBox.element.classList.remove('box-flash');
      }
    }, 800);
  }
};
