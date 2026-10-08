// Текущее состояние игры
let coins = 0; // Теперь это счетчик текущей сессии
let activeHat = null; // Сюда запишется объект шляпы, когда игрок её наденет

// Переменная для накопления кликов перед отправкой на сервер (чтобы не спамить запросами каждую миллисекунду)
let pendingClicks = 0; 

const mainImg = document.getElementById('character-main');
const hatImg = document.getElementById('character-hat');
const scoreDisplay = document.getElementById('score-display');
const globalScoreDisplay = document.getElementById('global-score-display'); // НОВЫЙ элемент
const clickArea = document.getElementById('click-area');
const popAudio = new Audio('assets/popoe.mp3');

popAudio.preload = 'auto';
popAudio.volume = 1.0;

// === НОВАЯ ФУНКЦИЯ: Загрузка глобальных кликов с сервера при старте игры ===
async function fetchGlobalClicks() {
    try {
        const response = await fetch('/api/clicks');
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
        
        const data = await response.json();
        if (globalScoreDisplay && data.clicks !== undefined) {
            globalScoreDisplay.innerText = data.clicks;
        }
    } catch (error) {
        console.error("Ошибка получения глобальных кликов:", error);
        // Выводим статус ошибки на экран вместо нуля
        if (globalScoreDisplay) {
            globalScoreDisplay.innerText = "Ошибка 📡";
            globalScoreDisplay.style.color = "#ff4757"; // Красный цвет для ошибки
        }
    }
}
// Запускаем получение данных сразу при инициализации скрипта
fetchGlobalClicks();

// === НОВАЯ ФУНКЦИЯ: Отправка накопленных кликов в базу данных ===
async function sendClicksToServer() {
    if (pendingClicks <= 0) return;

    const clicksToSend = pendingClicks;
    pendingClicks = 0; 

    try {
        const response = await fetch('/api/clicks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: clicksToSend })
        });
        
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

        const data = await response.json();
        if (globalScoreDisplay && data.clicks !== undefined) {
            globalScoreDisplay.innerText = data.clicks;
            globalScoreDisplay.style.color = "#ffcc00"; // Возвращаем золотой цвет при успехе
        }
    } catch (error) {
        console.error("Ошибка отправки кликов на сервер:", error);
        pendingClicks += clicksToSend; 
        
        if (globalScoreDisplay) {
            globalScoreDisplay.innerText = "Офлайн 🚫";
            globalScoreDisplay.style.color = "#ff4757";
        }
    }
}

// Отправляем данные каждые 3 секунды (оптимально для баз данных, чтобы не ломать сервер)
setInterval(sendClicksToServer, 3000);

// Отправляем клики также при закрытии или обновлении страницы пользователем
window.addEventListener('beforeunload', sendClicksToServer);


// Имитация функции надевания шляпы
function equipHat(hatObject) {
    activeHat = hatObject;
    if (!activeHat) {
        hatImg.style.display = 'none';
        return;
    }
    hatImg.src = activeHat.idle_image;
    hatImg.style.display = 'block';
    updateHatPosition('idle');
}

// Корректировка положения шляпы относительно головы
function updateHatPosition(state) {
    if (!activeHat) return;

    if (state === 'pop') {
        hatImg.src = activeHat.pop_image;
        hatImg.style.top = `${activeHat.offset_y_pop}px`;
    } else {
        hatImg.src = activeHat.idle_image;
        hatImg.style.top = `${activeHat.offset_y_idle}px`;
    }
    hatImg.style.left = `calc(50% + ${activeHat.offset_x}px)`;
}

// Обработка клика
function handlePopAction(clientX, clientY) {
    // Включаем стадию КРИКА
    mainImg.src = "assets/character_pop.png";
    updateHatPosition('pop');

    popAudio.currentTime = 0; 
    popAudio.play().catch(e => console.log("Ждем первого взаимодействия со страницей"));

    // 1. Начисляем монеты за ТЕКУЩУЮ СЕССИЮ (Новый код)
    coins++;
    scoreDisplay.innerText = coins;

    // 2. Добавляем клик в буфер для отправки на СЕРВЕР (Старая логика)
    pendingClicks++;

    // Считаем редкость клика случайным образом
    let rarity = "common";
    const rand = Math.random() * 100;
    if (rand > 95) rarity = "legendary"; 
    else if (rand > 80) rarity = "rare";  

    // Вызываем облачко
    if (typeof BubblesModule !== 'undefined' && BubblesModule.create) {
        BubblesModule.create(clientX, clientY, rarity);
    } else {
        console.error("BubblesModule не найден. Проверьте подключение скрипта баблов.");
    }

    // Telegram Вибрация
    if (window.Telegram && window.Telegram.WebApp) {
        const haptic = window.Telegram.WebApp.HapticFeedback;
        if (rarity === "legendary") haptic.notificationOccurred('success');
        else if (rarity === "rare") haptic.impactOccurred('medium');
        else haptic.impactOccurred('light');
    }
}

// === БЛОКИРОВКА СИСТЕМНОГО ПОВЕДЕНИЯ (Контекстное меню и перетаскивание) ===
// Запрещаем вызов контекстного меню (скачивание картинок) на всей игровой области
clickArea.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Отдельно запрещаем контекстное меню для самих изображений (критично для iOS/Android)
mainImg.addEventListener('contextmenu', (e) => e.preventDefault());
hatImg.addEventListener('contextmenu', (e) => e.preventDefault());

// Запрещаем стандартное перетаскивание картинок браузером (убирает «залипание» на ПК)
mainImg.addEventListener('dragstart', (e) => e.preventDefault());
hatImg.addEventListener('dragstart', (e) => e.preventDefault());


// === ОБРАБОТЧИКИ КЛИКОВ И АНИМАЦИИ ===
// Срабатывает в момент нажатия
clickArea.addEventListener('pointerdown', (e) => {
    e.preventDefault(); 
    if (idleTimeoutId) clearTimeout(idleTimeoutId);
    handlePopAction(e.clientX, e.clientY);
});

let idleTimeoutId = null;

// Функция возврата в обычное состояние
function resetCharacterState() {
    if (idleTimeoutId) clearTimeout(idleTimeoutId);

    idleTimeoutId = setTimeout(() => {
        mainImg.src = "assets/character_idle.png";
        updateHatPosition('idle');
    }, 270); 
}

// pointerup и pointerleave отлично работают на ПК и смартфонах, если отключено контекстное меню
clickArea.addEventListener('pointerup', resetCharacterState);
clickArea.addEventListener('pointerleave', resetCharacterState);

// touchend оставляем для подстраховки мобильных устройств
clickArea.addEventListener('touchend', (e) => {
    e.preventDefault(); // Предотвращает ложные двойные «тапы» и зум
    mainImg.src = "assets/character_idle.png";
    updateHatPosition('idle');
});

