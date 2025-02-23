const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = process.env.TELEGRAM_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!TOKEN) {
    console.error("Telegram Bot Token not provided!");
    throw new Error("Telegram Bot Token not provided!");
}
if (!OPENAI_API_KEY) {
    console.error("OpenAI API Key not provided!");
    throw new Error("OpenAI API Key not provided!");
}

const bot = new TelegramBot(TOKEN);

exports.handler = async (event, context) => {
    try {
        console.log("Full event:", JSON.stringify(event, null, 2));

        if (!event.body) {
            console.error("No body provided in the request");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "No body provided" })
            };
        }

        let body;
        try {
            body = JSON.parse(event.body);
            console.log("Parsed body:", JSON.stringify(body, null, 2));
        } catch (parseError) {
            console.error("Failed to parse JSON:", parseError.message);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid JSON" })
            };
        }

        const message = body.message;

        if (message && message.text) {
            const userName = message.from.first_name;
            const userMessage = message.text;

            console.log(`Received message: "${userMessage}" from ${userName}`);

            // Устанавливаем таймаут для OpenAI
            const openAiResponse = await Promise.race([
                axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "system",
                                content: "Ты язвительный и остроумный бот. Твоя задача — придумать едкий, саркастичный комментарий к сообщению пользователя, обращаясь к нему по имени. Не используй шаблоны, будь креативен и слегка ядовит."
                            },
                            {
                                role: "user",
                                content: `Сделай едкий комментарий к сообщению "${userMessage}" от ${userName}`
                            }
                        ],
                        max_tokens: 150,
                        temperature: 1.0
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${OPENAI_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                ),
                new Promise((_, reject) => setTimeout(() => reject(new Error("OpenAI timeout")), 8000)) // Таймаут 8 секунд
            ]);

            const sarcasticComment = openAiResponse.data.choices[0].message.content;
            console.log(`OpenAI response: "${sarcasticComment}"`);

            await bot.sendMessage(message.chat.id, sarcasticComment);
        } else {
            console.log("No valid message in request");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "OK" })
        };
    } catch (error) {
        console.error("Error:", error.message || error);
        if (message && message.chat && message.chat.id) {
            await bot.sendMessage(message.chat.id, `${message.from.first_name}, я бы сказал что-то язвительное, но мой ИИ-прицел сбился. Пиши ещё!`);
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "Internal Server Error" })
        };
    }
};
