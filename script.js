// ИСПРАВЬТЕ ЭТУ СТРОКУ
const API_URL = 'https://d5daa3l57dbs31c57gfp.fary004x.apigw.yandexcloud.net/generate';
//                                                   ^^^^^ правильно

async function generateSummary() {
    console.log('🚀 Запуск генерации отчета...');
    
    try {
        // Находим форму
        const form = document.querySelector('form[id="dataForm"]') || 
                    document.querySelector('form');
        
        if (!form) {
            throw new Error('Форма не найдена на странице');
        }
        
        // Собираем данные
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Формируем промпт
        const prompt = `
Сгенерируй подробный отчет о совещании:

Тема: ${data.theme || data.topic || 'Не указана'}
Дата: ${data.date || 'Не указана'}
Место: ${data.location || data.place || 'Не указано'}
Участники: ${data.participants || data.attendees || 'Не указаны'}
Продолжительность: ${data.duration || 'Не указана'}
Ключевые моменты: ${data.keyPoints || data.key_points || 'Не указаны'}
Принятые решения: ${data.decisions || 'Не указаны'}
Поставленные задачи: ${data.tasks || data.assignments || 'Не указаны'}

Создай структурированный отчет с разделами:
1. Введение и цель совещания
2. Основные обсуждаемые вопросы
3. Принятые решения
4. Назначенные задачи и ответственные
5. Сроки выполнения
6. Заключение и следующие шаги
        `;
        
        // Показываем загрузку
        showLoading(true);
        
        // Отправляем запрос
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt.trim(),
                max_tokens: 2000
            })
        });
        
        console.log('📨 Статус ответа:', response.status);
        
        if (!response.ok) {
            throw new Error(`Ошибка API: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📝 Ответ получен:', result);
        
        // Показываем результат
        showResult(result.result || result.text || JSON.stringify(result));
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showError(error.message);
    }
}

// Вспомогательные функции
function showLoading(show) {
    let loader = document.getElementById('loader');
    if (!loader && show) {
        loader = document.createElement('div');
        loader.id = 'loader';
        loader.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                <p style="margin-top: 15px; color: #666;">Идет генерация отчета с помощью AI...</p>
            </div>
        `;
        document.body.appendChild(loader);
    } else if (loader && !show) {
        loader.remove();
    }
}

function showResult(text) {
    const resultDiv = document.getElementById('result') || createResultDiv();
    resultDiv.innerHTML = `
        <div style="background: white; border-radius: 10px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #2c3e50; margin-bottom: 20px;">✨ Сгенерированный отчет</h3>
            <div style="white-space: pre-line; line-height: 1.6; background: #f8f9fa; padding: 20px; border-radius: 5px; max-height: 500px; overflow-y: auto;">
                ${text}
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button onclick="downloadText('${text.replace(/'/g, "\\'").replace(/\n/g, '\\n')}', 'отчет.txt')" 
                        style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    📥 Скачать отчет
                </button>
                <button onclick="copyText('${text.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')" 
                        style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    📋 Копировать текст
                </button>
            </div>
        </div>
    `;
}

function showError(message) {
    const resultDiv = document.getElementById('result') || createResultDiv();
    resultDiv.innerHTML = `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 20px; border-radius: 10px;">
            <h3 style="margin-top: 0;">⚠️ Ошибка генерации</h3>
            <p>${message}</p>
            <p>Попробуйте снова или свяжитесь с поддержкой.</p>
        </div>
    `;
}

function createResultDiv() {
    const div = document.createElement('div');
    div.id = 'result';
    div.style.marginTop = '30px';
    document.body.appendChild(div);
    return div;
}

function downloadText(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyText(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert('Текст скопирован в буфер обмена!'))
        .catch(err => alert('Ошибка копирования: ' + err));
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Находим кнопку генерации
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('генер') || text.includes('generate') || text.includes('отчет')) {
            btn.addEventListener('click', generateSummary);
            console.log('✅ Кнопка найдена и настроена:', btn);
        }
    });
    
    console.log('🌐 API URL:', API_URL);
});

