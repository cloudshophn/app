import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { renderProducts, updateCartDisplay, openProductImagesModal, renderPagination } from './structure.js';
import { selectedDepartamento, selectedCiudad } from './filterbylocation.js';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBJi-ve8Z1v6IGaa-4F0135AIAabdISPx8",
  authDomain: "sajsajndhbshaihbaksjsdnsjahius.firebaseapp.com",
  projectId: "sajsajndhbshaihbaksjsdnsjahius",
  storageBucket: "sajsajndhbshaihbaksjsdnsjahius.appspot.com",
  messagingSenderId: "923009709693",
  appId: "1:923009709693:web:abde872e5878909b556314",
  measurementId: "G-NG78JB2DLE"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Seleccionar elementos del DOM
const productsContainer = document.getElementById('productsContainer');
const cartModal = document.getElementById('cartModal');
const modalBodyCarrito = cartModal ? cartModal.querySelector('.modal-body-carrito') : null;

// Variables globales
let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
let currentCategoryPage = 1;
const categoriesPerPage = 10;
let loadedProductsPerCategory = {};
let allProducts = [];
let categoryCounts = {};

// Función para sanitizar el nombre del producto para URLs
function sanitizeProductNameForUrl(name) {
  if (typeof name !== 'string') return '';
  return encodeURIComponent(
    name.toLowerCase()
      .replace(/\s+/g, '-') // Reemplazar espacios por guiones
      .replace(/[^a-z0-9áéíóúñü-]/g, '') // Permitir letras, números, acentos y guiones
      .replace(/-+/g, '-') // Reemplazar múltiples guiones por uno solo
      .trim()
  );
}

// Función para sanitizar el nombre del producto para comparación
function sanitizeProductNameForMatch(name) {
  if (typeof name !== 'string') return '';
  return name.toLowerCase()
    .replace(/\s+/g, '-') // Reemplazar espacios por guiones
    .replace(/[^a-z0-9áéíóúñü-]/g, '') // Permitir letras, números, acentos y guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones por uno solo
    .trim();
}

// Función para limpiar proid de prefijo
function cleanProid(proid) {
  return proid.replace(/^proid-/, '');
}

// Función para guardar el carrito en localStorage
function saveCartToStorage() {
  localStorage.setItem('cartItems', JSON.stringify(cartItems));
}

// Función para mostrar notificación
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Función para actualizar las etiquetas de todos los productos
function updateAllProductBadges() {
  const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    const proid = card.dataset.proid;
    const badge = card.querySelector('.product-badge');
    if (badge) {
      const product = allProducts.find(p => p.proid === proid);
      const isInCart = cartItems.some(item => item.proid === proid);
      const isAvailable = product && product.stock > 0;
      
      if (!isAvailable) {
        badge.textContent = 'Agotado';
        badge.classList.remove('available', 'added');
        badge.classList.add('sold-out');
      } else {
        badge.textContent = isInCart ? 'Producto Añadido' : 'Disponible';
        badge.classList.remove('sold-out');
        badge.classList.add('available');
        if (isInCart) {
          badge.classList.add('added');
        } else {
          badge.classList.remove('added');
        }
      }
    }
  });
}

// Asignar funciones a window para compatibilidad con otros scripts
window.showNotification = showNotification;
window.showProductModal = showProductModal;
window.sanitizeProductNameForUrl = sanitizeProductNameForUrl;
window.updateAllProductBadges = updateAllProductBadges;
window.allProducts = allProducts; // Exponer allProducts para searchbar.js

// Función para agregar producto al carrito
function addToCart(productData, updateOnly = false) {
  if (productData.stock <= 0) {
    showNotification('No se puede añadir un producto agotado');
    return;
  }
  console.log('addToCart called with:', productData, 'updateOnly:', updateOnly);
  const existingItem = cartItems.find(item => item.proid === productData.proid);
  
  if (existingItem) {
    if (updateOnly) {
      existingItem.immediateDelivery = productData.immediateDelivery;
      existingItem.price = productData.price;
    } else {
      const newQuantity = existingItem.quantity + productData.quantity;
      if (newQuantity <= productData.stock) {
        existingItem.quantity = newQuantity;
      } else {
        existingItem.quantity = productData.stock;
        showNotification('Cantidad limitada por stock disponible');
      }
      existingItem.immediateDelivery = productData.immediateDelivery;
      existingItem.price = productData.price;
    }
  } else if (!updateOnly) {
    cartItems.push({ ...productData, id: Date.now() });
  }
  
  saveCartToStorage();
  updateCartDisplay(cartItems, modalBodyCarrito);
  showNotification(existingItem && updateOnly ? 'Estado de entrega actualizado' : 'Producto añadido al carrito');
}

