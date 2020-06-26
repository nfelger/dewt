import React, { useState } from 'react';
import AgendaView from './agenda_view';
import Notifications from './notifications';

export default function Dewt(props) {
  const [notifications, setNotifications] = useState(new Map());

  const addNotification = (message, level) => {
    setNotifications(notifications => new Map(notifications).set(Number(new Date()), {message, level}));
  };

  const removeNotification = (key) => {
    setNotifications(notifications => {
      notifications.delete(key);
      return { notifications };
    });
  };

  return (
    <React.Fragment>
      <Notifications messages={ notifications }
                     removeNotification={ removeNotification } />
      <AgendaView date={ props.date }
                  dayStartsAtMin={ props.dayStartsAtMin }
                  totalMinutes={ props.totalMinutes }
                  addNotification={ addNotification } />
    </React.Fragment>
  )
}
