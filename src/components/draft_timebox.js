import React, { useState, useRef, useEffect } from 'react';
import { dbPromise } from '../database';
import { createTimebox, ValidationError } from '../timebox_data';
import { isFormPristine } from '../helpers';

export default function DraftTimebox(props) {
  const startMinute = props.atMinute - props.dayStartsAtMin;
  const duration = 45;

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

  const detailsTextarea = useRef();
  useEffect(() => {
    detailsTextarea.current.focus();
  }, [props.atMinute]);

  const handleChange = (e) => {
    const formElement = e.currentTarget.parentElement;
    // Wire adding line breaks (from hitting enter but also from copy&paste) to a form submit.
    const endsInNewline = e.currentTarget.value.slice(-1) === '\n';
    e.currentTarget.value = e.currentTarget.value.replace(/\n/g, '');

    if (e.currentTarget.value !== "" && endsInNewline) {
      formElement.requestSubmit();
    }

    dirtyRef.current = !isFormPristine(formElement);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let project = null;
    let details = new FormData(e.target).get('details');

    const firstColonLocation = details.indexOf(':');
    if (firstColonLocation !== -1) {
      project = details.slice(0, firstColonLocation);
      details = details.slice(firstColonLocation + 1);
    }

    const db = await dbPromise;
    try {
      const timebox = await createTimebox(db, {
        project: project,
        details: details,
        themeColor: 1,
        date: props.date,
        startMinute: props.atMinute,
        endMinute: props.atMinute + duration
      });

      props.handleTimeboxCreateOrUpdate(timebox);
      props.removeModal();
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

  const handleEscape = (e) => { if (e.key == "Escape") { props.removeModal(); }};
  const handleCloseBtnClick = (e) => {
    e.stopPropagation();
    props.removeModal();
  };

  const className = `timebox timebox-draft${flashing ? ' box-flash' : ''}`;

  return (
    <article className={ className }
             style={ {'--start-minute': startMinute, '--end-minute': startMinute + duration } }
             onKeyDown={ handleEscape }
             onClick={ (e) => e.stopPropagation() } >
      <form action="" onSubmit={ handleSubmit }>
        <textarea ref={ detailsTextarea }
                  name="details"
                  placeholder="Work on something deeply"
                  onChange={ handleChange } />
        <button type="submit"></button>
      </form>
      <div className="closeBtn" onClick={ handleCloseBtnClick }>×</div>
    </article>
  )
}
