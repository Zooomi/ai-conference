// ============================
// КОНФИГУРАЦИЯ API - ИСПРАВЛЕННЫЙ URL!
// ============================
const API_URL = "https://d5dfc8o72aqnsir05o3h.akta928u.apigw.yandexcloud.net";


console.log('✅ AI Conference загружен');
console.log('🌐 API URL установлен:', API_URL);

// ============================
// ГЛАВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ
// ============================
async function generateReport(event) {
    console.log('🚀 Начинаю генерацию отчета...');
    
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
        
        console.log('📊 Данные формы:', { topic, date, participants, notes });
        
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
        const prompt = `Создай отчет о совещании:
Тема: ${topic}
Дата: ${date}
Участники: ${participants}
Заметки: ${notes}

Формат отчета:
1. Введение
2. Основные вопросы
3. Принятые решения
4. Поставленные задачи
5. Заключение`;
        
        console.log('📤 Отправляю запрос к API:', API_URL);
        console.log('📝 Промпт:', prompt);
        
        // Отправляем запрос
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt
            })
        });
        
        console.log('📥 Статус ответа:', response.status, response.statusText);
        
        // Если ошибка HTTP
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Ошибка от сервера:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
        }
        
        // Получаем JSON
        const data = await response.json();
        console.log('✅ Ответ получен:', data);
        
        // Извлекаем результат
        const reportText = data.result || data.error || 'Не удалось сгенерировать отчет';
        
        // Показываем результат
        resultDiv.innerHTML = `
            <div class="report-box">
                <h3><i class="fas fa-file-alt"></i> Сгенерированный отчет</h3>
                <div class="report-content">${reportText.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                <div class="report-actions">
                    <button onclick="copyToClipboard('${reportText.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')" class="btn-action">
                        <i class="fas fa-copy"></i> Копировать текст
                    </button>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        
        const resultDiv = document.getElementById('reportResult');
        resultDiv.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px; border: 1px solid #f5c6cb;">
                <h3><i class="fas fa-exclamation-triangle"></i> Ошибка при генерации</h3>
                <p><strong>${error.message}</strong></p>
                <p>API URL: ${API_URL}</p>
                <p>Попробуйте:</p>
                <ul>
                    <li>Проверить подключение к интернету</li>
                    <li>Обновить страницу (F5)</li>
                    <li>Попробовать позже</li>
                </ul>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Обновить страницу
                </button>
            </div>
        `;
    }
}

// Вспомогательные функции
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert('✅ Текст скопирован в буфер обмена!'))
        .catch(() => alert('❌ Не удалось скопировать текст'));
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Страница загружена');
    console.log('🌐 Используемый API URL:', API_URL);
    
    const form = document.getElementById('generate-form');
    if (form) {
        form.addEventListener('submit', generateReport);
        console.log('✅ Форма подключена');
    }
    
    // Тестовый вызов API при загрузке
    setTimeout(() => {
        console.log('🔄 Тестирую API подключение...');
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'Тест подключения' })
        })
        .then(response => {
            console.log('🛜 Тест API - статус:', response.status);
            return response.text();
        })
        .then(text => {
            console.log('🛜 Тест API - ответ:', text.substring(0, 200));
        })
        .catch(err => {
            console.warn('⚠️ Тест API не прошел:', err.message);
        });
    }, 1000);
});


