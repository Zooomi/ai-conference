// ============================
// КОНФИГУРАЦИЯ API
// ============================
const API_URL = 'https://d5daa3l57dbs31c57gfp.fary004x.apigw.yandexcloud.net/generate';

// ============================
// ГЛАВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ
// ============================
async function generateReport(event) {
    console.log('🚀 Начинаю генерацию отчета...');
    
    // Останавливаем отправку формы
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    try {
        // Получаем данные из формы
        const topic = document.getElementById('meeting-topic').value.trim() || 'Совещание';
        const date = document.getElementById('meeting-date').value || new Date().toISOString().split('T')[0];
        const participants = document.getElementById('participants').value.trim() || 'Команда проекта';
        const notes = document.getElementById('meeting-notes').value.trim() || 'Обсуждение рабочих вопросов';
        
        console.log('📊 Данные формы:', { topic, date, participants });
        
        // Показываем загрузку
        const resultDiv = document.getElementById('reportResult');
        resultDiv.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p>Генерируем отчет с помощью AI...</p>
                <style>@keyframes spin {0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}</style>
            </div>
        `;
        resultDiv.classList.remove('hidden');
        
        // Формируем промпт
        const prompt = `
Сгенерируй структурированный отчет о совещании:

Тема: ${topic}
Дата: ${date}
Участники: ${participants}
Ход совещания: ${notes}

Создай отчет в формате:
1. Введение
2. Основные вопросы
3. Принятые решения
4. Поставленные задачи (с ответственными и сроками)
5. Заключение
        `.trim();
        
        console.log('📝 Отправляю запрос к API...');
        
        // Отправляем запрос
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: 2000,
                temperature: 0.7
            })
        });
        
        console.log('📡 Статус ответа:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('✅ Ответ получен:', data);
        
        // Показываем результат
        let reportText = data.result || 'Не удалось сгенерировать отчет';
        
        resultDiv.innerHTML = `
            <h3><i class="fas fa-file-alt"></i> Сгенерированный отчет</h3>
            <div class="report-content">
                ${reportText.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
            <div class="report-actions">
                <button onclick="copyToClipboard('${reportText.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')" 
                        class="btn-action">
                    <i class="fas fa-copy"></i> Копировать текст
                </button>
                <button onclick="downloadReport('${topic.replace(/[^a-zа-я0-9]/gi, '_')}', '${reportText.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')" 
                        class="btn-action">
                    <i class="fas fa-download"></i> Скачать отчет
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        
        const resultDiv = document.getElementById('reportResult');
        resultDiv.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px;">
                <h3>Ошибка при генерации</h3>
                <p>${error.message}</p>
                <p>Попробуйте снова или проверьте настройки API.</p>
            </div>
        `;
    }
}

// Вспомогательные функции
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert('Текст скопирован в буфер обмена!'))
        .catch(() => alert('Не удалось скопировать текст'));
}

function downloadReport(filename, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 AI Conference инициализирован');
    console.log('🌐 API URL:', API_URL);
    
    const form = document.getElementById('generate-form');
    if (form) {
        form.addEventListener('submit', generateReport);
        console.log('✅ Форма подключена');
    }
});
