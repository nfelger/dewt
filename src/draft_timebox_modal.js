import ModalBox from "./modal_box";

export default class DraftTimeboxModal extends ModalBox {
  createElement(startMinute, endMinute) {
    // Timebox outer container.
    let el = document.createElement('article');
    el.classList.add('timebox', 'timebox-draft');
    el.style.setProperty('--start-minute', startMinute);
    el.style.setProperty('--end-minute', endMinute);

    el.insertAdjacentHTML('beforeend', `
      <form action="">
        <textarea name="details" placeholder="Work on something deeply"></textarea>
        <button type="submit"></button>
      </form>
      <div class="closeBtn">×</div>
    `);

    const details = el.querySelector('textarea');

    // Wire adding line breaks (from hitting enter but also from copy&paste) to a form submit.
    details.addEventListener('input', () => {
      const endsInNewline = details.value.slice(-1) === '\n';
      details.value = details.value.replace(/\n/g, '');

      if (details.value !== "" && endsInNewline) {
        el.querySelector('form').requestSubmit();
      }
    });

    // Abort button (x).
    const closeBtn = el.querySelector('.closeBtn');
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();  // Avoid opening a new timebox underneath.
      this.remove();
    });

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
