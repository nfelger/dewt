import React, { useEffect, useRef } from 'react';
import { minutesToTimeStr, kebabToCamel, getDirtyFormControls, isFormPristine, timeStrToMinutes } from '../helpers';
import { validatesStartBeforeEnd } from '../form_validations';
import { dbPromise } from '../database';
import { ValidationError, deleteTimebox, updateTimebox } from '../timebox_data';

function TimeboxEditModal(props) {
  useEffect(() => {
    if (props.flashing) {
      const timeout = setTimeout(() => props.onFlashingDone(), 800);
      return () => clearTimeout(timeout);
    }
  }, [props.flashing]);

  const handleChange = (e) => {
  	props.onDirtyChange(e.target.value !== e.target.defaultValue);
  };

  const className = `timebox-edit${props.flashing ? ' box-flash' : ''}`;

  const projectInput = useRef(),
        startInput = useRef(),
        endInput = useRef();

  const timebox = props.timebox;

  useEffect(() => {
    projectInput.current.focus();
    startInput.current.addEventListener('input', validatesStartBeforeEnd(startInput.current, endInput.current));
    endInput.current.addEventListener('input', validatesStartBeforeEnd(startInput.current, endInput.current));
  }, []);

  const handleCancel = (e) => {
    e.preventDefault();
    props.onClose();
  };

  const handleDelete = async e => {
    e.preventDefault();
    const db = await dbPromise;
    await deleteTimebox(db, timebox.id);
    props.onClose();
    props.onTimeboxRemove(timebox.id);
  };

  const handleSubmit = async (e) =>{
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
      props.onClose();
      props.onTimeboxCreateOrUpdate(timebox);
    } catch (e) {
      if (e instanceof ValidationError) {
        for (const error of e.errors) {
          props.addNotification(error, 'error');
        }
      } else {
        throw e;
      }
    }
  };

  return (
    <div className={ className } onClick={ e => e.stopPropagation() }>
      <form action="" onSubmit={ handleSubmit } onChange={ handleChange }>
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
            <li className="delete-timebox"><a href="#" onClick={ handleDelete }>Delete</a></li>
            <li className="cancel"><a href="#" onClick={ handleCancel }>Cancel</a></li>
            <li><button type="submit">Save</button></li>
          </ul>
        </fieldset>
      </form>
    </div>
  );
}

export default function Timebox(props) {
  const modalIdentifier = `edit-timebox-${props.timebox.id}`;

  const handleClick = (e) => {
    e.stopPropagation();
    props.onModalOpenRequest(modalIdentifier);
  };

  const className = `timebox theme-color-${props.timebox.themeColor}`;
  const style = {
    '--start-minute': props.timebox.startMinute - props.dayStartsAtMin,
    '--end-minute': props.timebox.endMinute - props.dayStartsAtMin
  };

  return (
    <article className={ className } style={ style } onClick={ handleClick } >
      <h4>{ props.timebox.details }</h4>
      <h5>{ props.timebox.project }</h5>
      { props.visibleModal === modalIdentifier && <TimeboxEditModal timebox={ props.timebox }
                                                                    flashing={ props.modalIsFlashing }
                                                                    onDirtyChange={ props.onModalDirtyChange }
                                                                    onFlashingDone={ props.onModalFlashingDone }
                                                                    onClose={ props.onModalClose }
                                                                    addNotification={ props.addNotification }
                                                                    onTimeboxCreateOrUpdate={ props.onTimeboxCreateOrUpdate }
                                                                    onTimeboxRemove={ props.onTimeboxRemove } /> }
    </article>
  );
}
