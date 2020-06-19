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


export default class AgendaView {
  constructor(agendaElement, totalMinutes, dayStartsAtMin) {
    this.agendaElement = agendaElement;
    this.totalMinutes = totalMinutes;
    this.dayStartsAtMin = dayStartsAtMin;
    this.date = parseCalendarDateFromLocation();
  }

  draw() {
    this._setTotalMinutesOnAgendaElement();
    this._drawCalendarDate();
    this._drawHours();
    this._drawMajorLines();
    this._drawMinorLines();
    this._drawNowRule();
  }

  _setTotalMinutesOnAgendaElement() {
    this.agendaElement.style.setProperty('--total-minutes', this.totalMinutes);
  }

  _drawCalendarDate() {
    const dateFmtOptions = { month: 'short', weekday: 'short' };
    const [weekday, month] = new Intl.DateTimeFormat('en-US', dateFmtOptions)
      .formatToParts(this.date)
      .filter(({ type }) => Object.keys(dateFmtOptions).includes(type))
      .map(({ value }) => value);
    const date = this.date.getDate();

    const dayElements = document.querySelectorAll('.day p');
    dayElements[0].textContent = weekday;
    dayElements[1].textContent = date;
    dayElements[2].textContent = month;
  }

  _drawHours() {
    const firstFullHour = 60 - this.dayStartsAtMin % 60;

    for (let min = firstFullHour; min < this.totalMinutes; min += 60) {
      const hour = document.createElement('h3');
      hour.className = 'time-hint';
      hour.style.setProperty('--start-minute', min);
      hour.style.setProperty('--end-minute', min + 59);
      hour.textContent = (this.dayStartsAtMin + min) / 60;

      const minute = document.createElement('sup');
      minute.textContent = '00';
      hour.appendChild(minute);

      this.agendaElement.appendChild(hour);
    }
  }

  _drawMajorLines() {
    const firstLineAfter = 60 - this.dayStartsAtMin % 60;
    this._drawLinesEvery60Min('rule-major', firstLineAfter);
  }

  _drawMinorLines() {
    let firstLineAfter;

    if (this.dayStartsAtMin % 60 < 30) {
      firstLineAfter = 30 - this.dayStartsAtMin % 30;
    } else {
      firstLineAfter = 60 - (this.dayStartsAtMin - 30) % 60;
    }

    this._drawLinesEvery60Min('rule-minor', firstLineAfter);
  }

  _drawNowRule() {
    const nowRule = document.createElement('div');
    nowRule.className = 'rule-now';
    this.agendaElement.appendChild(nowRule);

    const dayStartsAtMin = this.dayStartsAtMin;
    const totalMinutes = this.totalMinutes;
    function updateNowRulePosition() {
      const now = new Date();
      const nowInMinutes = now.getHours() * 60 + now.getMinutes() - dayStartsAtMin;

      if (nowInMinutes >= totalMinutes) {
        nowRule.remove();
        return;
      }

      nowRule.style.setProperty('--start-minute', nowInMinutes);

      setTimeout(updateNowRulePosition, 60000);
    }
    updateNowRulePosition();
  }

  _drawLinesEvery60Min(className, firstLineAfter) {
    for (let min = firstLineAfter; min < this.totalMinutes; min += 60) {
      const line = document.createElement('div');
      line.className = className;
      line.style.setProperty('--start-minute', min);
      this.agendaElement.appendChild(line);
    }
  }
}
