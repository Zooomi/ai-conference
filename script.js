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
        // Проверяем, что мы на странице генерации
        if (!window.location.pathname.includes('generate')) {
            console.log('Не на странице генерации, перенаправляю...');
            window.location.href = 'generate.html';
            return;
        }
        
        // Получаем данные из формы
        const formData = {
            topic: document.getElementById('meeting-topic').value.trim(),
            date: document.getElementById('meeting-date').value,
            participants: document.getElementById('participants').value.trim(),
            notes: document.getElementById('meeting-notes').value.trim()
        };
        
        console.log('📊 Данные формы:', formData);
        
        // Проверяем обязательные поля
        if (!formData.topic) {
            showMessage('Пожалуйста, введите тему совещания', 'error');
            document.getElementById('meeting-topic').focus();
            return;
        }
        
        if (!formData.notes) {
            showMessage('Пожалуйста, опишите ход совещания', 'error');
            document.getElementById('meeting-notes').focus();
            return;
        }
        
        // Показываем загрузку
        showLoading(true);
        
        // Формируем промпт для GPT
        const prompt = `
На основе следующих данных совещания сгенерируй структурированный отчет:

ТЕМА СОВЕЩАНИЯ: ${formData.topic}
ДАТА: ${formData.date || 'не указана'}
УЧАСТНИКИ: ${formData.participants || 'не указаны'}
ХОД СОВЕЩАНИЯ:
${formData.notes}

Создай профессиональный отчет со следующими разделами:
1. Введение и цели встречи
2. Участники и повестка дня  
3. Основные обсуждаемые вопросы и предложения
4. Принятые решения и обоснования
5. Распределение задач (ответственные лица, сроки выполнения)
6. Заключение и следующие шаги

Отчет должен быть готов к использованию в рабочем процессе.
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
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Ошибка API:', errorText);
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Ответ получен:', result);
        
        // Извлекаем текст
        let reportText = extractTextFromResponse(result);
        
        if (!reportText) {
            reportText = `Сгенерированный отчет по теме "${formData.topic}"\n\nНа основе введенных данных система подготовила структурированный отчет о совещании.\n\nОсновные решения и задачи будут отображены здесь после обработки.`;
        }
        
        // Показываем результат
        displayReport(reportText);
        showLoading(false);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showLoading(false);
        
        // Показываем заглушку если API не работает
        const formData = {
            topic: document.getElementById('meeting-topic').value.trim() || 'совещание',
            date: document.getElementById('meeting-date').value || new Date().toISOString().split('T')[0]
        };
        
        const fallbackReport = generateFallbackReport(formData);
        displayReport(fallbackReport);
        
        showMessage(`Внимание: используется демо-режим. ${error.message}`, 'warning');
    }
}

// ============================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================

// Извлечение текста из ответа API
function extractTextFromResponse(data) {
    if (!data) return '';
    
    // Пробуем разные форматы ответа
    if (typeof data === 'string') return data;
    if (data.result) return data.result;
    if (data.text) return data.text;
    if (data.body) {
        try {
            const parsed = JSON.parse(data.body);
            return parsed.result || parsed.text || data.body;
        } catch {
            return data.body;
        }
    }
    if (data.alternatives && data.alternatives[0]) {
        return data.alternatives[0].message?.text || data.alternatives[0].text;
    }
    
    return JSON.stringify(data, null, 2);
}

// Генерация заглушки если API не работает
function generateFallbackReport(formData) {
    const today = new Date().toLocaleDateString('ru-RU');
    
    return `
ОТЧЕТ О СОВЕЩАНИИ
=====================

Тема: ${formData.topic}
Дата: ${formData.date || today}
Статус: Сгенерировано в демо-режиме

1. ВВЕДЕНИЕ
-----------
Проведено совещание по теме "${formData.topic}". Целью встречи было обсуждение текущего состояния и определение дальнейших шагов.

2. УЧАСТНИКИ
-----------
Участники совещания согласно предоставленным данным.

3. ОСНОВНЫЕ ВОПРОСЫ
-----------------
• Обсуждение ключевых аспектов темы
• Анализ текущей ситуации
• Определение приоритетных направлений

4. ПРИНЯТЫЕ РЕШЕНИЯ
-----------------
• Утвержден план дальнейших действий
• Определены ответственные лица
• Установлены контрольные точки

5. ЗАДАЧИ И СРОКИ
---------------
1. Задача 1 - Ответственный: [ФИО] - Срок: [дата]
2. Задача 2 - Ответственный: [ФИО] - Срок: [дата]
3. Задача 3 - Ответственный: [ФИО] - Срок: [дата]

6. ЗАКЛЮЧЕНИЕ
------------
Совещание прошло продуктивно. Все участники подтвердили понимание поставленных задач. Следующая встреча запланирована на [дата].

