const BubblesModule = {
    // Массив возможных текстов в зависимости от редкости
    types: {
        common: { text: "popoe", class: "common" },
        rare: { text: "POPOE!!", class: "rare" },
        legendary: { text: "✨MEGA POPOE✨", class: "legendary" }
    },

    create(x, y, rarity = "common") {
        const bubbleData = this.types[rarity] || this.types.common;
        
        const bubble = document.createElement('div');
        bubble.className = `popoe-bubble ${bubbleData.class}`;
        bubble.innerText = bubbleData.text;

        // Позиционируем точно под пальцем
        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;

        // Задаем случайное смещение по горизонтали для анимации (влево или вправо)
        const randomX = (Math.random() * 60 - 30) + "px";
        bubble.style.setProperty('--random-x', randomX);

        document.body.appendChild(bubble);

        // Удаляем элемент из HTML сразу после завершения анимации
        bubble.addEventListener('animationend', () => {
            bubble.remove();
        });
    }
};
