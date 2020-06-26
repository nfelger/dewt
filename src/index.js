import React from 'react';
import ReactDOM from 'react-dom';
import Dewt from './components/dewt';
import { dbPromise, addTestData, wipeAllDataAndReAddTestData } from './database';

function parseCalendarDateFromLocation() {
  const location = new URL(window.location.href);
  const dateStr = location.searchParams.get('date');

  if (dateStr === null) {
    return new Date();
  } else if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  } else {
    document.querySelector('body').innerHTML = '<h1>Page not found</h1><p>You really shouldn\'t be here…</p>';
    throw Error(`Malformed date! ${dateStr}`);
  }
}

/* Routing */
let date = parseCalendarDateFromLocation();
let url = new URL(window.location.href);
if (url.searchParams.get('wipeDbAndSeedTestData') !== null) {
  dbPromise
    .then(wipeAllDataAndReAddTestData)
    .then(() => {
      url.searchParams.delete('wipeDbAndSeedTestData');
      window.location.href = url.href;
    });
} else if (url.searchParams.get('addTestData') !== null) {
  dbPromise
    .then(addTestData)
    .then(() => {
      url.searchParams.delete('addTestData');
      window.location.href = url.href;
    });
}

const dayStartsAtMin = 6 * 60;
const totalMinutes = 16 * 60;

ReactDOM.render(<Dewt date={ date }
                      dayStartsAtMin={ dayStartsAtMin }
                      totalMinutes={ totalMinutes } />,
                document.querySelector('main'));
