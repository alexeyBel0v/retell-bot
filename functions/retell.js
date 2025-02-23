const TelegramBot = require('node-telegram-bot-api');

// Токен от BotFather
const TOKEN = process.env.TELEGRAM_TOKEN; // Храним в переменной окружения
const bot = new TelegramBot(TOKEN);

// Шаблоны для пересказа
const TEMPLATES = [
    "О великий {noun}, ты {action} в этом бренном мире!",
    "Сей {noun} {action}, словно герой древних легенд!",
    "Ты {action}, и небеса {reaction} над твоей судьбой!",
    "{noun} в исполнении {user} — это {action} достойное эпоса!"
];
const NOUNS = ["путник", "воин", "мудрец", "смертный"];
const ACTIONS = ["совершил подвиг", "вступил в бой", "погрузился в хаос", "изменил судьбу"];
const REACTIONS = ["рыдают", "ликуют", "трепещут", "молчат"];

exports.handler = async (event, context) => {
    // Парсим тело запроса от Telegram (Webhook)
    const body = JSON.parse(event.body);
    const message = body.message;

    if (message && message.text) {
        const userName = message.from.first_name;
        const retell = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)].replace(
            "{noun}", NOUNS[Math.floor(Math.random() * NOUNS.length)]
        ).replace(
            "{action}", ACTIONS[Math.floor(Math.random() * ACTIONS.length)]
        ).replace(
            "{reaction}", REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
        ).replace(
            "{user}", userName
        );

        // Отправляем ответ
        await bot.sendMessage(message.chat.id, retell);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "OK" })
    };
};