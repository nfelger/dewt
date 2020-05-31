const notificationLevel = {
  error: 'error',
  info: 'info',
  success: 'success'
}

const notificationsElement = document.querySelector('.notifications');

function notifyUser(message, level) {
  const notification = document.createElement('div');
  notification.classList.add('notification', level);
  notificationsElement.appendChild(notification);
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  notification.appendChild(messageElement);
  notification.addEventListener('click', () => {
    notification.classList.add('hide');
    setTimeout(function() {
      notification.remove();
    }, 200);
  });
}

export { notifyUser, notificationLevel };
