//------------------------------------------------------
// ЛОКАЛЬНЫЙ BACKEND (БЕЗ ТУННЕЛЕЙ)
//------------------------------------------------------

const API_URL = "https://d5daa3l57dbs31c57gfp.fary004x.apigw.yandexcloud.net/generate";
console.log("Используем backend:", API_URL);



//------------------------------------------------------
// ОСНОВНОЙ КОД
//------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("generate-form");
    const reportBlock = document.getElementById("reportResult");
    const saveButton = document.getElementById("saveReportBtn");
    const savedReportsContainer = document.getElementById("savedReports");

    //--------------------------------------------------
    // ГЕНЕРАЦИЯ ОТЧЁТА ЧЕРЕЗ НЕЙРОСЕТЬ
    //--------------------------------------------------
    if (form && reportBlock) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const topic = document.getElementById("meeting-topic").value.trim();
            const dateRaw = document.getElementById("meeting-date").value;
            const participants = document.getElementById("participants").value.trim();
            const notes = document.getElementById("meeting-notes").value.trim();

            if (!topic && !notes) {
                reportBlock.innerHTML = "<p><strong>Заполните хотя бы тему или текст совещания.</strong></p>";
                reportBlock.classList.remove("hidden");
                saveButton.classList.add("hidden");
                return;
            }

            const displayDate = dateRaw
                ? dateRaw.split("-").reverse().join(".")
                : "";

            reportBlock.innerHTML = "<p><em>Идёт генерация отчёта нейросетью...</em></p>";
            reportBlock.classList.remove("hidden");
            saveButton.classList.add("hidden");

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        topic,
                        date: displayDate,
                        participants,
                        notes
                    })
                });

                const data = await response.json();

                if (data.error) {
                    reportBlock.innerHTML = `<p><strong>Ошибка:</strong> ${data.error}</p>`;
                    return;
                }

                const aiText = data.result || "Нейросеть не вернула ответ.";

                const html = aiText
                    .split("\n")
                    .map(line => `<p>${line.trim()}</p>`)
                    .join("");

                reportBlock.innerHTML = html;
                saveButton.classList.remove("hidden");

            } catch (err) {
                console.error(err);
                reportBlock.innerHTML = "<p><strong>Ошибка связи с backend. Убедитесь, что server.mjs запущен.</strong></p>";
            }
        });
    }


    //--------------------------------------------------
    // СОХРАНЕНИЕ ОТЧЁТА
    //--------------------------------------------------
    if (saveButton) {
        saveButton.addEventListener("click", () => {

            if (reportBlock.classList.contains("hidden")) {
                alert("Сначала сгенерируйте отчёт.");
                return;
            }

            const saved = JSON.parse(localStorage.getItem("reports") || "[]");

            saved.push({
                id: Date.now(),
                createdAt: new Date().toLocaleString("ru-RU"),
                content: reportBlock.innerHTML
            });

            localStorage.setItem("reports", JSON.stringify(saved));

            alert("Отчёт сохранён!");
        });
    }


    //--------------------------------------------------
    // ОТОБРАЖЕНИЕ СОХРАНЁННЫХ ОТЧЁТОВ
    //--------------------------------------------------
    if (savedReportsContainer) {

        const saved = JSON.parse(localStorage.getItem("reports") || "[]");

        if (saved.length === 0) {
            savedReportsContainer.innerHTML = "<p>Пока нет сохранённых отчётов.</p>";
            return;
        }

        savedReportsContainer.innerHTML = saved
            .map(report => `
                <article class="card" style="margin-bottom: 16px;">
                    <p><strong>Создан:</strong> ${report.createdAt}</p>
                    <div>${report.content}</div>
                    <div style="margin-top: 10px; display:flex; gap:10px;">
                        <button class="btn btn-outline" onclick="deleteReport(${report.id})">Удалить</button>
                        <button class="btn btn-primary" onclick="downloadReport(${report.id})">Скачать .txt</button>
                    </div>
                </article>
            `)
            .join("");
    }
});


//------------------------------------------------------
// УДАЛЕНИЕ ОТЧЁТА
//------------------------------------------------------

function deleteReport(id) {
    let saved = JSON.parse(localStorage.getItem("reports") || "[]");

    saved = saved.filter(r => r.id !== id);

    localStorage.setItem("reports", JSON.stringify(saved));

    location.reload();
}


//------------------------------------------------------
// СКАЧАТЬ ОТЧЁТ В .TXT
//------------------------------------------------------

function downloadReport(id) {
    const saved = JSON.parse(localStorage.getItem("reports") || "[]");
    const report = saved.find(r => r.id === id);

    if (!report) return;

    const text = report.content
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<li>/gi, " - ")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "report.txt";
    a.click();

    URL.revokeObjectURL(url);
}