---
Примечание: Это демо-отчет. При подключении Yandex GPT отчет будет генерироваться на основе введенных данных.
    `.trim();
}

// Показать отчет
function displayReport(text) {
    const resultDiv = document.getElementById('reportResult');
    const saveBtn = document.getElementById('saveReportBtn');
    
    if (!resultDiv) {
        console.error('❌ Элемент reportResult не найден');
        return;
    }
    
    // Форматируем текст
    const formattedText = text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Показываем результат
    resultDiv.innerHTML = `
        <h3><i class="fas fa-file-alt"></i> Сгенерированный отчет</h3>
        <div class="report-content">
            ${formattedText}
        </div>
        <div class="report-actions">
            <button onclick="copyToClipboard('${text.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')" 
                    class="btn-action">
                <i class="fas fa-copy"></i> Копировать
            </button>
            <button onclick="downloadReport('${formData.topic || 'отчет'}', '${text.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')" 
                    class="btn-action">
                <i class="fas fa-download"></i> Скачать
            </button>
        </div>
    `;
    
    // Показываем блок с результатом
    resultDiv.classList.remove('hidden');
    
    // Показываем кнопку сохранения
    if (saveBtn) {
        saveBtn.classList.remove('hidden');
        saveBtn.onclick = function() {
            saveReportToLocal(text);
        };
    }
    
    // Прокручиваем к результату
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    console.log('✨ Отчет отображен');
}

// Показать/скрыть загрузку
function showLoading(show) {
    let loader = document.getElementById('loadingIndicator');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loadingIndicator';
            loader.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px 40px;
                border-radius: 10px;
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
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                "></div>
                <h4 style="margin: 0 0 10px 0; color: #333;">Генерация отчета</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">Идет обработка с помощью AI...</p>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            
            document.body.appendChild(loader);
        }
    } else {
        if (loader) {
            loader.remove();
        }
    }
}

// Показать сообщение
function showMessage(text, type = 'info') {
    // Удаляем старое сообщение
    const oldMsg = document.getElementById('flashMessage');
    if (oldMsg) oldMsg.remove();
    
    const message = document.createElement('div');
    message.id = 'flashMessage';
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d4edda'};
        color: ${type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#155724'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        z-index: 1001;
        max-width: 400px;
        animation: slideIn 0.3s ease;
        border-left: 4px solid ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#28a745'};
    `;
    
    message.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'}" 
               style="font-size: 18px;"></i>
            <span>${text}</span>
        </div>
        <style>
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
    `;
    
    document.body.appendChild(message);
    
    // Автоскрытие
    setTimeout(() => {
        if (message.parentNode) {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-10px)';
            message.style.transition = 'all 0.3s';
            
            setTimeout(() => {
                if (message.parentNode) message.remove();
            }, 300);
        }
    }, 5000);
}

// Копировать в буфер
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showMessage('Текст скопирован!', 'info'))
        .catch(err => {
            console.error('Ошибка копирования:', err);
            showMessage('Не удалось скопировать текст', 'error');
        });
}

// Скачать отчет
function downloadReport(filename, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/[^a-zа-я0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Отчет скачивается...', 'info');
}

// Сохранить в localStorage
function saveReportToLocal(text) {
    try {
        const reports = JSON.parse(localStorage.getItem('aiConferenceReports') || '[]');
        const newReport = {
            id: Date.now(),
            date: new Date().toISOString(),
            topic: document.getElementById('meeting-topic').value || 'Без темы',
            content: text,
            preview: text.substring(0, 150) + '...'
        };
        
        reports.unshift(newReport);
        localStorage.setItem('aiConferenceReports', JSON.stringify(reports));
        
        showMessage('Отчет сохранен!', 'info');
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showMessage('Не удалось сохранить отчет', 'error');
    }
}

// ============================
// ИНИЦИАЛИЗАЦИЯ
// ============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 AI Conference инициализирован');
    console.log('🌐 API URL:', API_URL);
    
    // Находим форму
    const form = document.getElementById('generate-form');
    if (!form) {
        console.warn('Форма generate-form не найдена');
        return;
    }
    
    console.log('✅ Форма найдена, добавляю обработчик...');
    
    // Добавляем обработчик отправки формы
    form.addEventListener('submit', function(event) {
        console.log('📝 Форма отправлена');
        generateReport(event);
    });
    
    // Тестовая кнопка для отладки
    if (window.location.hostname.includes('github.io') || window.location.hostname === 'localhost') {
        const debugBtn = document.createElement('button');
        debugBtn.innerHTML = '🐛 Тест API';
        debugBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #6c5ce7;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            z-index: 999;
            opacity: 0.8;
        `;
        
        debugBtn.onclick = async function() {
            console.log('🧪 Тестирую API...');
            showMessage('Тестирую соединение с API...', 'info');
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({prompt: "Тест соединения", test: true})
                });
                
                const result = await response.json();
                console.log('Тест API:', { status: response.status, result: result });
                
                if (response.ok) {
                    showMessage(`✅ API работает! Статус: ${response.status}`, 'info');
                } else {
                    showMessage(`❌ API ошибка: ${response.status}`, 'error');
                }
            } catch (error) {
                console.error('Ошибка теста:', error);
                showMessage(`❌ Ошибка соединения: ${error.message}`, 'error');
            }
        };
        
        document.body.appendChild(debugBtn);
    }
    
    console.log('✅ Система готова к работе!');
});
