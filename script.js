const button = document.getElementById('action-btn');
const image = document.getElementById('target-img');

// Пути к вашим файлам
const img1 = 'media/pic1.png';
const img2 = 'media/pic2.png';

// Создаем объект аудио один раз при загрузке страницы
const audio = new Audio('media/sound.mp3');

// Обработчик нажатия на кнопку
button.addEventListener('click', () => {
    // Прерываем прошлый звук и сбрасываем его в начало
    audio.pause();
    audio.currentTime = 0; 
    
    // Включаем вторую картинку при старте звука
    image.setAttribute('src', img2);
    
    // Воспроизводим звук заново (мгновенно и без наложения)
    audio.play();
});

// Автоматический возврат картинки, когда звук полностью закончился
audio.addEventListener('ended', () => {
    image.setAttribute('src', img1);
});
