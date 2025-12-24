
// КОНФИГ ДЛЯ API БЭКЕНДА


// URL  backend на Render
const API_URL = "https://ai-conference-backend.onrender.com";

// текст последнего отчёта
let lastReportText = "";

// мета последнего отчёта (чтобы дата/тема/участники сохранялись)
let lastReportMeta = {
    topic: "",
    meetingDate: "",
    participants: ""
};


// ГОЛОСОВОЙ ВВОД 

let recognition = null;
let isRecording = false;

// ставим точку/абзац после остановки
function ensureSentenceEndAndParagraph(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return "";

    // если уже заканчивается знаком препинания — просто абзац
    if (/[.!?…]$/.test(trimmed)) return "\n\n";

    // иначе добавим точку и абзац
    return ".\n\n";
}

// аккуратное добавление в textarea (без склеивания слов)
function appendSmart(textarea, chunk) {
    if (!chunk) return;

    const current = textarea.value;
    const needsSpace =
        current.length > 0 &&
        !/\s$/.test(current) &&
        !/^[\s.,!?…]/.test(chunk);

    textarea.value = current + (needsSpace ? " " : "") + chunk;
}

// (оставил — может пригодиться, но сейчас не используется напрямую)
function appendParagraph(textarea) {
    if (!textarea.value.endsWith("\n\n")) {
        if (!textarea.value.endsWith("\n")) textarea.value += "\n";
        textarea.value += "\n";
    }
}

