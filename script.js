// script.js — логика страницы "Сохранённые": TXT + DOCX + удалить

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("savedReports");
    if (!container) return; // на других страницах просто выходим

    let reports = JSON.parse(localStorage.getItem("reports") || "[]");

    if (reports.length === 0) {
        container.innerHTML = "<p>Пока нет сохранённых отчётов.</p>";
        return;
    }

    // Рендерим список отчётов
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

    // Хелпер для экранирования HTML
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // -------------------------
    // СКАЧАТЬ TXT
    // -------------------------
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

    // -------------------------
    // СКАЧАТЬ DOCX (через html-docx-js)
    // -------------------------
    document.querySelectorAll(".download-docx").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".report-card");
            const id = Number(card.dataset.id);
            const report = reports.find((r) => r.id === id);
            if (!report) return;

            if (!window.htmlDocx || !window.htmlDocx.asBlob) {
                alert("Библиотека для DOCX ещё не загрузилась. Попробуйте обновить страницу.");
                return;
            }

            // Формируем простой HTML-документ для Word
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

            // Конвертируем HTML в DOCX blob
            const blob = window.htmlDocx.asBlob(html);

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `report_${report.id}.docx`;
            a.click();
            URL.revokeObjectURL(a.href);
        });
    });

    // -------------------------
    // УДАЛИТЬ ОТЧЁТ
    // -------------------------
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
});