// Asignar addToCart a window para que structure.js lo use
window.addToCart = addToCart;

// Función para abrir el modal del carrito
function openCartModal() {
  if (cartModal) {
    cartModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateCartDisplay(cartItems, modalBodyCarrito);
  }
}

// Función para cerrar el modal del carrito
function closeCartModalHandler() {
  if (cartModal) {
    cartModal.classList.remove('open');
    document.body.style.overflow = 'auto';
  }
}

// Función para configurar eventos del modal de producto
function setupModalEventListeners(modal, images, product) {
  const mainImage = modal.querySelector('.main-product-img');
  const thumbnails = modal.querySelectorAll('.thumbnail-img');
  const quantityInput = modal.querySelector('.quantity-input');
  const decrementBtn = modal.querySelector('.btn-decrement');
  const incrementBtn = modal.querySelector('.btn-increment');
  const shareButton = modal.querySelector('.share-button');
  const closeButton = modal.querySelector('#closeProductImagesModal');

  let currentIndex = 0;
  const stock = product.stock || 0;

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = 'auto';
  }

  function updateMainImage(index) {
    currentIndex = index;
    mainImage.src = images.slice(0, 3)[currentIndex];
  }

  function updateQuantity(newValue) {
    let quantity = Math.max(1, Math.min(stock, parseInt(newValue) || 1));
    quantityInput.value = quantity;
  }

  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener('click', () => updateMainImage(index));
  });

  if (quantityInput && !quantityInput.disabled) {
    quantityInput.addEventListener('input', (e) => {
      let value = parseInt(e.target.value) || 1;
      if (value > stock) {
        value = stock;
        showNotification('Cantidad limitada por stock disponible');
      }
      updateQuantity(value);
    });

    decrementBtn.addEventListener('click', () => updateQuantity(parseInt(quantityInput.value) - 1));
    incrementBtn.addEventListener('click', () => updateQuantity(parseInt(quantityInput.value) + 1));
  }

  if (shareButton) {
    shareButton.addEventListener('click', async () => {
      try {
        if (!product.proid) {
          console.error('proid no disponible:', product);
          throw new Error('ID de producto no disponible');
        }
        const sanitizedName = sanitizeProductNameForUrl(product.nombre);
        const cleanId = cleanProid(product.proid);
        const productUrl = `${window.location.origin}${window.location.pathname}#product-${cleanId}~${sanitizedName}`;
        await navigator.clipboard.writeText(productUrl);
        showNotification('¡Enlace copiado! Comparte este producto');
        const icon = shareButton.querySelector('.material-icons');
        icon.textContent = 'check';
        setTimeout(() => icon.textContent = 'share', 2000);
      } catch (err) {
        console.error('Error al copiar:', err);
        showNotification('Error al copiar el enlace');
      }
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', function keydownHandler(e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
      document.removeEventListener('keydown', keydownHandler);
    }
  });
}

// Función para mostrar el modal del producto
function showProductModal(product) {
  if (!product.imagenes || product.imagenes.length === 0) {
    console.error('El producto no tiene imágenes:', product);
    showNotification('El producto no tiene imágenes disponibles');
    return;
  }

  const modal = openProductImagesModal(product.imagenes, product);
  if (!modal) {
    console.error('No se pudo abrir el modal');
    return;
  }

  setupModalEventListeners(modal, product.imagenes, product);
  history.replaceState(null, null, ' ');
}

