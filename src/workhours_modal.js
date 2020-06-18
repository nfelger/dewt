import ModalBox from "./modal_box";
import { minutesToTimeStr } from "./helpers";
import { validatesStartBeforeEnd } from "./form_validations";

export default class WorkhoursModalBox extends ModalBox {
  createElement(startMinute, endMinute) {
    let el = document.createElement('div');
    el.className = 'work-hours-modal';
    el.insertAdjacentHTML('beforeend', `
      <p>Set your working hours:</p>
      <form action="">
        <fieldset>
          <ul>
            <li class="work-start">
              <label for="start">Start</label>
              <input type="text" name="start" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${minutesToTimeStr(startMinute)}">
            </li>
            <li class="work-end">
              <label for="end">End</label>
              <input type="text" name="end" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${minutesToTimeStr(endMinute)}">
            </li>
          </ul>
        </fieldset>
        <fieldset>
          <ul>
            <li><a href="#">Cancel</a></li>
            <li><button type="submit">Save</button></li>
          </ul>
        </fieldset>
      </form>`);

    el.addEventListener('click', e => e.stopPropagation());

    el.querySelector('a').addEventListener('click', e => {
      e.preventDefault();
      this.remove();
    });

    el.addEventListener('keydown', e => {
      if (e.key == "Escape") {
        this.remove();
      }
    });

    const form = el.querySelector('form');

    const [startElement, endElement] = form.querySelectorAll('input[name=start], input[name=end]');
    startElement.addEventListener('input', validatesStartBeforeEnd(startElement, endElement));
    endElement.addEventListener('input', validatesStartBeforeEnd(startElement, endElement));

    return el;
  }
}
