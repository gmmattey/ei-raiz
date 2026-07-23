export async function sendTelegram(message) {
  const token = "BOT_TOKEN";
  const chatId = "CHAT_ID";

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message })
  });
}
