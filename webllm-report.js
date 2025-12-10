// ============================================
// WebLLM — Генератор отчётов (улучшенный)
// ============================================

const webllm = await import("https://esm.run/@mlc-ai/web-llm");

const MODEL_NAME = "Llama-3.2-3B-Instruct-q4f32_1-MLC";



let engine = null;
let isModelLoaded = false;

const statusEl = document.getElementById("llm-status");
const resultEl = document.getElementById("reportResult");
const generateBtn = document.getElementById("generate-report-btn");
const saveBtn = document.getElementById("saveReportBtn");

let lastReportText = "";

function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
}

function showReport(text) {
    resultEl.classList.remove("hidden");
    resultEl.innerHTML = `
        <h3>Сгенерированный отчёт</h3>
        <div class="report-content">${text.replace(/\n/g, "<br>")}</div>
    `;
    saveBtn.classList.remove("hidden");
}

async function initLLM() {
    if (isModelLoaded) return;

    setStatus("Запуск модели...");

    const onProgress = (info) => {
        const p = info.progress ? Math.round(info.progress * 100) : 0;
        setStatus(`Загрузка модели: ${p}%`);
    };

    engine = new webllm.MLCEngine({ initProgressCallback: onProgress });
    await engine.reload(MODEL_NAME);

    isModelLoaded = true;
    setStatus("Модель загружена. Можно генерировать отчёты.");
}

async function generateReport() {
    const topic = document.getElementById("meeting-topic").value.trim();
    const date = document.getElementById("meeting-date").value.trim();
    const participants = document.getElementById("participants").value.trim();
    const notes = document.getElementById("meeting-notes").value.trim();

    if (!notes) {
        alert("Введите текст совещания.");
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "Генерация...";
    setStatus("Подготовка...");

    if (!isModelLoaded) await initLLM();

    setStatus("ИИ анализирует текст...");

    const prompt = `
Ты — эксперт по анализу совещаний. 
Твоя задача — делать глубокое смысловое сжатие текста.

Правила:
- НЕ переписывай текст.
- НЕ используй цитаты.
- НЕ повторяй диалоги.
- Пиши только смысл.
- Выделяй причины, обсуждения, решения, общие выводы.

Сформируй структурированный отчёт:

1. Краткое резюме
2. Основные обсуждённые вопросы
3. Принятые решения
4. План действий
5. Риски и открытые вопросы

Данные:
Тема: ${topic}
Дата: ${date}
Участники: ${participants}

Текст совещания:
${notes}
    `;

    const completion = await engine.chat.completions.create({
        messages: [
            { role: "system", content: "Ты эксперт по аналитике совещаний." },
            { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 900
    });

    const text = completion.choices?.[0]?.message?.content || "Ошибка.";

    lastReportText = text;
    showReport(text);

    setStatus("Готово.");
    generateBtn.disabled = false;
    generateBtn.textContent = "Сгенерировать отчёт";
}

saveBtn.addEventListener("click", () => {
    const reports = JSON.parse(localStorage.getItem("reports") || "[]");

    reports.push({
        id: Date.now(),
        text: lastReportText,
        date: new Date().toLocaleString("ru")
    });

    localStorage.setItem("reports", JSON.stringify(reports));

    alert("Отчёт сохранён!");
});

generateBtn.addEventListener("click", generateReport);
