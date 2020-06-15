import ModalBox from "./modal_box";

export default class DraftTimeboxModal extends ModalBox {
  createElement(startMinute, endMinute) {
    // Timebox outer container.
    let el = document.createElement('article');
    el.classList.add('timebox', 'timebox-draft');
    el.style.setProperty('--start-minute', startMinute);
    el.style.setProperty('--end-minute', endMinute);

    // Form.
    const form = document.createElement('form');
    el.appendChild(form);

    // Details input.
    const details = document.createElement('textarea');
    details.name = 'details';
    details.placeholder = 'Work on something deeply';
    // Prevent adding line breaks (incl. from copy&paste).
    details.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\n/g, '');
    });
    form.appendChild(details);

    // Submit button.
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    // Wire hitting 'enter' in the textarea to clicking submit.
    details.addEventListener('keydown', e => {
      if (e.key == "Enter" && details.value !== "") {
        form.requestSubmit();
      }
    });
    form.appendChild(submitBtn);

    // Abort (x) button.
    const closeBtn = document.createElement('div');
    closeBtn.className = 'closeBtn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();  // Avoid opening a new timebox underneath.
      this.remove();
    });
    el.appendChild(closeBtn);

    // Abort by hitting esc
    el.addEventListener('keydown', e => {
      if (e.key == "Escape") {
        this.remove();
      }
    });

    // Stop clicks into the box from moving the box to a new time.
    el.addEventListener('click', e => e.stopPropagation());

    return el;
  }
}
