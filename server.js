// server.js — простой прокси-сервер к GigaChat

import express from "express";
import cors from "cors";
import GigaChat from "gigachat";
import { Agent } from "node:https";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Агент HTTPS (для учебного проекта можно отключить проверку сертификата,
// в бою лучше поставить корневой сертификат)
const httpsAgent = new Agent({
    rejectUnauthorized: false
});

// КЛИЕНТ GigaChat
const client = new GigaChat({
    credentials: process.env.GIGACHAT_AUTH_KEY, // ключ авторизации из личного кабинета
    model: "GigaChat",                          // можно указать GigaChat-Pro и т.п.
    scope: "GIGACHAT_API_PERS",
    httpsAgent,
    timeout: 600
});

// Эндпоинт для генерации отчёта
app.post("/generate", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Поле prompt обязательно." });
        }

        const response = await client.chat({
            messages: [
                {
                    role: "system",
                    content: "Ты эксперт по анализу совещаний. Делаешь структурированные отчёты."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        const text =
            response.choices?.[0]?.message?.content ||
            "GigaChat не вернул содержимого ответа.";

        res.json({ result: text });

    } catch (err) {
        console.error("Ошибка при обращении к GigaChat:", err);
        res.status(500).json({
            error: "Ошибка при обращении к GigaChat",
            details: String(err)
        });
    }
});

app.listen(PORT, () => {
    console.log(`GigaChat proxy server запущен на порту ${PORT}`);
});
