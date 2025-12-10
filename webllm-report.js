// webllm-report.js

// Загружаем WebLLM
const webllm = await import("https://esm.run/@mlc-ai/web-llm");

// Модель (хорошая, лёгкая, работает быстро)
const MODEL_NAME = "Llama-3.2-1B-Instruct-q4f32_1-MLC";

let engine = null;
let isModelLoaded = false;

// HTML элементы
const statusEl = document.getElementById("llm-status");
const resultEl = document.getElementById("reportResult");
const generateBtn = document.getElementById("generate-report-btn");
const saveBtn = document.getElementById("saveReportBtn");

function setStatus(msg) {
    statusEl.textContent = msg;
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

    setStatus("Инициализация модели...");

    const onProgress = (info) => {
        const p = info.progress
            ? Math.round(info.progress * 100)
            : 0;
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
        alert("Пожалуйста, заполните поле с текстом совещания.");
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "Генерация...";
    setStatus("Подготовка запроса...");

    if (!isModelLoaded) {
        await initLLM();
    }

    setStatus("Генерация текста...");

    const messages = [
        {
            role: "system",
            content:
                "Ты — ассистент, который составляет деловые отчёты по совещаниям. Пиши структурировано, официально и по делу."
        },
        {
            role: "user",
            content: `
Создай отчёт о совещании:

Тема: ${topic || "-"}
Дата: ${date || "-"}
Участники: ${participants || "-"}

Текст обсуждения:
${notes}

Сформируй отчёт в разделах:
1. Краткое резюме  
2. Основные вопросы  
3. Принятые решения  
4. План действий  
5. Риски и открытые вопросы
            `
        }
    ];

    const completion = await engine.chat.completions.create({
        messages,
        temperature: 0.4,
        max_tokens: 900,
        stream: false
    });

    const text =
        completion.choices?.[0]?.message?.content ||
        "Ошибка: модель не вернула результат.";

    showReport(text);

    lastReportText = text;

    generateBtn.disabled = false;
    generateBtn.textContent = "Сгенерировать отчёт";
    setStatus("Готово.");
}

let lastReportText = "";

// Сохранение отчёта
saveBtn.addEventListener("click", () => {
    const reports = JSON.parse(localStorage.getItem("reports") || "[]");

    reports.push({
        id: Date.now(),
        text: lastReportText,
        date: new Date().toLocaleString("ru")
    });

    localStorage.setItem("reports", JSON.stringify(reports));

    alert("Отчёт сохранён! Он появится в разделе «Сохранённые».");
});

generateBtn.addEventListener("click", generateReport);
