(() => {
    const CUSTOM_KEY = 'cleanly_products_custom';
    const DELETED_KEY = 'cleanly_deleted_products';
    const ORDERS_KEY = 'cleanly_orders';

    const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } };
    const saveJSON = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    const checkAccess = () => {
        const user = loadJSON('cleanly_current_user', null);
        const denied = document.getElementById('adminAccessDenied');
        const panel = document.getElementById('adminPanel');
        if (user?.role === 'admin') {
            denied?.classList.add('hidden');
            panel?.classList.remove('hidden');
            return true;
        }
        denied?.classList.remove('hidden');
        panel?.classList.add('hidden');
        return false;
    };

    const initTabs = () => {
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
                const target = document.getElementById('tab' + capitalize(tab.dataset.tab));
                target?.classList.remove('hidden');
            });
        });
    };

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    const showToast = (msg) => {
        document.querySelector('.admin-toast')?.remove();
        const el = document.createElement('div');
        el.className = 'admin-toast';
        el.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('visible'));
        setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 400); }, 2500);
    };

    const getAllProducts = () => window.PRODUCTS || [];

    const renderProductsTable = () => {
        const body = document.getElementById('adminProductsBody');
        const countEl = document.getElementById('adminProductCount');
        const searchVal = (document.getElementById('adminProductSearch')?.value || '').toLowerCase();
        if (!body) return;

        const products = getAllProducts().filter(p => {
            if (!searchVal) return true;
            return p.title.toLowerCase().includes(searchVal) || (p.brand || '').toLowerCase().includes(searchVal);
        });

        countEl.textContent = `${products.length} товаров`;

        if (!products.length) {
            body.innerHTML = `<tr><td colspan="6" class="admin-empty-state"><i class="fa-solid fa-box-open"></i>Товары не найдены</td></tr>`;
            return;
        }

        body.innerHTML = products.map(p => `
            <tr>
                <td><strong>${p.id}</strong></td>
                <td>${p.title}</td>
                <td>${p.label || '—'}</td>
                <td>${p.price} ₽</td>
                <td>${p.brand || '—'}</td>
                <td><button class="admin-delete-btn" data-delete-id="${p.id}"><i class="fa-solid fa-trash"></i> Удалить</button></td>
            </tr>`).join('');
    };

    const handleDelete = (id) => {
        const deleted = loadJSON(DELETED_KEY, []);
        if (!deleted.includes(id)) {
            deleted.push(id);
            saveJSON(DELETED_KEY, deleted);
        }
        const custom = loadJSON(CUSTOM_KEY, []);
        saveJSON(CUSTOM_KEY, custom.filter(p => p.id !== id));
        window.PRODUCTS = (window.PRODUCTS || []).filter(p => p.id !== id);
        renderProductsTable();
        showToast('Товар удалён');
    };

    const initProductsTab = () => {
        document.getElementById('adminProductSearch')?.addEventListener('input', renderProductsTable);
        document.getElementById('adminProductsBody')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-delete-id]');
            if (btn) handleDelete(Number(btn.dataset.deleteId));
        });
        renderProductsTable();
    };

    const initAddTab = () => {
        const form = document.getElementById('addProductForm');
        if (!form) return;

        const titleEl = form.querySelector('[name="title"]');
        const descEl = form.querySelector('[name="desc"]');
        const priceEl = form.querySelector('[name="price"]');
        const labelEl = form.querySelector('[name="label"]');
        const imageEl = form.querySelector('[name="image"]');

        const updatePreview = () => {
            const pTitle = document.getElementById('previewTitle');
            const pPrice = document.getElementById('previewPrice');
            const pLabel = document.getElementById('previewLabel');
            const pImg = document.getElementById('previewImg');
            if (pTitle) pTitle.textContent = titleEl.value || 'Название товара';
            if (pPrice) pPrice.textContent = (priceEl.value || '0') + ' ₽';
            if (pLabel) pLabel.textContent = labelEl.value;
            if (pImg) pImg.src = imageEl.value || window.PLACEHOLDER_IMAGE;
        };

        [titleEl, priceEl, labelEl, imageEl].forEach(el => el?.addEventListener('input', updatePreview));
        updatePreview();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const allProducts = getAllProducts();
            const maxId = allProducts.length ? Math.max(...allProducts.map(p => p.id)) : 0;
            const labelColorMap = { 'Чистящие средства': 'default', 'Кухонные принадлежности': 'blue', 'Стирка и уход за бельём': 'gray', 'Товары для дома': 'default' };

            const product = {
                id: maxId + 1,
                title: fd.get('title'),
                desc: fd.get('desc'),
                price: Number(fd.get('price')),
                label: fd.get('label'),
                labelColor: labelColorMap[fd.get('label')] || 'default',
                brand: fd.get('brand') || '',
                image: fd.get('image') || window.PLACEHOLDER_IMAGE,
                rating: Number(fd.get('rating')) || 4.5,
                reviews: 0
            };

            const custom = loadJSON(CUSTOM_KEY, []);
            custom.push(product);
            saveJSON(CUSTOM_KEY, custom);
            window.PRODUCTS.push(product);

            form.reset();
            updatePreview();
            renderProductsTable();
            showToast(`Товар #${product.id} «${product.title}» добавлен`);
        });
    };

    const renderOrders = () => {
        const container = document.getElementById('adminOrdersList');
        const countEl = document.getElementById('adminOrderCount');
        if (!container) return;

        const orders = loadJSON(ORDERS_KEY, []).sort((a, b) => b.id - a.id);
        if (countEl) countEl.textContent = `${orders.length} заказов`;

        if (!orders.length) {
            container.innerHTML = `<div class="admin-empty-state"><i class="fa-solid fa-receipt"></i><p>Заказов пока нет</p></div>`;
            return;
        }

        container.innerHTML = orders.map(o => {
            const date = new Date(o.date);
            const dateStr = date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const itemsHtml = (o.items || []).map(i => `<tr><td>${i.title}</td><td>${i.quantity} шт.</td><td>${i.price * i.quantity} ₽</td></tr>`).join('');
            return `
                <div class="admin-order-card" data-order-id="${o.id}">
                    <div class="admin-order-header">
                        <span class="order-id">#${o.id}</span>
                        <span class="order-date">${dateStr}</span>
                        <span class="order-email"><i class="fa-solid fa-user"></i> ${o.userName || 'Гость'} (${o.email})</span>
                        <span class="order-total">${o.total} ₽</span>
                        <i class="fa-solid fa-chevron-down order-chevron"></i>
                    </div>
                    <div class="admin-order-details">
                        <table class="order-items-table">
                            <thead><tr><th>Товар</th><th>Кол-во</th><th>Сумма</th></tr></thead>
                            <tbody>${itemsHtml}</tbody>
                        </table>
                    </div>
                </div>`;
        }).join('');
    };

    const initOrdersTab = () => {
        document.getElementById('adminOrdersList')?.addEventListener('click', (e) => {
            const header = e.target.closest('.admin-order-header');
            if (header) header.closest('.admin-order-card')?.classList.toggle('open');
        });
        renderOrders();
    };

    const initBurger = () => {
        const burger = document.querySelector('.burger-menu');
        const mobile = document.querySelector('.mobile-menu');
        if (!burger || !mobile) return;
        burger.addEventListener('click', () => { mobile.classList.toggle('active'); burger.classList.toggle('active'); });
        document.addEventListener('click', (e) => {
            if (!burger.contains(e.target) && !mobile.contains(e.target)) {
                mobile.classList.remove('active');
                burger.classList.remove('active');
            }
        });
    };

    const init = async () => {
        initBurger();
        if (window.productsReady) await window.productsReady;
        if (!checkAccess()) {
            const observer = new MutationObserver(() => {
                if (checkAccess()) { observer.disconnect(); initPanel(); }
            });
            observer.observe(document.body, { childList: true, subtree: true, attributes: true });
            window.addEventListener('storage', () => { if (checkAccess()) initPanel(); });
            return;
        }
        initPanel();
    };

    const initPanel = () => {
        initTabs();
        initProductsTab();
        initAddTab();
        initOrdersTab();
    };

    document.addEventListener('DOMContentLoaded', init);
})();
