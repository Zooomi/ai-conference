// script.js — логика страницы "Сохранённые" + экспорт TXT + DOCX

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("savedReports");
    if (!container) return;

    let reports = JSON.parse(localStorage.getItem("reports") || "[]");

    if (reports.length === 0) {
        container.innerHTML = "<p>Пока нет сохранённых отчётов.</p>";
        return;
    }

    // Рендер отчётов
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

    // -------------------------
    // Скачать TXT
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
    // Скачать DOCX
    // -------------------------

    document.querySelectorAll(".download-docx").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const card = e.target.closest(".report-card");
            const id = Number(card.dataset.id);
            const report = reports.find((r) => r.id === id);

            if (!report) return;

            const { Document, Packer, Paragraph, TextRun } = window.docx;

            // Разбиваем текст отчёта по строкам
            const lines = report.text.split("\n");

            // Преобразуем в массив Paragraph
            const paragraphs = [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Отчёт от ${report.date}`,
                            bold: true,
                            size: 28,
                        })
                    ],
                    spacing: { after: 350 }
                }),
                ...lines.map(
                    (line) =>
                        new Paragraph({
                            children: [new TextRun({ text: line, size: 24 })],
                            spacing: { after: 150 }
                        })
                )
            ];

            // Создаём документ
            const doc = new Document({
                sections: [
                    {
                        children: paragraphs
                    }
                ]
            });

            // Генерируем файл
            const blob = await Packer.toBlob(doc);

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `report_${report.id}.docx`;
            a.click();

            URL.revokeObjectURL(a.href);
        });
    });

    // -------------------------
    // Удаление отчёта
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
