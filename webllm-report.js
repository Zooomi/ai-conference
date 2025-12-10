// ============================================
// WebLLM — Генератор отчётов (улучшенный)
// ============================================

// Загружаем WebLLM
const webllm = await import("https://esm.run/@mlc-ai/web-llm");

// Более мощная модель (намного лучше анализирует текст)
const MODEL_NAME = "Llama-3.2-3B-Instruct-q4f32_1-MLC";

let engine = null;
let isModelLoaded = false;

const statusEl = document.getElementById("llm-status");
const resultEl = document.getElementById("reportResult");
const generateBtn = document.getElementById("generate-report-btn");
const saveBtn = document.getElementById("saveReportBtn");

let lastReportText = "";

// ---------------------------------------------
// СТАТУС
// ---------------------------------------------
function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
}

// ---------------------------------------------
// ПОКАЗ ОТЧЁТА
// ---------------------------------------------
function showReport(text) {
    resultEl.classList.remove("hidden");
    resultEl.innerHTML = `
        <h3>Сгенерированный отчёт</h3>
        <div class="report-content">${text.replace(/\n/g, "<br>")}</div>
    `;

    saveBtn.classList.remove("hidden");
}

// ---------------------------------------------
// ИНИЦИАЛИЗАЦИЯ НЕЙРОСЕТИ
// ---------------------------------------------
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

// ---------------------------------------------
// ГЕНЕРАЦИЯ ОТЧЁТА
// ---------------------------------------------
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

    // -----------------------------------------
    // 🌟 МЕГА-ПРОМПТ (не переписывать текст, делать выжимку)
    // -----------------------------------------
    const prompt = `
Ты — профессиональный аналитик совещаний. Твоя задача — делать ГЛУБОКОЕ СЖАТИЕ текста и выделять только его СМЫСЛ.

Правила:
- НЕ переписывай текст.
- НЕ используй цитаты.
- НЕ включай дословные фразы.
- Выделяй смысл, причины, аргументы, итоговые решения.
- Строй отчёт как деловой документ.
- Пиши кратко, но содержательно.

Создай отчёт по данным:

Тема: ${topic || "-"}
Дата: ${date || "-"}
Участники: ${participants || "-"}

Текст совещания:
${notes}

Сформируй итоговый отчёт:

1. Краткое резюме (2–4 предложения: цель совещания, ключевой итог)
2. Основные обсуждённые вопросы (только смыслы)
3. Принятые решения (чётко и по пунктам)
4. План действий (кто + что + сроки, если известны)
5. Риски и открытые вопросы (выведи сам, даже если прямо не сказано)
`;

    const completion = await engine.chat.completions.create({
        messages: [
            { role: "system", content: "Ты эксперт по анализу совещаний." },
            { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 900,
        stream: false
    });

    const text = completion.choices?.[0]?.message?.content || "Ошибка ИИ.";

    lastReportText = text;
    showReport(text);

    setStatus("Готово.");
    generateBtn.disabled = false;
    generateBtn.textContent = "Сгенерировать отчёт";
}

// ---------------------------------------------
// СОХРАНЕНИЕ ОТЧЁТА
// ---------------------------------------------
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

// ---------------------------------------------
// КНОПКА
// ---------------------------------------------
generateBtn.addEventListener("click", generateReport);
