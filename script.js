// ============================
// КОНФИГ ДЛЯ API БЭКЕНДА
// ============================
// Здесь URL ТВОЕГО Node.js-сервера с GigaChat.
// Для локального теста:
const API_URL = "http://localhost:3000/generate";

let lastReportText = "";

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

    // Формируем промпт (как раньше, только теперь для GigaChat)
    const prompt = `
Ты — эксперт по анализу совещаний. 
Твоя задача — сделать глубокое смысловое сжатие текста.

Правила:
- НЕ переписывай текст.
- НЕ используй цитаты.
- НЕ повторяй диалоги.
- Пиши только смысл.
- Выделяй причины, обсуждения, принятые решения, план действий.

Сформируй структурированный отчёт:

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
        const resp = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Ошибка сервера (${resp.status}): ${text}`);
        }

        const data = await resp.json();
        const reportText = data.result || data.answer || "Не удалось получить отчёт от GigaChat.";

        lastReportText = reportText;

        if (resultDiv) {
            resultDiv.innerHTML = `
                <h3>Сгенерированный отчёт</h3>
                <div class="report-content">${reportText.replace(/\n/g, "<br>")}</div>
            `;
            resultDiv.classList.remove("hidden");
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
                    <p>Проверьте, что backend-сервер запущен и доступен по адресу ${API_URL}.</p>
                </div>
            `;
        }
        if (statusEl) statusEl.textContent = "Не удалось получить ответ от GigaChat.";
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
    if (!lastReportText || !lastReportText.trim()) {
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

    alert("Отчёт сохранён! Его можно посмотреть во вкладке «Сохранённые».");
}

// ============================
// ЛОГИКА ДЛЯ СТРАНИЦЫ "СОХРАНЁННЫЕ"
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

    // Хелпер для экранирования
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // TXT
    document.querySelectorAll(".download-txt").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".report-card");
            const id = Number(card.dataset.id);
            const report = reports.find((r) => r.id === id);
            if (!report) return;

            const fileName = `report_${report.id}.txt`;
            const content = `Отчёт от ${report.date}\n\n${report.text}`;

            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        });
    });

    // DOCX через html-docx-js
    document.querySelectorAll(".download-docx").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".report-card");
            const id = Number(card.dataset.id);
            const report = reports.find((r) => r.id === id);
            if (!report) return;

            if (!window.htmlDocx || !window.htmlDocx.asBlob) {
                alert("Библиотека для DOCX ещё не загрузилась. Обновите страницу.");
                return;
            }

            const safeText = escapeHtml(report.text);
            const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Отчёт от ${escapeHtml(report.date)}</title>
</head>
<body>
<h1>Отчёт от ${escapeHtml(report.date)}</h1>
<pre style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 12pt;">
${safeText}
</pre>
</body>
</html>`;

            const blob = window.htmlDocx.asBlob(html);
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
            if (reports.length === 0) {
                container.innerHTML = "<p>Пока нет сохранённых отчётов.</p>";
            }
        });
    });
}

// ============================
// ИНИЦИАЛИЗАЦИЯ
// ============================
document.addEventListener("DOMContentLoaded", () => {
    // Страница генерации
    const form = document.getElementById("generate-form");
    if (form) {
        form.addEventListener("submit", handleGenerate);
        const saveBtn = document.getElementById("saveReportBtn");
        if (saveBtn) {
            saveBtn.addEventListener("click", saveCurrentReport);
        }
    }

    // Страница сохранённых
    initSavedPage();
});
