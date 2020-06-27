import React, { useEffect, useRef, useState } from 'react';
import { minutesToTimeStr, kebabToCamel, getDirtyFormControls,isFormPristine, flash, timeStrToMinutes } from '../helpers';
import { validatesStartBeforeEnd } from '../form_validations';
import { dbPromise } from '../database';
import { ValidationError, deleteTimebox, updateTimebox } from '../timebox_data';

const TimeboxEditModal = React.forwardRef((props, ref) => {
  const projectInput = useRef(),
        startInput = useRef(),
        endInput = useRef();

  const timebox = props.timebox;

  useEffect(() => {
    projectInput.current.focus();
    startInput.current.addEventListener('input', validatesStartBeforeEnd(startInput.current, endInput.current));
    endInput.current.addEventListener('input', validatesStartBeforeEnd(startInput.current, endInput.current));
  }, []);

  const onCancel = (e) => {
    e.preventDefault();
    props.hideForm();
  };

  const onDelete = async e => {
    e.preventDefault();
    const db = await dbPromise;
    await deleteTimebox(db, timebox.id);
    props.onTimeboxRemove(timebox.id);
  };

  const onSubmit = async (e) =>{
    e.preventDefault();

    const dirtyControls = getDirtyFormControls(e.target);

    let changedValues = {};
    for (let control of dirtyControls) {
      let value = control.value;
      let name = kebabToCamel(control.name);
      // Transform data where necessary.
      switch(name) {
        case 'startMinute':
        case 'endMinute':
          value = timeStrToMinutes(value);
          break;
      }
      changedValues[name] = value;
    }

    const db = await dbPromise;
    try {
      const timebox = await updateTimebox(db, props.timebox.id, changedValues);
      props.hideForm();
      props.onTimeboxCreateOrUpdate(timebox);
    } catch (e) {
      if (e instanceof ValidationError) {
        flash(ref.current);
        for (const error of e.errors) {
          props.addNotification(error, 'error');
        }
      } else {
        throw e;
      }
    }
  };

  return (
    <div ref={ ref } className='timebox-edit' onClick={ e => e.stopPropagation() }>
      <form action="" onSubmit={ onSubmit }>
        <fieldset>
          <ul>
            <li className="project">
              <label htmlFor="project">Project</label>
              <input ref={ projectInput } type="text" name="project" defaultValue={ timebox.project } />
            </li>
            <li className="details">
              <label htmlFor="details">Details</label>
              <input type="text" name="details" required defaultValue={ timebox.details } />
            </li>
          </ul>
        </fieldset>
        <fieldset>
          <ul>
            <li className="start-minute">
              <label htmlFor="start-minute">Start</label>
              <input ref={ startInput } type="text" name="start-minute" required pattern="(2[0-3]|[0-1]?\d):[0-5]\d" title="hh:mm (24h time)" defaultValue={ minutesToTimeStr(timebox.startMinute) } />
            </li>
            <li className="end-minute">
              <label htmlFor="end-minute">End</label>
              <input ref={ endInput } type="text" name="end-minute" required pattern="(2[0-3]|[0-1]?\d):[0-5]\d" title="hh:mm (24h time)" defaultValue={ minutesToTimeStr(timebox.endMinute) } />
            </li>
            <li className="date">
              <label htmlFor="date">Date</label>
              <input type="text" name="date" required pattern="\d{4}-\d{2}-\d{2}" title="yyyy-mm-dd" defaultValue={ timebox.date } />
            </li>
          </ul>
        </fieldset>
        <fieldset>
          <ul>
            <li className="theme-color">
              <label htmlFor="theme-color">Color</label>
              <input type="text" name="theme-color" required pattern="[1-7]" title="any number from 1 to 7" defaultValue={ timebox.themeColor } />
            </li>
          </ul>
        </fieldset>
        <fieldset>
          <ul>
            <li className="delete-timebox"><a href="#" onClick={ onDelete }>Delete</a></li>
            <li className="cancel"><a href="#" onClick={ onCancel }>Cancel</a></li>
            <li><button type="submit">Save</button></li>
          </ul>
        </fieldset>
      </form>
    </div>
  );
});

export default function Timebox(props) {
  const [showForm, setShowForm] = useState(false);
  const editFormElement = useRef();

  const hideForm = () => {
    setShowForm(false);
    props.setModalBoxMaybeRemove(() => () => true);
  };

  const openTimeboxEditModal = async (e) => {
    e.stopPropagation();

    if(!props.modalBoxMaybeRemoveRef.current()) { return; }

    setShowForm(true);

    props.setModalBoxMaybeRemove(() => () => {
      if (!editFormElement.current) { return true; }

      if (isFormPristine(editFormElement.current)) {
        hideForm();
        return true;
      } else {
        flash(editFormElement.current);
        return false;
      }
    });
  };

  const className = `timebox theme-color-${props.timebox.themeColor}`;
  const style = {
    '--start-minute': props.timebox.startMinute - props.dayStartsAtMin,
    '--end-minute': props.timebox.endMinute - props.dayStartsAtMin
  };

  return (
    <article className={ className } style={ style } onClick={ openTimeboxEditModal } >
      <h4>{ props.timebox.details }</h4>
      <h5>{ props.timebox.project }</h5>
      { showForm && <TimeboxEditModal ref={ editFormElement}
                                      timebox={ props.timebox }
                                      hideForm={ hideForm }
                                      addNotification={ props.addNotification }
                                      onTimeboxCreateOrUpdate={ props.onTimeboxCreateOrUpdate }
                                      onTimeboxRemove={ props.onTimeboxRemove } /> }
    </article>
  );
}
