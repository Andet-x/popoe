// Текущее состояние игры
let coins = 0;
let activeHat = null; // Сюда запишется объект шляпы, когда игрок её наденет

const mainImg = document.getElementById('character-main');
const hatImg = document.getElementById('character-hat');
const scoreDisplay = document.getElementById('score-display');
const clickArea = document.getElementById('click-area');
const popAudio = new Audio('assets/popoe.mp3');

popAudio.preload = 'auto';
popAudio.volume = 1.0;

// Имитация функции надевания шляпы (вызывается из вашего будущего GUI магазина)
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
// Вынесли общую логику клика в отдельную функцию
function handlePopAction(clientX, clientY) {
    // Включаем стадию КРИКА
    mainImg.src = "assets/character_pop.png";
    updateHatPosition('pop');

    popAudio.currentTime = 0; // Сбрасываем в начало, чтобы можно было спамить кликами
    popAudio.play().catch(e => console.log("Ждем первого взаимодействия со страницей"));

    // Начисляем монеты
    coins++;
    scoreDisplay.innerText = coins;

    // Считаем редкость клика случайным образом
    let rarity = "common";
    const rand = Math.random() * 100;
    if (rand > 95) rarity = "legendary"; // 5% шанс
    else if (rand > 80) rarity = "rare";  // 15% шанс

    // Вызываем облачко из вашего модуля, передавая координаты клика/тача
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

// Срабатывает в момент нажатия (пальцем или мышкой)
clickArea.addEventListener('pointerdown', (e) => {
    // Блокируем дефолтное поведение (двойной зум на мобилках, выделение картинок на ПК)
    e.preventDefault(); 
    
    // Сбрасываем таймер при новом клике, чтобы персонаж не закрыл рот раньше времени
    if (idleTimeoutId) clearTimeout(idleTimeoutId);

    // Вызываем логику клика и передаем точные координаты указателя
    handlePopAction(e.clientX, e.clientY);
});

// Возвращаем персонажа в стадию покоя, когда палец убрали или отпустили кнопку мыши
// 1. Создаем переменную для хранения ID таймера (выше функций)
let idleTimeoutId = null;

// Функция возврата в обычное состояние
function resetCharacterState() {
    // Удаляем старый таймер, если он уже был запущен
    if (idleTimeoutId) clearTimeout(idleTimeoutId);

    // Запускаем новый таймер заново
    idleTimeoutId = setTimeout(() => {
        mainImg.src = "assets/character_idle.png";
        updateHatPosition('idle');
    }, 270); // Задержка в xx мс
}

clickArea.addEventListener('pointerup', resetCharacterState);

// Дополнительно: возвращаем в покой, если мышка/палец ушли за пределы кликабельной зоны, не отжимаясь
clickArea.addEventListener('pointerleave', resetCharacterState);

// Возвращаем персонажа в стадию покоя, когда палец убрали
clickArea.addEventListener('touchend', () => {
    mainImg.src = "assets/character_idle.png";
    updateHatPosition('idle');
});