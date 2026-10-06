const button = document.getElementById('action-btn');
const image = document.getElementById('target-img');

// Пути к вашим файлам
const img1 = 'media/pic1.png';
const img2 = 'media/pic2.png';

// Создаем объект аудио один раз при загрузке страницы
const audio = new Audio('media/sound.mp3');

// Переменные для счетчика кликов
let localClicksToSend = 0; 
let globalClicksCount = 0; 

// Находим элемент счетчика в HTML
const globalCounterElement = document.getElementById('global-counter');

// Функция синхронизации с сервером
async function syncClicks() {
    try {
        // Используем относительный путь window.location.origin, чтобы точно попасть на бэкенд через домен
        const response = await fetch(`${window.location.origin}/api/clicks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: localClicksToSend })
        });
        
        // Сбрасываем только те клики, которые успешно отправили
        localClicksToSend = 0; 

        const data = await response.json();
        globalClicksCount = data.clicks;
        
        // Выводим цифру на экран
        if (globalCounterElement) {
            globalCounterElement.innerText = globalClicksCount.toLocaleString(); 
        }
        
    } catch (error) {
        console.error("Ошибка синхронизации с сервером:", error);
        if (globalCounterElement) {
            globalCounterElement.innerText = "Ошибка соединения";
        }
    }
}

// ОБЪЕДИНЕННЫЙ Обработчик нажатия на кнопку
button.addEventListener('click', () => {
    // 0. Анимация уменьшения картинки при клике (на 100 миллисекунд)
    image.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1)' }], { duration: 100 });
    
    // 1. Логика счетчика (копим клик для сервера)
    localClicksToSend++; 

    // 2. Ваша логика звука и картинок
    audio.pause();
    audio.currentTime = 0; 
    image.setAttribute('src', img2);
    audio.play();
});

// Автоматический возврат картинки, когда звук полностью закончился
audio.addEventListener('ended', () => {
    image.setAttribute('src', img1);
});

// Регистрируем интервал обновления (раз в 2 секунды)
setInterval(syncClicks, 2000);

// Вызываем сразу при старте страницы, чтобы убрать надпись "Загрузка..."
syncClicks();
