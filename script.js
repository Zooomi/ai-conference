// ИСПРАВЛЕННЫЙ URL!
const API_URL = 'https://d5daa3l57dbs31c57gfp.fary004x.apigw.yandexcloud.net/generate';

async function generateSummary() {
    console.log('Функция generateSummary вызвана');
    
    const dataForm = document.getElementById('dataForm');
    const formData = new FormData(dataForm);
    
    // Собираем данные из формы
    const userData = {
        theme: formData.get('theme') || '',
        date: formData.get('date') || '',
        location: formData.get('location') || '',
        participants: formData.get('participants') || '',
        duration: formData.get('duration') || '',
        keyPoints: formData.get('keyPoints') || '',
        decisions: formData.get('decisions') || '',
        tasks: formData.get('tasks') || ''
    };
    
    console.log('Данные формы:', userData);
    
    // Формируем промпт для GPT
    const prompt = `Сгенерируй профессиональный отчет о совещании на основе следующих данных:
    
Тема совещания: ${userData.theme}
Дата: ${userData.date}
Место проведения: ${userData.location}
Участники: ${userData.participants}
Продолжительность: ${userData.duration}
Ключевые моменты: ${userData.keyPoints}
Принятые решения: ${userData.decisions}
Поставленные задачи: ${userData.tasks}

Сгенерируй структурированный отчет в формате: Введение, Основные обсуждения, Решения, Задачи, Заключение.`;
    
    // Показываем индикатор загрузки
    const resultDiv = document.getElementById('summaryResult');
    resultDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Генерируем отчет с помощью AI...</p>
        </div>
    `;
    resultDiv.classList.remove('hidden');
    
    try {
        console.log('Отправляю запрос на API...');
        
        // Формируем тело запроса
        const requestBody = {
            prompt: prompt,
            max_tokens: 2000,
            temperature: 0.7
        };
        
        console.log('Тело запроса:', requestBody);
        
        // Отправляем запрос С CORS!
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors', // ← ВАЖНО: добавляем mode cors
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Статус ответа:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Текст ошибки:', errorText);
            throw new Error(`Ошибка API: ${response.status} - ${response.statusText}`);
        }
        
        // Получаем ответ
        const data = await response.json();
        console.log('Полный ответ API:', data);
        
        // Извлекаем текст ответа
        let generatedText = '';
        
        if (data.result) {
            generatedText = data.result;
        } else if (data.text) {
            generatedText = data.text;
        } else if (data.body) {
            try {
                const parsed = JSON.parse(data.body);
                generatedText = parsed.result || parsed.text || data.body;
            } catch {
                generatedText = data.body;
            }
        } else if (data.choices && data.choices[0]) {
            generatedText = data.choices[0].message?.content || data.choices[0].text;
        } else {
            generatedText = JSON.stringify(data, null, 2);
        }
        
        // Показываем результат
        resultDiv.innerHTML = `
            <div class="summary-content">
                <h3>Сгенерированный отчет:</h3>
                <div class="summary-text">${generatedText.replace(/\n/g, '<br>')}</div>
                <button onclick="downloadSummary('${generatedText.replace(/'/g, "\\'")}')" class="btn-download">
                    📥 Скачать отчет
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('Ошибка:', error);
        resultDiv.innerHTML = `
            <div class="error">
                <h3>Ошибка при генерации отчета:</h3>
                <p>${error.message}</p>
                <p>Проверьте:</p>
                <ol>
                    <li>API Gateway развернут и работает</li>
                    <li>Функция Cloud Functions активна</li>
                    <li>Нет проблем с сетью</li>
                </ol>
                <button onclick="testAPI()" class="btn-test">Тестировать API</button>
            </div>
        `;
    }
}

// Функция для тестирования API с CORS
async function testAPI() {
    console.log('Тестирую API с CORS...');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors', // ← ВАЖНО
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: "Ответь коротко: тест API работает?",
                max_tokens: 50
            })
        });
        
        console.log('Статус теста:', response.status);
        const text = await response.text();
        console.log('Тестовый ответ:', text);
        
        try {
            const data = JSON.parse(text);
            alert(`✅ API работает!\nСтатус: ${response.status}\nОтвет: ${data.result || data.text || text.substring(0, 100)}...`);
        } catch {
            alert(`✅ API работает!\nСтатус: ${response.status}\nОтвет: ${text.substring(0, 100)}...`);
        }
        
    } catch (error) {
        console.error('Ошибка теста:', error);
        alert(`❌ Ошибка теста: ${error.message}`);
    }
}

// Остальные функции остаются без изменений...
function downloadSummary(text) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'отчет-совещания.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена, API URL:', API_URL);
    
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateSummary);
        console.log('Кнопка найдена и обработчик добавлен');
    } else {
        console.error('Кнопка generateBtn не найдена!');
    }
});

