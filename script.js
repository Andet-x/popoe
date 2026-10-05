const image = document.getElementById('target-img');
const status = document.getElementById('playback-status');
const count = document.getElementById('global-count');
const counterStatus = document.getElementById('counter-status');
const counterEndpoint = '/.netlify/functions/counter';
const countFormatter = new Intl.NumberFormat('ru-RU');
let framesReady = false;
let currentCount = null;
let refreshing = false;
let counterReady = false;
let clickTimes = [];
let limitedUntil = 0;
let limitTimer;
const clickLimit = 50;
const clickWindow = 120000;
const firstFrame = 'pic1.png';
const secondFrame = 'pic2.png';
const audio = new Audio('sound.mp3');
const limitAudio = new Audio('m-e-o-w.mp3');
const rareAudio = new Audio('verity-edit.mp3');
const limitFrame = 'image.png';
const rareFrame = 'brr.jpg';
let activeAudio = audio;
const framePreload = new Image();

audio.preload = 'auto';
limitAudio.preload = 'auto';
rareAudio.preload = 'auto';

function restoreFirstFrame() {
    if (limitedUntil > Date.now()) return;
    image.src = firstFrame;
    image.alt = 'Первый кадр анимации';
}

function showPlaybackError() {
    if (limitedUntil > Date.now()) return;
    activeAudio.pause();
    restoreFirstFrame();
    status.textContent = 'Не удалось воспроизвести звук. Попробуйте нажать ещё раз.';
}

function showClickLimit(retryAfter) {
    const alreadyLimited = limitedUntil > Date.now();
    limitedUntil = Math.max(limitedUntil, Date.now() + retryAfter * 1000);
    audio.pause();
    rareAudio.pause();
    image.src = limitFrame;
    image.alt = 'Альтернативная картинка';
    status.textContent = '';
    if (!alreadyLimited) {
        limitAudio.currentTime = 0;
        limitAudio.play().catch(() => limitAudio.pause());
    }
    window.clearTimeout(limitTimer);
    limitTimer = window.setTimeout(() => {
        limitedUntil = 0;
        limitAudio.pause();
        limitAudio.currentTime = 0;
        restoreFirstFrame();
        status.textContent = '';
    }, Math.max(0, limitedUntil - Date.now()));
}

framePreload.addEventListener('load', () => {
    framesReady = true;
    image.setAttribute('aria-disabled', 'false');
    status.textContent = '';
});

framePreload.addEventListener('error', () => {
    status.textContent = 'Не удалось загрузить второй кадр. Обновите страницу.';
});

framePreload.src = secondFrame;

function activateImage() {
    if (!framesReady) return;
    if (!counterReady) {
        status.textContent = 'Подключаем счётчик. Подожди немного.';
        return;
    }

    const now = Date.now();
    if (limitedUntil > now) return;
    clickTimes = clickTimes.filter((clickTime) => clickTime > now - clickWindow);
    if (clickTimes.length >= clickLimit) {
        showClickLimit((clickTimes[0] + clickWindow - now) / 1000);
        return;
    }
    clickTimes.push(now);
    limitAudio.pause();

    audio.pause();
    rareAudio.pause();
    activeAudio = Math.random() < 1 / 500 ? rareAudio : audio;
    activeAudio.currentTime = 0;
    status.textContent = '';
    const playingAudio = activeAudio;
    playingAudio.play().catch((error) => {
        if (activeAudio === playingAudio && error.name !== 'AbortError') {
            showPlaybackError();
        }
    });
    incrementCounter();
}

image.addEventListener('click', activateImage);
image.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!event.repeat) activateImage();
});

for (const playbackAudio of [audio, rareAudio]) {
    playbackAudio.addEventListener('playing', () => {
        if (limitedUntil > Date.now() || activeAudio !== playbackAudio) {
            playbackAudio.pause();
            return;
        }
        image.src = playbackAudio === rareAudio ? rareFrame : secondFrame;
        image.alt = playbackAudio === rareAudio ? 'Редкая картинка' : 'Второй кадр анимации';
    });

    playbackAudio.addEventListener('ended', () => {
        if (activeAudio === playbackAudio) restoreFirstFrame();
    });
    playbackAudio.addEventListener('error', () => {
        if (activeAudio === playbackAudio) showPlaybackError();
    });
}

async function requestCounter(method) {
    const response = await fetch(counterEndpoint, {
        method,
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
        keepalive: method === 'POST',
    });

    if (method === 'POST' && response.status === 429) {
        const data = await response.json();
        const retryAfter = Number(data.retryAfter);
        showClickLimit(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 120);
        return;
    }

    if (!response.ok) throw new Error('Counter unavailable');

    const data = await response.json();
    if (typeof data.total !== 'string' || !/^\d+$/.test(data.total)) {
        throw new Error('Invalid counter response');
    }

    const total = BigInt(data.total);
    if (currentCount === null || total > currentCount) {
        currentCount = total;
        count.textContent = countFormatter.format(total);
    }
}

async function refreshCounter() {
    if (refreshing || document.hidden) return;
    refreshing = true;

    try {
        await requestCounter('GET');
        counterReady = true;
        if (counterStatus.dataset.clickError !== 'true') {
            counterStatus.textContent = '';
        }
    } catch {
        if (counterStatus.dataset.clickError !== 'true') {
            counterStatus.textContent = 'Нет связи со счётчиком. Переподключаемся…';
        }
    } finally {
        refreshing = false;
    }
}

async function incrementCounter() {
    try {
        await requestCounter('POST');
    } catch {
        counterStatus.dataset.clickError = 'true';
        counterStatus.textContent = 'Не удалось подтвердить нажатие. Проверяем общий счётчик…';
        window.setTimeout(() => {
            delete counterStatus.dataset.clickError;
            refreshCounter();
        }, 5000);
    }
}

refreshCounter();
window.setInterval(refreshCounter, 1000);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshCounter();
});
window.addEventListener('online', refreshCounter);
