(() => {
    const CART_STORAGE_KEY = 'cleanly_cart';
    const ORDERS_KEY = 'cleanly_orders';
    const formatPrice = (price) => `${price} ₽`;
    const products = () => window.PRODUCTS || [];

    let cart = [];

    const elements = {
        overlay: null, drawer: null, items: null, total: null,
        openButtons: [], closeButton: null, clearButton: null,
        checkoutButton: null, emailInput: null, badges: []
    };

    const ensureElements = () => {
        elements.overlay = document.getElementById('cartOverlay');
        elements.drawer = document.getElementById('cartDrawer');
        elements.items = document.getElementById('cartItems');
        elements.total = document.getElementById('cartTotal');
        elements.closeButton = document.getElementById('cartClose');
        elements.clearButton = document.getElementById('cartClear');
        elements.checkoutButton = document.getElementById('cartCheckout');
        elements.emailInput = document.getElementById('cartEmail');
        elements.openButtons = Array.from(document.querySelectorAll('.cart-open-btn'));
        elements.badges = Array.from(document.querySelectorAll('[data-cart-count]'));
    };

    const loadCart = () => {
        try { const s = localStorage.getItem(CART_STORAGE_KEY); return s ? JSON.parse(s) : []; }
        catch (e) { return []; }
    };

    const saveCart = () => localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    const findProduct = (id) => products().find((p) => p.id === id);

    const normalizeItem = (item) => {
        const fb = findProduct(item.id);
        return { id: item.id, title: item.title || fb?.title || 'Товар', desc: item.desc || fb?.desc || '', price: item.price ?? fb?.price ?? 0, quantity: item.quantity || 1 };
    };

    const getCartCount = () => cart.reduce((s, i) => s + i.quantity, 0);

    const updateCartBadge = () => {
        const count = getCartCount();
        elements.badges.forEach((b) => { b.textContent = count; b.classList.toggle('hidden', count === 0); });
    };

    const calculateTotal = () => cart.reduce((t, i) => t + i.price * i.quantity, 0);

    const renderCart = () => {
        if (!elements.items || !elements.total) return;
        if (!cart.length) {
            elements.items.innerHTML = `<div class="cart-empty"><i class="fa-regular fa-face-smile-beam"></i><p>Корзина пуста</p><span>Добавьте товары из каталога</span></div>`;
            elements.total.textContent = formatPrice(0);
            updateCartBadge();
            return;
        }
        elements.items.innerHTML = cart.map((item) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <p class="cart-item-title">${item.title}</p>
                    <p class="cart-item-desc">${item.desc}</p>
                    <div class="cart-item-meta">
                        <span class="cart-item-price">${formatPrice(item.price)}</span>
                        <span class="cart-item-subtotal">${formatPrice(item.price * item.quantity)}</span>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-btn" data-action="remove" data-id="${item.id}"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            </div>`).join('');
        elements.total.textContent = formatPrice(calculateTotal());
        updateCartBadge();
    };

    const openCart = () => { elements.overlay?.classList.add('active'); elements.drawer?.classList.add('active'); document.body.classList.add('cart-locked'); };
    const closeCart = () => { elements.overlay?.classList.remove('active'); elements.drawer?.classList.remove('active'); document.body.classList.remove('cart-locked'); };

    const showAddedToast = (title) => {
        document.querySelector('.cart-added-toast')?.remove();
        const el = document.createElement('div');
        el.className = 'cart-added-toast';
        el.innerHTML = `<i class="fa-solid fa-circle-check"></i> «${title}» добавлен в корзину`;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('visible'));
        setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 400); }, 2500);
    };

    const addToCart = (product) => {
        if (!product || product.id == null) return;
        const normalized = normalizeItem(product);
        const existing = cart.find((i) => i.id === normalized.id);
        if (existing) existing.quantity += 1;
        else cart.push(normalized);
        saveCart(); renderCart();
        showAddedToast(normalized.title);
    };

    const changeQuantity = (pid, delta) => {
        cart = cart.map((i) => i.id === pid ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i).filter((i) => i.quantity > 0);
        saveCart(); renderCart();
    };

    const removeFromCart = (pid) => { cart = cart.filter((i) => i.id !== pid); saveCart(); renderCart(); };
    const clearCart = () => { cart = []; saveCart(); renderCart(); };

    const loadOrders = () => {
        try { const s = localStorage.getItem(ORDERS_KEY); return s ? JSON.parse(s) : []; }
        catch (e) { return []; }
    };

    const saveOrder = () => {
        if (!cart.length) return;
        const email = elements.emailInput?.value?.trim() || '';
        const currentUser = window.auth?.currentUser?.() || null;
        const orders = loadOrders();
        const order = {
            id: orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1,
            date: new Date().toISOString(),
            email: email || currentUser?.email || 'Не указан',
            userName: currentUser?.name || 'Гость',
            items: cart.map(i => ({ id: i.id, title: i.title, price: i.price, quantity: i.quantity })),
            total: calculateTotal()
        };
        orders.push(order);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        clearCart();
        closeCart();
        showCheckoutNotification(order.id);
    };

    const showCheckoutNotification = (orderId) => {
        const existing = document.querySelector('.checkout-notification');
        if (existing) existing.remove();
        const el = document.createElement('div');
        el.className = 'checkout-notification';
        el.innerHTML = `<i class="fa-solid fa-circle-check"></i> Заказ #${orderId} оформлен!`;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('visible'));
        setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 400); }, 3000);
    };

    const bindEvents = () => {
        elements.openButtons.forEach((b) => b.addEventListener('click', openCart));
        elements.closeButton?.addEventListener('click', closeCart);
        elements.overlay?.addEventListener('click', closeCart);
        elements.items?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const pid = Number(btn.dataset.id);
            if (btn.dataset.action === 'increase') changeQuantity(pid, 1);
            if (btn.dataset.action === 'decrease') changeQuantity(pid, -1);
            if (btn.dataset.action === 'remove') removeFromCart(pid);
        });
        elements.clearButton?.addEventListener('click', clearCart);
        elements.checkoutButton?.addEventListener('click', saveOrder);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });
    };

    const initCart = () => { ensureElements(); cart = loadCart().map(normalizeItem); renderCart(); bindEvents(); };
    document.addEventListener('DOMContentLoaded', initCart);
    window.cart = { add: addToCart, open: openCart, close: closeCart, render: renderCart };
})();
