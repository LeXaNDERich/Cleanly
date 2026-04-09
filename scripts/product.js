(() => {
    const formatPrice = (price) => `${price} ₽`;
    const burgerMenu = document.querySelector('.burger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');

    const initNavbarToggle = () => {
        if (!burgerMenu || !mobileMenu) return;
        burgerMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            burgerMenu.classList.toggle('active');
        });
        document.addEventListener('click', (event) => {
            if (!burgerMenu.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.remove('active');
                burgerMenu.classList.remove('active');
            }
        });
    };

    const renderNotFound = () => {
        const container = document.getElementById('productContainer');
        if (!container) return;
        container.innerHTML = `
            <div class="product-empty">
                <p>Товар не найден</p>
                <a class="product-link" href="../pages/catalog.html">Вернуться в каталог</a>
            </div>
        `;
    };

    const renderProduct = (product) => {
        const container = document.getElementById('productContainer');
        if (!container) return;
        container.innerHTML = `
            <div class="product-card-full">
                <div class="product-full-header">
                    <div>
                        <p class="product-full-label">${product.label}</p>
                        <h1 class="product-full-title">${product.title}</h1>
                        <p class="product-full-desc">${product.desc}</p>
                        <div class="product-full-meta">
                            ${product.brand ? `<span class="product-full-seller">Бренд: ${product.brand}</span>` : ''}
                            <span class="product-full-rating"><i class="fa-solid fa-star"></i> ${product.rating.toFixed(1)} (${product.reviews})</span>
                        </div>
                    </div>
                    <div class="product-full-price">${formatPrice(product.price)}</div>
                </div>
                <div class="product-full-actions">
                    <button id="productBuy" class="product-full-buy">Купить</button>
                    <a class="product-link" href="../pages/catalog.html">Вернуться в каталог</a>
                </div>
            </div>
        `;
        document.getElementById('productBuy')?.addEventListener('click', () => {
            window.cart?.add({
                id: product.id,
                title: product.title,
                desc: product.desc,
                price: product.price
            });
        });
    };

    document.addEventListener('DOMContentLoaded', async () => {
        initNavbarToggle();
        await window.productsReady;
        const params = new URLSearchParams(window.location.search);
        const id = Number(params.get('id'));
        const product = (window.PRODUCTS || []).find((p) => p.id === id);
        if (!product) {
            renderNotFound();
            return;
        }
        renderProduct(product);
    });
})();

