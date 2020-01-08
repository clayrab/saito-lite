module.exports = ChatRoomMessageTemplate = ({ message, publickey, timestamp, identicon }, sig, type, data) => {
  let { datetime_formatter } = data.helpers;
  let datetime = datetime_formatter(timestamp);

  return `
    <div id="${sig}" class="chat-room-message chat-room-message-${type}">
      <img src="${identicon}" class="chat-room-message-identicon"/>
      <div class="chat-message-text">${message}
        <div class="chat-message-header">
            <p class="chat-message-author">${publickey.substring(0, 16)}</p>
            <p class="chat-message-timestamp">${datetime.hours}:${datetime.minutes}</p>
        </div>
      </div>
    </div>
  `
}