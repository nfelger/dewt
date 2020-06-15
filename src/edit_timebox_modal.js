import { minutesToTimeStr } from "./helpers";
import ModalBox from "./modal_box";
import { validatesStartBeforeEnd } from "./form_validations";

export default class EditTimeboxModal extends ModalBox {
  createElement(timeboxId, timebox) {
    let el = document.createElement('div');
    el.className = 'timebox-edit';
    el.dataset.timeboxId = timeboxId;
    el.insertAdjacentHTML('beforeend', `
      <form>
        <fieldset>
          <ul>
            <li class="project">
              <label for="project">Project</label>
              <input type="text" name="project" value="${timebox.project || ""}">
            </li>
            <li class="details">
              <label for="details">Details</label>
              <input type="text" name="details" required value="${timebox.details}">
            </li>
          </ul>
        </fieldset>
        <fieldset>
          <ul>
            <li class="start-minute">
              <label for="start-minute">Start</label>
              <input type="text" name="start-minute" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${minutesToTimeStr(timebox.startMinute)}">
            </li>
            <li class="end-minute">
              <label for="end-minute">End</label>
              <input type="text" name="end-minute" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${minutesToTimeStr(timebox.endMinute)}">
            </li>
            <li class="date">
              <label for="date">Date</label>
              <input type="text" name="date" required pattern="\\d{4}-\\d{2}-\\d{2}" title="yyyy-mm-dd" value="${timebox.date}">
            </li>
          </ul>
        </fieldset>
        <fieldset>
          <ul>
            <li class="theme-color">
              <label for="theme-color">Color</label>
              <input type="text" name="theme-color" required pattern="[1-7]" title="any number from 1 to 7" value="${timebox.themeColor}">
            </li>
          </ul>
        </fieldset>
        <fieldset>
          <ul>
            <li class="delete-timebox"><a href="#">Delete</a></li>
            <li class="cancel"><a href="#">Cancel</a></li>
            <li><button type="submit">Save</button></li>
          </ul>
        </fieldset>
      </form>`);
    el.querySelector('.cancel a').addEventListener('click', e => {
      e.preventDefault();
      this.remove();
    });
    el.addEventListener('click', e => e.stopPropagation());

    const form = el.querySelector('form');
    const [startElement, endElement] = form.querySelectorAll('input[name=start-minute], input[name=end-minute]');
    startElement.addEventListener('input', validatesStartBeforeEnd(startElement, endElement));
    endElement.addEventListener('input', validatesStartBeforeEnd(startElement, endElement));

    return el;
  }
}
