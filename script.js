// script.js — только для страницы Сохранённые

document.addEventListener("DOMContentLoaded", () => {
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
                <button class="btn-action download-pdf">Скачать PDF</button>
                <button class="btn-action delete-report" style="background:#c0392b;">Удалить</button>
            </div>
        </div>
    `
        )
        .join("");

    // Кнопка PDF
    document.querySelectorAll(".download-pdf").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const card = e.target.closest(".report-card");
            const id = card.dataset.id;
            const report = reports.find((r) => r.id == id);

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: "pt", format: "a4" });

            const text = `Отчёт от ${report.date}\n\n${report.text}`;
            const lines = doc.splitTextToSize(text, 550);

            doc.text(lines, 30, 40);
            doc.save(`report_${report.id}.pdf`);
        });
    });

    // Кнопка удаления
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