function initVoiceInput() {
    const voiceBtn = document.getElementById("voiceBtn");
    const voiceStatus = document.getElementById("voiceStatus");
    const notesField = document.getElementById("meeting-notes");

    // если не страница генерации — выходим
    if (!voiceBtn || !notesField || !voiceStatus) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        voiceBtn.disabled = true;
        voiceBtn.textContent = "🎤 Голосовой ввод недоступен";
        voiceStatus.textContent = "Браузер не поддерживает Web Speech API (лучше Chrome/Edge).";
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.continuous = true;
    recognition.interimResults = true;

    let lastFinalChunk = ""; // последний финальный кусок (для точки после stop)
    let lastCommitted = "";  // защита от дублей

    function setUIRecording(state) {
        isRecording = state;

        if (state) {
            voiceBtn.classList.add("is-recording");
            voiceStatus.classList.add("is-recording");
            voiceBtn.textContent = "⏹ Остановить запись";
            voiceStatus.textContent = "🎙 Идёт запись... говорите";
        } else {
            voiceBtn.classList.remove("is-recording");
            voiceStatus.classList.remove("is-recording");
            voiceBtn.textContent = "🎤 Начать запись";
            voiceStatus.textContent = "Голосовой ввод: выключен";
        }
    }

    recognition.onstart = () => {
        lastFinalChunk = "";
        lastCommitted = "";
        setUIRecording(true);
    };

    recognition.onend = () => {
        // после остановки — завершить последний кусок точкой и абзацем
        if (lastFinalChunk.trim()) {
            notesField.value += ensureSentenceEndAndParagraph(lastFinalChunk);
        }
        setUIRecording(false);
    };

    recognition.onerror = (e) => {
        voiceStatus.textContent = `Ошибка голосового ввода: ${e.error}`;
        setUIRecording(false);
    };

    recognition.onresult = (event) => {
        let finalText = "";
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalText += transcript;
            else interimText += transcript;
        }

        //  добавляем ТОЛЬКО финальные куски
        if (finalText.trim()) {
            const chunk = finalText.trim();

            // защита от повторного добавления одного и того же
            if (chunk !== lastCommitted) {
                appendSmart(notesField, chunk);
                lastCommitted = chunk;
            }

            lastFinalChunk = chunk;
        }

        // статус
        if (interimText.trim()) {
            voiceStatus.textContent = "🎙 Идёт запись... (распознаю речь)";
        } else {
            voiceStatus.textContent = "🎙 Идёт запись... говорите";
        }
    };

    // Toggle start/stop
    voiceBtn.addEventListener("click", () => {
        if (!isRecording) {
            try {
                recognition.start();
            } catch (e) {
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
    const meetingDate = document.getElementById("meeting-date")?.value || new Date().toISOString().split("T")[0];
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
6. Итоги

Данные совещания:
Тема: ${topic}
Дата: ${meetingDate}
Участники: ${participants}

Текст совещания:
${notes}
    `.trim();

    try {
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

        // сохраняем отчёт и МЕТУ (чтобы дата реально “влияла” и сохранялась)
        lastReportText = reportText;
        lastReportMeta = { topic, meetingDate, participants };

        // выводим отчёт на странице с мета-блоком
        if (resultDiv) {
            resultDiv.innerHTML = `
                <h3>Сгенерированный отчёт</h3>

                <div class="report-meta" style="margin:10px 0 14px; font-size:14px; color:#445;">
                    <div><strong>Тема:</strong> ${escapeHtml(topic)}</div>
                    <div><strong>Дата совещания:</strong> ${escapeHtml(meetingDate)}</div>
                    <div><strong>Участники:</strong> ${escapeHtml(participants)}</div>
                </div>

                <div class="report-content">${escapeHtml(reportText).replace(/\n/g, "<br>")}</div>
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
                    <p>${escapeHtml(err.message)}</p>
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
// СОХРАНЕНИЕ ОТЧЁТА В localStorage (с метаданными)
// ============================
function saveCurrentReport() {
    if (!lastReportText.trim()) {
        alert("Нет отчёта для сохранения.");
        return;
    }

    const reports = JSON.parse(localStorage.getItem("reports") || "[]");

    reports.push({
        id: Date.now(),

        // важное: это дата совещания, а не дата сохранения
        meetingDate: lastReportMeta.meetingDate || "",

        topic: lastReportMeta.topic || "",
        participants: lastReportMeta.participants || "",

        text: lastReportText,

        // дата сохранения (чтобы понимать когда сохраняли)
        savedAt: new Date().toLocaleString("ru")
    });

    localStorage.setItem("reports", JSON.stringify(reports));
    alert("Отчёт сохранён!");
}

// ============================
// DOCX: красивое форматирование (заголовки/списки/жирный)
// ============================
function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function inlineFormat(s) {
    const safe = escapeHtml(s);
    return safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function reportTextToHtml(reportText) {
    const lines = String(reportText || "")
        .replace(/\r/g, "")
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

    let html = "";
    let inUl = false;
    let inOl = false;

    function closeLists() {
        if (inUl) { html += "</ul>"; inUl = false; }
        if (inOl) { html += "</ol>"; inOl = false; }
    }

    for (const line of lines) {
        // Заголовки вида: "1. Краткое резюме"
        if (/^\d+\.\s+/.test(line)) {
            closeLists();
            html += `<h2>${inlineFormat(line.replace(/^\d+\.\s+/, ""))}</h2>`;
            continue;
        }

        // Маркированные списки "- пункт" или "• пункт"
        if (/^[-•]\s+/.test(line)) {
            if (inOl) { html += "</ol>"; inOl = false; }
            if (!inUl) { html += "<ul>"; inUl = true; }
            html += `<li>${inlineFormat(line.replace(/^[-•]\s+/, ""))}</li>`;
            continue;
        }

        // Нумерованные пункты "1) ..." или "1. ..."
        if (/^\d+[).]\s+/.test(line)) {
            if (inUl) { html += "</ul>"; inUl = false; }
            if (!inOl) { html += "<ol>"; inOl = true; }
            html += `<li>${inlineFormat(line.replace(/^\d+[).]\s+/, ""))}</li>`;
            continue;
        }

        // Обычный абзац
        closeLists();
        html += `<p>${inlineFormat(line)}</p>`;
    }

    closeLists();
    return html;
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
            <h3>Отчёт (сохранён: ${escapeHtml(r.savedAt || "")})</h3>

            <div class="report-meta" style="margin:8px 0 12px; font-size:14px; color:#445;">
                ${r.topic ? `<div><strong>Тема:</strong> ${escapeHtml(r.topic)}</div>` : ""}
                ${r.meetingDate ? `<div><strong>Дата совещания:</strong> ${escapeHtml(r.meetingDate)}</div>` : ""}
                ${r.participants ? `<div><strong>Участники:</strong> ${escapeHtml(r.participants)}</div>` : ""}
            </div>

            <div class="report-content">${escapeHtml(r.text).replace(/\n/g, "<br>")}</div>

            <div class="report-actions">
                <button class="btn-action download-txt">TXT</button>
                <button class="btn-action download-docx">DOCX</button>
                <button class="btn-action delete-report">Удалить</button>
            </div>
        </div>
    `
        )
        .join("");

    // TXT
    document.querySelectorAll(".download-txt").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".report-card");
            const id = Number(card.dataset.id);
            const report = reports.find((r) => r.id === id);

            const header =
                `AI Conference — Отчёт\n` +
                `Тема: ${report.topic || "-"}\n` +
                `Дата совещания: ${report.meetingDate || "-"}\n` +
                `Участники: ${report.participants || "-"}\n` +
                `Сохранён: ${report.savedAt || "-"}\n\n`;

            const content = header + (report.text || "");
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `report_${report.id}.txt`;
            a.click();
            URL.revokeObjectURL(a.href);
        });
    });

    // DOCX (красивый)
    document.querySelectorAll(".download-docx").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".report-card");
            const id = Number(card.dataset.id);
            const report = reports.find((r) => r.id === id);

            if (!window.htmlDocx) {
                alert("DOCX-библиотека не загружена.");
                return;
            }

            const bodyHtml = reportTextToHtml(report.text);

            const docHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
    body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.35; }
    h1 { font-size: 20pt; margin: 0 0 12pt 0; }
    h2 { font-size: 14pt; margin: 14pt 0 6pt 0; color: #0A3D91; }
    p  { margin: 0 0 8pt 0; }
    ul, ol { margin: 0 0 10pt 18pt; padding: 0; }
    li { margin: 0 0 4pt 0; }
    .meta { color: #444; margin-bottom: 10pt; }
    .hr { border-top: 1px solid #ddd; margin: 10pt 0 12pt 0; }
</style>
</head>
<body>
    <h1>Отчёт</h1>

    <div class="meta">
        <div><strong>Тема:</strong> ${escapeHtml(report.topic || "-")}</div>
        <div><strong>Дата совещания:</strong> ${escapeHtml(report.meetingDate || "-")}</div>
        <div><strong>Участники:</strong> ${escapeHtml(report.participants || "-")}</div>
        <div><strong>Сохранён:</strong> ${escapeHtml(report.savedAt || "-")}</div>
    </div>

    <div class="hr"></div>

    ${bodyHtml}
</body>
</html>`.trim();

            const blob = window.htmlDocx.asBlob(docHtml);
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `report_${report.id}.docx`;
            a.click();
            URL.revokeObjectURL(a.href);
        });
    });

    // Удаление
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
// 📊 Аналитика: столбиковый график (проценты)
// ============================
function initAnalyticsChart() {
    const plot = document.getElementById("chartPlot");
    const xAxis = document.getElementById("chartX");

    if (!plot || !xAxis) return;

    // ДАННЫЕ (4 месяца, 30–100%)
    const data = [
        { month: "Сен", value: 55 },
        { month: "Окт", value: 70 },
        { month: "Ноя", value: 82 },
        { month: "Дек", value: 95 }
    ];

    const MIN = 30;
    const MAX = 95;

    function clamp(v) {
        return Math.max(MIN, Math.min(MAX, v));
    }

function valueToHeightPercent(v) {
    const pct = ((clamp(v) - MIN) / (MAX - MIN)) * 100;
    return Math.min(pct, 98); // чтобы 100% не упиралось в верх
}


    // очистка
    plot.querySelectorAll(".chart-bar").forEach(el => el.remove());
    xAxis.innerHTML = "";

    // столбики
    data.forEach((item, index) => {
        const height = valueToHeightPercent(item.value);
        const left = 6 + index * 24;

        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.left = `${left}%`;
        bar.style.height = `${height}%`;

        bar.innerHTML = `
            <div class="bar-value">${item.value}%</div>
        `;

        plot.appendChild(bar);

        const x = document.createElement("div");
        x.className = "x-item";
        x.textContent = item.month;
        xAxis.appendChild(x);
    });
}


// ============================
// ИНИЦИАЛИЗАЦИЯ
// ============================
document.addEventListener("DOMContentLoaded", () => {
    initVoiceInput();

    const form = document.getElementById("generate-form");
    if (form) {
        form.addEventListener("submit", handleGenerate);

        const saveBtn = document.getElementById("saveReportBtn");
        if (saveBtn) saveBtn.addEventListener("click", saveCurrentReport);
    }

    initSavedPage();
    initAnalyticsChart();

});






