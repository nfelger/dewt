import React, { useEffect, useRef, useState } from 'react';
import { minutesToTimeStr, kebabToCamel, getDirtyFormControls, isFormPristine, timeStrToMinutes } from '../helpers';
import { validatesStartBeforeEnd } from '../form_validations';
import { dbPromise } from '../database';
import { ValidationError, deleteTimebox, updateTimebox } from '../timebox_data';

function TimeboxEditModal(props) {
  const dirtyRef = useRef(false);

  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    props.setRequestModalBoxRemoval(() => () => {
      if (!dirtyRef.current) {
        props.removeModal();
        return true;
      } else {
        setFlashing(true);
        return false;
      }
    });

    return () => {
      props.setRequestModalBoxRemoval(() => () => true);
    };
  }, []);

  useEffect(() => {
    if (flashing) {
      const timeout = setTimeout(() => setFlashing(false), 800);
      return () => clearTimeout(timeout);
    }
  }, [flashing]);

  const handleChange = (e) => {
    dirtyRef.current = !isFormPristine(e.currentTarget);
  };

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
    props.removeModal();
  };

  const handleDelete = async e => {
    e.preventDefault();
    const db = await dbPromise;
    await deleteTimebox(db, timebox.id);
    props.handleTimeboxRemove(timebox.id);
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
      props.removeModal();
      props.handleTimeboxCreateOrUpdate(timebox);
    } catch (e) {
      if (e instanceof ValidationError) {
        setFlashing(true);
        for (const error of e.errors) {
          props.addNotification(error, 'error');
        }
      } else {
        throw e;
      }
    }
  };

  const className = `timebox-edit${flashing ? ' box-flash' : ''}`;

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
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if(!props.requestModalBoxRemovalRef.current()) { return; }

    setShowModal(true);
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
      { showModal && <TimeboxEditModal timebox={ props.timebox }
                                       removeModal={ () => setShowModal(false) }
                                       setRequestModalBoxRemoval={ props.setRequestModalBoxRemoval }
                                       addNotification={ props.addNotification }
                                       handleTimeboxCreateOrUpdate={ props.handleTimeboxCreateOrUpdate }
                                       handleTimeboxRemove={ props.handleTimeboxRemove } /> }
    </article>
  );
}