// Función para manejar URLs con hash de producto
function handleProductHash() {
  const hash = window.location.hash;
  if (!hash) return;

  const productMatch = hash.match(/#product-(proid-)?([^~]+)~(.+)/);
  
  if (productMatch) {
    const productId = productMatch[2];
    let productName;
    try {
      productName = decodeURIComponent(productMatch[3]);
    } catch (err) {
      console.error('Error decoding product name:', err);
      showNotification('Error al procesar el enlace del producto');
      return;
    }
    
    let product = allProducts.find(p => {
      const cleanId = cleanProid(p.proid);
      const sanitizedName = sanitizeProductNameForMatch(p.nombre);
      return cleanId === productId && sanitizedName === productName;
    });

    if (product) {
      showProductModal(product);
      return;
    }

    const productosRef = ref(db, 'productsbylocation');
    onValue(productosRef, (snapshot) => {
      const data = snapshot.val() || {};
      let foundProduct = null;

      Object.values(data).forEach(departamento => {
        Object.values(departamento).forEach(ciudad => {
          Object.entries(ciudad).forEach(([proid, producto]) => {
            const cleanId = cleanProid(proid);
            const sanitizedName = sanitizeProductNameForMatch(producto.nombre);
            if (cleanId === productId && sanitizedName === productName) {
              foundProduct = { ...producto, proid };
            }
          });
        });
      });

      if (foundProduct) {
        showProductModal(foundProduct);
      } else {
        showNotification('El producto no se encuentra disponible');
      }
    }, { onlyOnce: true });
  }
}

// Función para contar productos por categoría
function getCategoryCounts(data) {
  const counts = {};
  const excludedCategories = ['moda', 'ferreteria', 'tecnologia'];
  Object.values(data).forEach(departamento => {
    Object.values(departamento).forEach(ciudad => {
      Object.entries(ciudad).forEach(([proid, producto]) => {
        const category = producto.categoria || 'Sin categoría';
        if (!excludedCategories.includes(category.toLowerCase())) {
          counts[category] = (counts[category] || 0) + 1;
        }
      });
    });
  });
  return counts;
}

// Función para actualizar datos de productos sin rerenderizar
function updateProductsData(data) {
  const newProducts = [];
  const excludedCategories = ['moda', 'ferreteria', 'tecnologia'];
  Object.values(data).forEach(departamento => {
    Object.values(departamento).forEach(ciudad => {
      Object.entries(ciudad).forEach(([proid, producto]) => {
        if (!excludedCategories.includes(producto.categoria?.toLowerCase())) {
          newProducts.push({ ...producto, proid });
        }
      });
    });
  });
  
  allProducts = newProducts;
  window.allProducts = allProducts; // Actualizar window.allProducts
  categoryCounts = getCategoryCounts(data);
  updateAllProductBadges(); // Actualizar etiquetas para reflejar cambios en stock
}

// Función para renderizar productos con filtros aplicados
function renderFilteredProducts() {
  const selectedCategories = [...document.querySelectorAll('#categoriesContainer input[name="category"]:checked')].map(cb => cb.value);
  let filteredProducts = selectedCategories.length > 0
    ? allProducts.filter(p => selectedCategories.includes(p.categoria))
    : allProducts;

  filteredProducts = filteredProducts.filter(p => 
    (!selectedDepartamento || p.departamento === selectedDepartamento) &&
    (!selectedCiudad || p.ciudad === selectedCiudad)
  );

  renderProducts(filteredProducts, selectedCategories, productsContainer, currentCategoryPage, categoriesPerPage, categoryCounts, loadedProductsPerCategory);
}

// Función para configurar eventos de los productos
function setupProductEventListeners() {
  productsContainer.addEventListener('click', (e) => {
    const button = e.target.closest('.view-button');
    const moreButton = e.target.closest('.more-products-btn');

    if (button) {
      const images = JSON.parse(button.dataset.images);
      const product = JSON.parse(button.dataset.product);
      const updatedProduct = allProducts.find(p => p.proid === product.proid) || product; // Usar datos actualizados
      const modal = openProductImagesModal(images, updatedProduct);
      setupModalEventListeners(modal, images, updatedProduct);
    } else if (moreButton) {
      const category = moreButton.dataset.category;
      loadedProductsPerCategory[category] = (loadedProductsPerCategory[category] || 10) + 10;
      renderFilteredProducts();
    }
  });
}

// Función para configurar eventos de paginación
function setupPaginationEvents(totalCategories) {
  productsContainer.addEventListener('click', (e) => {
    const target = e.target.closest('.pagination-btn');
    if (!target) return;
    
    if (target.textContent.includes('chevron_left')) {
      currentCategoryPage = Math.max(1, currentCategoryPage - 1);
    } else if (target.textContent.includes('chevron_right')) {
      currentCategoryPage = Math.min(Math.ceil(totalCategories / categoriesPerPage), currentCategoryPage + 1);
    } else {
      currentCategoryPage = parseInt(target.textContent);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderFilteredProducts();
  });
}

// Función para configurar eventos de filtros de categoría
function setupCategoryFilterEvents() {
  const categoriesContainer = document.getElementById('categoriesContainer');
  if (categoriesContainer) {
    categoriesContainer.addEventListener('change', (e) => {
      if (e.target.name === 'category') {
        currentCategoryPage = 1; // Resetear página al cambiar filtros
        renderFilteredProducts();
      }
    });
  }
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  // Configurar eventos del carrito
  if (cartModal) {
    cartModal.querySelector('.close-cart')?.addEventListener('click', closeCartModalHandler);
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) closeCartModalHandler();
    });
  }

  document.querySelector('.cart-icon')?.addEventListener('click', openCartModal);

  // Configurar eventos del carrito en el modal
  modalBodyCarrito?.addEventListener('click', (e) => {
    const target = e.target;
    const itemElement = target.closest('.cart-item');
    
    if (target.closest('#onlinePaymentBtn')) {
      window.location.href = 'onlinestore/paymentmethods/CheckoutOnlinePayment.html';
    } else if (target.closest('#cashPaymentBtn')) {
      window.location.href = 'onlinestore/paymentmethods/CheckoutCashPayment.html';
    }

    if (!itemElement) return;

    const id = parseInt(itemElement.querySelector('.cart-quantity').dataset.id);
    const stock = parseInt(itemElement.querySelector('.cart-quantity').dataset.stock);
    const item = cartItems.find(i => i.id === id);

    // Abrir modal del producto al hacer clic en cualquier parte del .cart-item
    if (!target.closest('.btn-decrement') && !target.closest('.btn-increment') && 
        !target.closest('.remove-item') && !target.closest('#onlinePaymentBtn') && 
        !target.closest('#cashPaymentBtn')) {
      if (item) {
        const product = allProducts.find(p => p.proid === item.proid) || {
          ...item,
          nombre: item.name,
          imagenes: [item.image],
          descripcion: item.details,
          precio: item.price,
          stock: item.stock,
          proid: item.proid,
          categoria: 'Carrito',
          ciudad: item.ciudad,
          entregaInmediata: item.immediateDelivery ? 'sí' : 'no'
        };
        showProductModal(product);
      }
      return;
    }

    if (target.closest('.btn-decrement')) {
      const quantityInput = itemElement.querySelector('.cart-quantity');
      let quantity = Math.max(1, parseInt(quantityInput.value) - 1);
      quantityInput.value = quantity;
      const itemToUpdate = cartItems.find(i => i.id === id);
      if (itemToUpdate) {
        itemToUpdate.quantity = quantity;
        saveCartToStorage();
        updateCartDisplay(cartItems, modalBodyCarrito);
      }
    } else if (target.closest('.btn-increment')) {
      const quantityInput = itemElement.querySelector('.cart-quantity');
      let quantity = Math.min(stock, parseInt(quantityInput.value) + 1);
      quantityInput.value = quantity;
      const itemToUpdate = cartItems.find(i => i.id === id);
      if (itemToUpdate) {
        itemToUpdate.quantity = quantity;
        saveCartToStorage();
        updateCartDisplay(cartItems, modalBodyCarrito);
      }
    } else if (target.closest('.remove-item')) {
      cartItems = cartItems.filter(i => i.id !== id);
      saveCartToStorage();
      updateCartDisplay(cartItems, modalBodyCarrito);
      showNotification('Producto eliminado');
    }
  });

  modalBodyCarrito?.addEventListener('change', (e) => {
    if (e.target.classList.contains('cart-quantity')) {
      const id = parseInt(e.target.dataset.id);
      const stock = parseInt(e.target.dataset.stock);
      let quantity = Math.max(1, Math.min(stock, parseInt(e.target.value) || 1));
      e.target.value = quantity;
      const itemToUpdate = cartItems.find(i => i.id === id);
      if (itemToUpdate) {
        itemToUpdate.quantity = quantity;
        saveCartToStorage();
        updateCartDisplay(cartItems, modalBodyCarrito);
      }
    }
  });

  // Cargar datos de Firebase
  const productosRef = ref(db, 'productsbylocation');
  onValue(productosRef, (snapshot) => {
    const data = snapshot.val() || {};
    updateProductsData(data); // Actualizar datos sin rerenderizar

    // Renderizar solo en la carga inicial
    if (!productsContainer.hasChildNodes()) {
      const allCategories = [...new Set(allProducts.map(p => p.categoria || 'Sin categoría'))].sort();
      renderFilteredProducts();
      renderPagination(allCategories.length, categoriesPerPage, currentCategoryPage, productsContainer);
      setupProductEventListeners();
      setupPaginationEvents(allCategories.length);
      setupCategoryFilterEvents();
    }
  }, { onlyOnce: false });

  // Cargar carrito inicial
  updateCartDisplay(cartItems, modalBodyCarrito);

  // Manejar URLs con hash de producto al cargar
  handleProductHash();

  // Escuchar cambios en el hash
  window.addEventListener('hashchange', handleProductHash);
});

// Exportar showNotification para uso en otros archivos
export { showNotification };