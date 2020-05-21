const agendaElement = document.querySelector('.agenda');
const hoursToDraw = Number.parseInt(
  agendaElement.style.getPropertyValue('--hours-to-draw'));
const firstMinuteDrawn = Number.parseInt(
  agendaElement.style.getPropertyValue('--day-starts-at-minute'));
const lastMinuteDrawn = firstMinuteDrawn + hoursToDraw * 60;

function drawCalendarDate(calendarDate) {
  const dateFmtOptions = { month:'short', weekday:'short' };
  const [weekday, month] = new Intl.DateTimeFormat('en-US', dateFmtOptions)
    .formatToParts(calendarDate)
    .filter(({type}) => Object.keys(dateFmtOptions).includes(type))
    .map(({value}) => value);
  const date = calendarDate.getDate();

  const dayElements = document.querySelectorAll('.day p');
  dayElements[0].textContent = weekday;
  dayElements[1].textContent = date;
  dayElements[2].textContent = month;
}

function drawTimeHints() {

  function drawHours() {
    firstFullHour = firstMinuteDrawn + 60 - firstMinuteDrawn % 60;

    for (let min = firstFullHour; min <= lastMinuteDrawn; min += 60) {
      const hour = document.createElement('h3');
      hour.className = 'time-hint';
      hour.style.setProperty('--start-minute', min);
      hour.style.setProperty('--end-minute', min + 59);
      hour.textContent = min / 60;

      const minute = document.createElement('sup');
      minute.textContent = '00';
      hour.appendChild(minute);

      agendaElement.appendChild(hour);
    }
  }

  function drawLinesEvery60Min(className, firstLineAfter) {
    for (let min = firstMinuteDrawn + firstLineAfter; min <= lastMinuteDrawn; min += 60) {
      const line = document.createElement('div');
      line.className = className;
      line.style.setProperty('--start-minute', min);
      agendaElement.appendChild(line);
    }
  }

  function drawMajorLines() {
    const firstLineAfter = 60 - firstMinuteDrawn % 60;
    drawLinesEvery60Min('rule-major', firstLineAfter)
  }

  function drawMinorLines() {
    let firstLineAfter;

    if (firstMinuteDrawn % 60 < 30) {
      firstLineAfter = 30 - firstMinuteDrawn % 30;
    } else {
      firstLineAfter = 60 - (firstMinuteDrawn - 30) % 60;
    }

    drawLinesEvery60Min('rule-minor', firstLineAfter);
  }

  function drawNowRule() {
    const nowRule = document.createElement('div');
    nowRule.className = 'rule-now';
    agendaElement.appendChild(nowRule);

    function updateNowRulePosition() {
      const now = new Date();
      const nowInMinutes = now.getHours() * 60 + now.getMinutes();

      if (nowInMinutes > lastMinuteDrawn) {
        nowRule.style.display = 'none';
        return;
      }

      nowRule.style.setProperty('--start-minute', nowInMinutes);

      setTimeout(updateNowRulePosition, 60000);
    }
    updateNowRulePosition();
  }

  drawHours();
  drawMajorLines();
  drawMinorLines();
  drawNowRule();
}

drawCalendarDate(new Date());
drawTimeHints();
