// Массив для хранения загруженных шляп
let shopHats = [];
// Имитируем купленные пользователем шляпы (в будущем это прилетит из БД)
let purchasedHats = ['santa_hat']; 

// Открытие / Закрытие магазина
const modal = document.getElementById('shop-modal');
document.getElementById('shop-open-btn').addEventListener('click', () => modal.classList.remove('hidden'));
document.getElementById('shop-close-btn').addEventListener('click', () => modal.classList.add('hidden'));

// Загрузка шляп из JSON при старте игры
async function loadShopData() {
    try {
        const response = await fetch('data/hats.json');
        const data = await response.json();
        shopHats = data.hats;
        renderShop();
    } catch (error) {
        console.error("Ошибка загрузки конфига шляп:", error);
    }
}

// Автоматическая генерация карточек товаров в HTML
function renderShop() {
    const listContainer = document.getElementById('hats-list');
    listContainer.innerHTML = ''; // Очищаем контейнер

    shopHats.forEach(hat => {
        const isPurchased = purchasedHats.includes(hat.id);
        const isCurrent = activeHat && activeHat.id === hat.id;
        
        let buttonText = `${hat.cost} 🪙`;
        let buttonClass = 'buy-btn';
        if (isCurrent) {
            buttonText = 'Надето';
            buttonClass += ' equipped';
        } else if (isPurchased) {
            buttonText = 'Надеть';
            buttonClass += ' equipped';
        }

        const card = document.createElement('div');
        card.className = 'hat-card';
        card.innerHTML = `
            <img src="${hat.idle_image}" alt="${hat.name}">
            <div class="hat-info">
                <h4>${hat.name}</h4>
                <span class="rarity-${hat.rarity}">${hat.rarity.toUpperCase()}</span>
            </div>
            <button class="${buttonClass}" onclick="handleHatAction('${hat.id}')">${buttonText}</button>
        `;
        listContainer.appendChild(card);
    });
}

// Логика нажатия на кнопку в магазине
async function handleHatAction(hatId) {
    const hat = shopHats.find(h => h.id === hatId);
    
    if (purchasedHats.includes(hatId)) {
        // Если уже куплено — просто надеваем
        equipHat(hat);
    } else {
        // Если еще не куплено — проверяем баланс монет
        if (coins >= hat.cost) {
            coins -= hat.cost;
            document.getElementById('score-display').innerText = coins;
            purchasedHats.push(hatId);
            
            // ==========================================
            // МЕСТО ДЛЯ ВАШЕЙ БАЗЫ ДАННЫХ:
            // Здесь будет код отправки данных на ваш сервер, например:
            // await supabase.from('users').update({ coins: coins, purchased_hats: purchasedHats }).eq('tg_id', userId);
            // ==========================================
            
            equipHat(hat);
        } else {
            alert('Не хватает монет!');
        }
    }
    renderShop(); // Обновляем интерфейс магазина
}

// Запускаем загрузку данных при старте приложения
loadShopData();
