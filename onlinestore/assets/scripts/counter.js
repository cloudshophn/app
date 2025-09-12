import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBJi-ve8Z1v6IGaa-4F0135AIAabdISPx8",
    authDomain: "sajsajndhbshaihbaksjsdnsjahius.firebaseapp.com",
    databaseURL: "https://sajsajndhbshaihbaksjsdnsjahius-default-rtdb.firebaseio.com",
    projectId: "sajsajndhbshaihbaksjsdnsjahius",
    storageBucket: "sajsajndhbshaihbaksjsdnsjahius.firebasestorage.app",
    messagingSenderId: "923009709693",
    appId: "1:923009709693:web:abde872e5878909b556314",
    measurementId: "G-NG78JB2DLE"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const offersRef = ref(db, 'offersByUser');

document.addEventListener('DOMContentLoaded', () => {
    console.log('counter.js cargado a las', new Date().toLocaleString('es-ES', { timeZone: 'America/Chicago' }));

    // Botones de ofertas
    const offerButtons = {
        desktop: document.getElementById('openOffersModal'),
        mobile: document.getElementById('openOffersModalMobile')
    };

    // Botones de carrito
    const cartButtons = {
        desktop: document.getElementById('openCartModal'),
        mobile: document.getElementById('openCartModalMobile')
    };

    // Verificar botones
    console.log('Botones de ofertas:', offerButtons);
    console.log('Botones de carrito:', cartButtons);

    // Añadir contadores a los botones de ofertas
    function updateOfferCount(count) {
        Object.values(offerButtons).forEach(button => {
            if (button) {
                let countElement = button.querySelector('.offer-count');
                if (!countElement) {
                    countElement = document.createElement('span');
                    countElement.className = 'offer-count';
                    button.style.position = 'relative';
                    button.appendChild(countElement);
                }
                countElement.textContent = count;
                console.log(`Contador de ofertas actualizado en ${button.id}: ${count}`);
            } else {
                console.error(`Botón ${button?.id} no encontrado`);
            }
        });
        // Guardar conteo en localStorage
        localStorage.setItem('activeOffersCount', count);
    }

    // Añadir contadores a los botones de carrito
    function updateCartCount(count) {
        Object.values(cartButtons).forEach(button => {
            if (button) {
                let countElement = button.querySelector('.cart-count');
                if (!countElement) {
                    countElement = document.createElement('span');
                    countElement.className = 'cart-count';
                    button.style.position = 'relative';
                    button.appendChild(countElement);
                }
                countElement.textContent = count;
                console.log(`Contador de carrito actualizado en ${button.id}: ${count}`);
            } else {
                console.error(`Botón ${button?.id} no encontrado`);
            }
        });
        // Guardar conteo en localStorage
        localStorage.setItem('cartItemsCount', count);
    }

    // Obtener conteo inicial de ofertas desde localStorage
    let activeOffersCount = parseInt(localStorage.getItem('activeOffersCount')) || 0;
    updateOfferCount(activeOffersCount);

    // Obtener conteo inicial de ítems del carrito desde localStorage
    let cartItemsCount = parseInt(localStorage.getItem('cartItemsCount')) || 0;
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    let calculatedCartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (calculatedCartCount !== cartItemsCount) {
        cartItemsCount = calculatedCartCount;
        updateCartCount(cartItemsCount);
    } else {
        updateCartCount(cartItemsCount);
    }

    // Escuchar cambios en el nodo offersByUser en tiempo real
    onValue(offersRef, (snapshot) => {
        console.log('Cambio detectado en offersByUser');
        let activeOffers = 0;

        if (snapshot.exists()) {
            const offersData = snapshot.val();
            for (const userUID in offersData) {
                const userOffers = offersData[userUID];
                for (const offerId in userOffers) {
                    const offer = userOffers[offerId];
                    if (offer.status === 'active' && new Date(offer.endDateTime) > new Date()) {
                        activeOffers++;
                    }
                }
            }
        }

        // Actualizar solo si el conteo cambió
        if (activeOffers !== activeOffersCount) {
            activeOffersCount = activeOffers;
            updateOfferCount(activeOffersCount);
            console.log('Ofertas activas totales:', activeOffersCount);
        } else {
            console.log('No hay cambios en el conteo de ofertas:', activeOffersCount);
        }
    }, (error) => {
        console.error('Error al escuchar cambios en offersByUser:', error);
        updateOfferCount(0);
    });

    // Verificar expiraciones periódicamente (cada 60 segundos) para ofertas
    function checkExpiredOffers() {
        const now = new Date();
        let activeOffers = 0;
        onValue(offersRef, (snapshot) => {
            if (snapshot.exists()) {
                const offersData = snapshot.val();
                for (const userUID in offersData) {
                    const userOffers = offersData[userUID];
                    for (const offerId in userOffers) {
                        const offer = userOffers[offerId];
                        if (offer.status === 'active' && new Date(offer.endDateTime) > now) {
                            activeOffers++;
                        }
                    }
                }
            }
            if (activeOffers !== activeOffersCount) {
                activeOffersCount = activeOffers;
                updateOfferCount(activeOffersCount);
                console.log('Conteo actualizado por expiración:', activeOffersCount);
            }
        }, { onlyOnce: true });
    }

    // Verificar cambios en el carrito periódicamente (cada 5 segundos)
    function checkCartChanges() {
        const currentCartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const newCount = currentCartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        if (newCount !== cartItemsCount) {
            cartItemsCount = newCount;
            updateCartCount(cartItemsCount);
            console.log('Conteo de carrito actualizado:', cartItemsCount);
        }
    }

    // Ejecutar verificación de expiraciones de ofertas cada 60 segundos
    setInterval(checkExpiredOffers, 60 * 1000);

    // Ejecutar verificación de cambios en el carrito cada 5 segundos
    setInterval(checkCartChanges, 5 * 1000);

    // Escuchar eventos personalizados de cambios en el carrito
    window.addEventListener('storage', (event) => {
        if (event.key === 'cartItems') {
            cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            const newCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
            if (newCount !== cartItemsCount) {
                cartItemsCount = newCount;
                updateCartCount(cartItemsCount);
                console.log('Conteo de carrito actualizado por evento storage:', cartItemsCount);
            }
        }
    });
});