// ИСПРАВЛЕННЫЙ URL!
const API_URL = 'https://d5daa3l57dbs31c57gfp.fary004x.apigw.yandexcloud.net/generate';

// Функция для поиска кнопки на вашей странице
function findGenerateButton() {
    // Попробуем найти кнопку разными способами
    const buttons = document.querySelectorAll('button');
    console.log('Все кнопки на странице:', buttons);
    
    // Ищем кнопку по тексту
    for (let btn of buttons) {
        const btnText = btn.textContent.toLowerCase();
        if (btnText.includes('генерировать') || 
            btnText.includes('generate') || 
            btnText.includes('отчет') ||
            btnText.includes('сгенерировать')) {
            console.log('Найдена кнопка по тексту:', btn);
            return btn;
        }
    }
    
    // Ищем по классу
    const byClass = document.querySelector('.generate-btn, .btn-generate, .btn-primary');
    if (byClass) {
        console.log('Найдена кнопка по классу:', byClass);
        return byClass;
    }
    
    // Ищем по ID
    const byId = document.getElementById('generateBtn') || 
                 document.getElementById('generate-button') ||
                 document.getElementById('generate');
    if (byId) {
        console.log('Найдена кнопка по ID:', byId);
        return byId;
    }
    
    return null;
}

async function generateSummary() {
    console.log('Функция generateSummary вызвана');
    
    // Находим форму
    const form = document.querySelector('form') || document.getElementById('dataForm');
    if (!form) {
        console.error('Форма не найдена!');
        alert('Форма не найдена на странице');
        return;
    }
    
    const formData = new FormData(form);
    
    // Собираем данные из формы
    const userData = {};
    for (let [key, value] of formData.entries()) {
        userData[key] = value || '';
    }
    
    console.log('Данные формы:', userData);
    
    // Формируем промпт для GPT
    const prompt = `Сгенерируй профессиональный отчет о совещании на основе следующих данных:
    
Тема совещания: ${userData.theme || userData.topic || ''}
Дата: ${userData.date || ''}
Место проведения: ${userData.location || userData.place || ''}
Участники: ${userData.participants || userData.attendees || ''}
Продолжительность: ${userData.duration || ''}
Ключевые моменты: ${userData.keyPoints || userData.key_points || ''}
Принятые решения: ${userData.decisions || ''}
Поставленные задачи: ${userData.tasks || userData.assignments || ''}

Сгенерируй структурированный отчет.`;
    
    // Находим блок для результатов
    let resultDiv = document.getElementById('summaryResult') || 
                    document.getElementById('result') ||
                    document.getElementById('output');
    
    if (!resultDiv) {
        // Создаем блок для результатов
        resultDiv = document.createElement('div');
        resultDiv.id = 'summaryResult';
        resultDiv.style.cssText = 'margin-top: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 5px;';
        form.parentNode.insertBefore(resultDiv, form.nextSibling);
    }
    
    // Показываем индикатор загрузки
    resultDiv.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p>Генерируем отчет с помощью AI...</p>
            <style>@keyframes spin {0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}</style>
        </div>
    `;
    
    try {
        console.log('Отправляю запрос на API... URL:', API_URL);
        
        // Формируем тело запроса
        const requestBody = {
            prompt: prompt,
            max_tokens: 2000,
            temperature: 0.7
        };
        
        console.log('Тело запроса:', requestBody);
        
        // Отправляем запрос
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
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
        } else {
            generatedText = JSON.stringify(data, null, 2);
        }
        
        // Показываем результат
        resultDiv.innerHTML = `
            <div>
                <h3 style="color: #333; margin-bottom: 15px;">Сгенерированный отчет:</h3>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-line; line-height: 1.6;">${generatedText}</div>
                <button onclick="downloadSummary('${generatedText.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')" style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 15px;">
                    📥 Скачать отчет
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('Ошибка:', error);
        resultDiv.innerHTML = `
            <div style="background: #fee; border: 1px solid #f99; padding: 20px; border-radius: 5px; color: #c00;">
                <h3>Ошибка при генерации отчета:</h3>
                <p><strong>${error.message}</strong></p>
                <p>Проверьте:</p>
                <ol>
                    <li>API Gateway развернут с CORS поддержкой</li>
                    <li>URL правильный: ${API_URL}</li>
                    <li>Функция Cloud Functions активна</li>
                </ol>
                <button onclick="testAPI()" style="background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                    Тестировать API
                </button>
            </div>
        `;
    }
}

// Функция для тестирования API
async function testAPI() {
    console.log('Тестирую API...');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: "Тест API: ответь 'Работает!' если ты слышишь меня",
                max_tokens: 50
            })
        });
        
        console.log('Статус теста:', response.status);
        const text = await response.text();
        console.log('Тестовый ответ:', text);
        
        alert(`Статус: ${response.status}\nОтвет: ${text.substring(0, 200)}`);
        
    } catch (error) {
        console.error('Ошибка теста:', error);
        alert(`Ошибка: ${error.message}\nПроверьте CORS настройки API Gateway`);
    }
}

// Функция для скачивания
function downloadSummary(text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'отчет-совещания.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена');
    console.log('API URL:', API_URL);
    
    // Ищем кнопку
    const generateBtn = findGenerateButton();
    
    if (generateBtn) {
        generateBtn.addEventListener('click', generateSummary);
        console.log('Кнопка найдена и обработчик добавлен:', generateBtn);
        
        // Добавляем тестовую кнопку в консоль
        console.log('%c Для теста API введите: testAPI()', 'color: blue; font-weight: bold;');
    } else {
        console.error('Кнопка не найдена! Создаем свою...');
        
        // Создаем кнопку, если не нашли
        const newBtn = document.createElement('button');
        newBtn.textContent = 'Сгенерировать отчет AI';
        newBtn.style.cssText = 'background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 20px 0;';
        newBtn.onclick = generateSummary;
        
        // Вставляем после формы
        const form = document.querySelector('form');
        if (form) {
            form.parentNode.insertBefore(newBtn, form.nextSibling);
            console.log('Создана новая кнопка');
        }
    }
    
    // Добавляем глобальную функцию для теста
    window.testAPI = testAPI;
});
