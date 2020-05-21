const agenda = document.querySelector('.agenda');
const hoursToDraw = Number.parseInt(agenda.style.getPropertyValue('--hours-to-draw'));

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
  const startingPoint = Number.parseInt(
    agenda.style.getPropertyValue('--day-starts-at-minute'));
  const endPoint = startingPoint + hoursToDraw * 60

  function drawHours() {

  }

  function drawMajorLines() {
    const startOffsetFromFullHour = startingPoint % 60;
    for (let min = startingPoint + startOffsetFromFullHour; min <= endPoint; min += 60) {
      const line = document.createElement('div');
      line.className = 'rule-major';
      line.style.setProperty('--start-minute', min);
      agenda.appendChild(line);
    }
  }

  function drawMinorLines() {

  }

  function drawNowRule() {

  }

  drawHours();
  drawMajorLines();
  drawMinorLines();
  drawNowRule();
}

drawCalendarDate(new Date());
drawTimeHints();
