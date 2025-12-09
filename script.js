// ============================
// КОНФИГУРАЦИЯ
// ============================
const API_URL = 'https://d5daa3l57dbs31c57gfp.fary004x.apigw.yandexcloud.net/generate';

// ============================
// ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ
// ============================
async function generateSummary(event) {
    console.log('🚀 ========== НАЧАЛО ГЕНЕРАЦИИ ==========');
    
    try {
        // Предотвращаем отправку формы
        if (event) event.preventDefault();
        console.log('✅ Отправка формы предотвращена');
        
        // Находим форму
        const form = document.querySelector('form[id="dataForm"]') || 
                    document.querySelector('form') ||
                    document.querySelector('.conference-form');
        
        console.log('📋 Форма найдена:', !!form);
        
        if (!form) {
            throw new Error('Форма не найдена на странице. Проверьте структуру HTML.');
        }
        
        // Собираем данные формы
        const formData = new FormData(form);
        const formValues = {};
        
        for (let [key, value] of formData.entries()) {
            formValues[key] = value || '';
        }
        
        console.log('📊 Данные формы:', formValues);
        
        // Формируем промпт для GPT
        const prompt = `
Сгенерируй профессиональный отчет о совещании на основе следующих данных:

ТЕМА СОВЕЩАНИЯ: ${formValues.theme || formValues.topic || 'Не указана'}
ДАТА: ${formValues.date || 'Не указана'}
МЕСТО ПРОВЕДЕНИЯ: ${formValues.location || formValues.place || 'Не указано'}
УЧАСТНИКИ: ${formValues.participants || formValues.attendees || 'Не указаны'}
ПРОДОЛЖИТЕЛЬНОСТЬ: ${formValues.duration || 'Не указана'}
КЛЮЧЕВЫЕ МОМЕНТЫ: ${formValues.keyPoints || formValues.key_points || 'Не указаны'}
ПРИНЯТЫЕ РЕШЕНИЯ: ${formValues.decisions || 'Не указаны'}
ПОСТАВЛЕННЫЕ ЗАДАЧИ: ${formValues.tasks || formValues.assignments || 'Не указаны'}

Создай структурированный отчет со следующими разделами:
1. Введение и цели совещания
2. Основные обсуждаемые вопросы
3. Принятые решения
4. Распределение задач
5. Сроки выполнения
6. Заключение и следующие шаги

Отчет должен быть профессиональным, четким и готовым к использованию.
        `.trim();
        
        console.log('📝 Длина промпта:', prompt.length, 'символов');
        
        // Показываем индикатор загрузки
        showLoadingIndicator(true);
        
        // Формируем тело запроса
        const requestBody = {
            prompt: prompt,
            max_tokens: 2000,
            temperature: 0.7
        };
        
        console.log('📦 Тело запроса:', requestBody);
        console.log('📨 Отправляю запрос на:', API_URL);
        
        // Отправляем запрос
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📡 Статус ответа:', response.status, response.statusText);
        
        // Проверяем ответ
        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
            } catch (e) {
                errorText = 'Не удалось прочитать текст ошибки';
            }
            
            console.error('❌ Ошибка API:', {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText
            });
            
            throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
        }
        
        // Получаем данные
        const result = await response.json();
        console.log('✅ Данные получены:', result);
        
        // Извлекаем текст ответа
        let generatedText = '';
        
        if (result.result) {
            generatedText = result.result;
        } else if (result.text) {
            generatedText = result.text;
        } else if (result.body) {
            try {
                const parsedBody = JSON.parse(result.body);
                generatedText = parsedBody.result || parsedBody.text || result.body;
            } catch {
                generatedText = result.body;
            }
        } else if (result.alternatives && result.alternatives[0]) {
            generatedText = result.alternatives[0].message?.text || 
                           result.alternatives[0].text || 
                           JSON.stringify(result.alternatives[0]);
        } else {
            generatedText = JSON.stringify(result, null, 2);
        }
        
        console.log('✨ Текст для отображения (первые 300 символов):', 
                   generatedText.substring(0, 300) + '...');
        
        // Скрываем индикатор загрузки
        showLoadingIndicator(false);
        
        // Показываем результат
        displayResult(generatedText);
        
    } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
        console.error('Stack trace:', error.stack);
        
        // Скрываем индикатор загрузки
        showLoadingIndicator(false);
        
        // Показываем ошибку
        displayError(error.message);
    }
    
    console.log('========== КОНЕЦ ГЕНЕРАЦИИ ==========');
}

// ============================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================

// Показать/скрыть индикатор загрузки
function showLoadingIndicator(show) {
    // Удаляем старый индикатор если есть
    const oldLoader = document.getElementById('ai-loader');
    if (oldLoader) oldLoader.remove();
    
    if (show) {
        const loader = document.createElement('div');
        loader.id = 'ai-loader';
        loader.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 30px rgba(0,0,0,0.2);
            z-index: 1000;
            text-align: center;
            min-width: 300px;
        `;
        
        loader.innerHTML = `
            <div style="
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            "></div>
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Генерация отчета</h3>
            <p style="color: #7f8c8d;">Идет обработка запроса с помощью AI...</p>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(loader);
    }
}

