// ============================
// КОНФИГ ДЛЯ API БЭКЕНДА
// ============================

// URL твоего backend на Render
const API_URL = "https://ai-conference-backend.onrender.com";

let lastReportText = "";

// ============================
// 🎤 ГОЛОСОВОЙ ВВОД (Web Speech API)
// ============================
let recognition = null;
let isRecording = false;

function initVoiceInput() {
    const voiceBtn = document.getElementById("voiceBtn");
    const voiceStatus = document.getElementById("voiceStatus");
    const notesField = document.getElementById("meeting-notes");

    // Если мы не на странице generate.html — просто выходим
    if (!voiceBtn || !notesField || !voiceStatus) return;

    // Проверка поддержки браузером
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        voiceBtn.disabled = true;
        voiceBtn.textContent = "🎤 Голосовой ввод недоступен";
        voiceStatus.textContent = "Голосовой ввод не поддерживается этим браузером.";
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isRecording = true;
        voiceBtn.textContent = "⏹ Остановить запись";
        voiceStatus.textContent = "🎙 Идёт запись... говорите";
    };

    recognition.onend = () => {
        isRecording = false;
        voiceBtn.textContent = "🎤 Голосовой ввод";
        voiceStatus.textContent = "Голосовой ввод: выключен";
    };

    recognition.onerror = (e) => {
        // Типичные: "not-allowed", "service-not-allowed", "no-speech"
        voiceStatus.textContent = `Ошибка голосового ввода: ${e.error}`;
        isRecording = false;
        voiceBtn.textContent = "🎤 Голосовой ввод";
    };

    recognition.onresult = (event) => {
        let finalText = "";
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalText += transcript + " ";
            else interimText += transcript;
        }

        // Добавляем итоговый текст в textarea
        if (finalText.trim()) {
            notesField.value += finalText;
        }

        // Просто показываем подсказку, что идёт распознавание
        if (interimText.trim()) {
            voiceStatus.textContent = "🎙 Идёт запись... (распознаю речь)";
        }
    };

    voiceBtn.addEventListener("click", () => {
        // Toggle start/stop
        if (!isRecording) {
            try {
                recognition.start();
            } catch (e) {
                // Иногда start() может бросить ошибку если уже запущено
                console.warn("recognition.start error:", e);
            }
        } else {
            recognition.stop();
        }
    });
}

// ============================
// ГЕНЕРАЦИЯ ОТЧЁТА ЧЕРЕЗ GigaChat (через backend)
// ============================
async function handleGenerate(event) {
    event.preventDefault();

    const topic = document.getElementById("meeting-topic")?.value.trim() || "Совещание";
    const date = document.getElementById("meeting-date")?.value || new Date().toISOString().split("T")[0];
    const participants = document.getElementById("participants")?.value.trim() || "Участники не указаны";
    const notes = document.getElementById("meeting-notes")?.value.trim();

    const statusEl = document.getElementById("llm-status");
    const resultDiv = document.getElementById("reportResult");
    const saveBtn = document.getElementById("saveReportBtn");
    const submitBtn = document.getElementById("generate-report-btn") || event.submitter;

    if (!notes) {
        alert("Введите текст совещания.");
        return;
    }

    // Показываем загрузку
    if (resultDiv) {
        resultDiv.classList.remove("hidden");
        resultDiv.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="spinner"></div>
                <p>ИИ анализирует текст совещания в GigaChat...</p>
            </div>
        `;
    }
    if (statusEl) statusEl.textContent = "Отправляем запрос к GigaChat...";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Генерация...";
    }

    // Формируем промпт
    const prompt = `
Ты — эксперт по анализу совещаний.
Сожми смысл текста. Без цитат, без диалогов. Только суть.

Структура:
1. Краткое резюме
2. Основные обсуждённые вопросы
3. Принятые решения
4. План действий
5. Риски и открытые вопросы

Данные совещания:
Тема: ${topic}
Дата: ${date}
Участники: ${participants}

Текст совещания:
${notes}
    `.trim();

    try {
        // 🔥 ВАЖНО: всегда отправляем на /generate
        const resp = await fetch(`${API_URL}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Ошибка сервера (${resp.status}): ${text}`);
        }

        const data = await resp.json();
        const reportText = data.result || "Не удалось получить отчёт от GigaChat.";

        lastReportText = reportText;

        if (resultDiv) {
            resultDiv.innerHTML = `
                <h3>Сгенерированный отчёт</h3>
                <div class="report-content">${reportText.replace(/\n/g, "<br>")}</div>
            `;
        }
        if (saveBtn) saveBtn.classList.remove("hidden");
        if (statusEl) statusEl.textContent = "Ответ получен от GigaChat.";

    } catch (err) {
        console.error(err);

        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="error">
                    <h3>Ошибка при обращении к GigaChat</h3>
                    <p>${err.message}</p>
                    <p>Возможно, Render проснулся. Подождите 10–20 секунд и попробуйте снова.</p>
                </div>
            `;
        }
        if (statusEl) statusEl.textContent = "Ошибка получения данных.";
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Сгенерировать отчёт";
        }
    }
}

