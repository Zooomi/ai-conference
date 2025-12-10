// script.js — логика страницы "Сохранённые"

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("savedReports");
    if (!container) return;

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
                <button class="btn-action download-txt">Скачать TXT</button>
                <button class="btn-action delete-report" style="background:#c0392b;">Удалить</button>
            </div>
        </div>
    `
        )
        .join("");

    // --- Скачать TXT ---
    document.querySelectorAll(".download-txt").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".report-card");
            const id = Number(card.dataset.id);
            const report = reports.find((r) => r.id === id);

            if (!report) return;

            const fileName = `report_${report.id}.txt`;
            const fileContent = `Отчёт от ${report.date}\n\n${report.text}`;

            const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();

            URL.revokeObjectURL(url);
        });
    });

    // --- Удалить отчёт ---
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