// Показать результат
function displayResult(text) {
    // Удаляем старый результат если есть
    const oldResult = document.getElementById('ai-result');
    if (oldResult) oldResult.remove();
    
    const resultDiv = document.createElement('div');
    resultDiv.id = 'ai-result';
    resultDiv.style.cssText = `
        margin: 30px auto;
        max-width: 900px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 5px 25px rgba(0,0,0,0.1);
        overflow: hidden;
        animation: fadeIn 0.5s ease;
    `;
    
    resultDiv.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            text-align: center;
        ">
            <h2 style="margin: 0; font-size: 24px;">✨ Отчет сгенерирован</h2>
            <p style="opacity: 0.9; margin-top: 5px;">Искусственный интеллект завершил работу</p>
        </div>
        
        <div style="padding: 30px;">
            <div style="
                background: #f8f9fa;
                border-radius: 10px;
                padding: 25px;
                margin-bottom: 25px;
                max-height: 500px;
                overflow-y: auto;
                line-height: 1.7;
                white-space: pre-wrap;
                font-size: 16px;
                color: #2c3e50;
            ">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button onclick="downloadResult('${encodeURIComponent(text)}')" 
                        style="
                            background: #27ae60;
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: background 0.3s;
                        "
                        onmouseover="this.style.background='#219653'"
                        onmouseout="this.style.background='#27ae60'">
                    📥 Скачать отчет
                </button>
                
                <button onclick="copyResult('${encodeURIComponent(text)}')" 
                        style="
                            background: #3498db;
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: background 0.3s;
                        "
                        onmouseover="this.style.background='#2980b9'"
                        onmouseout="this.style.background='#3498db'">
                    📋 Копировать текст
                </button>
                
                <button onclick="closeResult()" 
                        style="
                            background: #95a5a6;
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            transition: background 0.3s;
                        "
                        onmouseover="this.style.background='#7f8c8d'"
                        onmouseout="this.style.background='#95a5a6'">
                    ✕ Закрыть
                </button>
            </div>
        </div>
        
        <style>
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        </style>
    `;
    
    // Вставляем результат после формы
    const form = document.querySelector('form') || document.body;
    form.parentNode.insertBefore(resultDiv, form.nextSibling);
    
    // Прокручиваем к результату
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Показать ошибку
function displayError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f8d7da;
        color: #721c24;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        z-index: 1001;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 15px;">
            <div style="
                background: #dc3545;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                flex-shrink: 0;
            ">!</div>
            <div>
                <h4 style="margin: 0 0 10px 0; color: #721c24;">Ошибка генерации</h4>
                <p style="margin: 0; line-height: 1.5;">${message}</p>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="
                            margin-top: 15px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">
                    Закрыть
                </button>
            </div>
        </div>
        <style>
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Автоматическое скрытие через 10 секунд
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.style.transition = 'opacity 0.3s';
            errorDiv.style.opacity = '0';
            setTimeout(() => errorDiv.remove(), 300);
        }
    }, 10000);
}

// Скачать результат
function downloadResult(encodedText) {
    const text = decodeURIComponent(encodedText);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `отчет-совещания-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Уведомление
    showNotification('Отчет скачивается...', 'success');
}

// Копировать результат
async function copyResult(encodedText) {
    const text = decodeURIComponent(encodedText);
    
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Текст скопирован в буфер обмена!', 'success');
    } catch (err) {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Текст скопирован!', 'success');
    }
}

// Закрыть результат
function closeResult() {
    const resultDiv = document.getElementById('ai-result');
    if (resultDiv) {
        resultDiv.style.opacity = '0';
        resultDiv.style.transform = 'translateY(20px)';
        resultDiv.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            if (resultDiv.parentNode) {
                resultDiv.remove();
            }
        }, 300);
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        z-index: 1002;
        animation: slideUp 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#28a745' : '#dc3545'};
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(10px)';
        notification.style.transition = 'all 0.3s';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
    
    notification.innerHTML += `
        <style>
            @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        </style>
    `;
}

// ============================
// ИНИЦИАЛИЗАЦИЯ
// ============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Инициализация AI Conference Reporter...');
    console.log('🌐 API URL:', API_URL);
    
    // Находим все кнопки отправки
    const submitButtons = document.querySelectorAll('button[type="submit"], button.btn-primary');
    
    submitButtons.forEach((button, index) => {
        console.log(`🔍 Кнопка ${index + 1}:`, button.textContent.trim());
        
        // Добавляем обработчик
        button.addEventListener('click', function(event) {
            console.log(`🖱️ Нажата кнопка: "${button.textContent.trim()}"`);
            generateSummary(event);
        });
        
        // Меняем тип кнопки на button (чтобы форма не отправлялась)
        if (button.type === 'submit') {
            button.type = 'button';
        }
    });
    
    // Тестовая кнопка для проверки API (только в development)
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('github.io')) {
        const testButton = document.createElement('button');
        testButton.textContent = '🧪 Тест API';
        testButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #6c5ce7;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            z-index: 999;
            opacity: 0.7;
        `;
        testButton.title = 'Тестирование API Gateway';
        
        testButton.addEventListener('click', async function() {
            console.log('🧪 Тестирую API Gateway...');
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({prompt: "Тест API", test: true})
                });
                
                const result = await response.json();
                console.log('🧪 Результат теста:', result);
                
                alert(`API статус: ${response.status}\nОтвет: ${JSON.stringify(result).substring(0, 200)}...`);
            } catch (error) {
                console.error('🧪 Ошибка теста:', error);
                alert(`Ошибка теста: ${error.message}`);
            }
        });
        
        document.body.appendChild(testButton);
    }
    
    console.log('✅ Система инициализирована. Готов к работе!');
});

// ============================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ (для вызова из HTML)
// ============================
window.generateSummary = generateSummary;
window.downloadResult = downloadResult;
window.copyResult = copyResult;
window.closeResult = closeResult;

console.log('📄 AI Conference Reporter script loaded successfully!');