// ============================
// СОХРАНЕНИЕ ОТЧЁТА В localStorage
// ============================
function saveCurrentReport() {
    if (!lastReportText.trim()) {
        alert("Нет отчёта для сохранения.");
        return;
    }

    const reports = JSON.parse(localStorage.getItem("reports") || "[]");

    reports.push({
        id: Date.now(),
        text: lastReportText,
        date: new Date().toLocaleString("ru")
    });

    localStorage.setItem("reports", JSON.stringify(reports));

    alert("Отчёт сохранён!");
}

// ============================
// СТРАНИЦА «СОХРАНЁННЫЕ»
// ============================
function initSavedPage() {
    const container = document.getElementById("savedReports");
    if (!container) return;

    let reports = JSON.parse(localStorage.getItem("reports") || "[]");

    if (reports.length === 0) {
        container.innerHTML = "<p>Пока нет сохранённых отчётов.</p>";
        return;
    }

    container.innerHTML = reports
        .map(
            (r) => `
        <div class="report-card" data-id="${r.id}">
            <h3>Отчёт от ${r.date}</h3>
            <div class="report-content">${r.text.replace(/\n/g, "<br>")}</div>

            <div class="report-actions">
                <button class="btn-action download-txt">TXT</button>
                <button class="btn-action download-docx" style="background:#8e44ad;">DOCX</button>
                <button class="btn-action delete-report" style="background:#c0392b;">Удалить</button>
            </div>
        </div>
    `
        )
        .join("");

    // Экранирование HTML
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // Скачивание TXT
    document.querySelectorAll(".download-txt").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".report-card");
            const id = Number(card.dataset.id);
            const report = reports.find((r) => r.id === id);

            const content = `Отчёт от ${report.date}\n\n${report.text}`;
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `report_${report.id}.txt`;
            a.click();
            URL.revokeObjectURL(a.href);
        });
    });

    // Скачивание DOCX
    document.querySelectorAll(".download-docx").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".report-card");
            const id = Number(card.dataset.id);
            const report = reports.find((r) => r.id === id);

            if (!window.htmlDocx) {
                alert("DOCX-библиотека не загружена.");
                return;
            }

            const safeText = escapeHtml(report.text);

            const docHtml = `
<html><body>
<h1>Отчёт от ${escapeHtml(report.date)}</h1>
<p style="white-space: pre-wrap; font-size: 13pt;">${safeText}</p>
</body></html>`;

            const blob = window.htmlDocx.asBlob(docHtml);
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `report_${report.id}.docx`;
            a.click();
            URL.revokeObjectURL(a.href);
        });
    });

    // Удаление отчёта
    document.querySelectorAll(".delete-report").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".report-card");
            const id = Number(card.dataset.id);

            reports = reports.filter((r) => r.id !== id);
            localStorage.setItem("reports", JSON.stringify(reports));

            card.remove();
            if (reports.length === 0) container.innerHTML = "<p>Пока нет сохранённых отчётов.</p>";
        });
    });
}

// ============================
// ИНИЦИАЛИЗАЦИЯ
// ============================
document.addEventListener("DOMContentLoaded", () => {
    // ✅ 1) Включаем голосовой ввод (если мы на generate.html)
    initVoiceInput();

    // ✅ 2) Генерация
    const form = document.getElementById("generate-form");
    if (form) {
        form.addEventListener("submit", handleGenerate);

        const saveBtn = document.getElementById("saveReportBtn");
        if (saveBtn) saveBtn.addEventListener("click", saveCurrentReport);
    }

    // ✅ 3) Страница saved.html
    initSavedPage();
});
