// script.js — теперь только для saved.html

document.addEventListener("DOMContentLoaded", () => {
    const savedContainer = document.getElementById("savedReports");
    if (!savedContainer) return;

    const reports = JSON.parse(localStorage.getItem("reports") || "[]");

    if (reports.length === 0) {
        savedContainer.innerHTML = "<p>Пока нет сохранённых отчётов.</p>";
        return;
    }

    savedContainer.innerHTML = reports
        .map(
            (r) => `
        <div class="report-card">
            <h3>Отчёт от ${r.date}</h3>
            <div class="report-content">${r.text.replace(/\n/g, "<br>")}</div>
        </div>
    `
        )
        .join("");
});
