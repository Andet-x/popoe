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
clickArea.addEventListener('touchstart', (e) => {
    // Блокируем дефолтное поведение браузера (двойной зум)
    e.preventDefault(); 
    
    // Получаем координаты касания (берем первый палец)
    const touch = e.touches[0];
    
    // Включаем стадию КРИКА
    mainImg.src = "assets/character_pop.png";
    updateHatPosition('pop');

    popAudio.currentTime = 0; // Сбрасываем в начало, чтобы можно было спамить кликами
    popAudio.play().catch(e => console.log("Ждем первого взаимодействия со страницей"));

    // Начисляем монеты
    coins++;
    scoreDisplay.innerText = coins;

    // Считаем редкость клика случайным образом (для демонстрации)
    let rarity = "common";
    const rand = Math.random() * 100;
    if (rand > 95) rarity = "legendary"; // 5% шанс
    else if (rand > 80) rarity = "rare";  // 15% шанс

    // Вызываем облачко из нашего модуля
    BubblesModule.create(touch.clientX, touch.clientY, rarity);

    // Telegram Вибрация
    if (window.Telegram && window.Telegram.WebApp) {
        const haptic = window.Telegram.WebApp.HapticFeedback;
        if (rarity === "legendary") haptic.notificationOccurred('success');
        else if (rarity === "rare") haptic.impactOccurred('medium');
        else haptic.impactOccurred('light');
    }
});

// Возвращаем персонажа в стадию покоя, когда палец убрали
clickArea.addEventListener('touchend', () => {
    mainImg.src = "assets/character_idle.png";
    updateHatPosition('idle');
});
