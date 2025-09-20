import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Configuración de Firebase (misma que cardproduction.js)
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
const searchInput = document.getElementById('product-search');
const searchResults = document.getElementById('search-results');
const clearBtn = document.querySelector('.clear-btn');
const searchBtn = document.querySelector('.search-btn');

// Estado para manejar datos y consultas
let allProducts = [];
let isDataInitialized = false;
let pendingQuery = null;

// Función para sanitizar el nombre del producto para URLs (igual que en cardproduction.js)
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

// Función para limpiar proid de prefijo (igual que en cardproduction.js)
function cleanProid(proid) {
  return proid.replace(/^proid-/, '');
}

// Función para sanitizar texto (insensible a mayúsculas y acentos)
function sanitizeText(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Función para renderizar sugerencias (estilo YouTube con precio debajo del nombre)
function renderSuggestions(products, query) {
  searchResults.innerHTML = '';

  if (!query) {
    searchResults.classList.remove('show');
    clearBtn.classList.remove('visible');
    return;
  }

  const sanitizedQuery = sanitizeText(query);
  const filteredProducts = products
    .filter(product => {
      const sanitizedName = sanitizeText(product.nombre || '');
      const sanitizedDesc = sanitizeText(product.descripcion || '');
      return sanitizedName.includes(sanitizedQuery) || sanitizedDesc.includes(sanitizedQuery); // Búsqueda por nombre y descripción
    })
    .slice(0, 100); // Limitar a 100 sugerencias

  if (filteredProducts.length === 0) {
    searchResults.innerHTML = '<div class="suggestion-item no-results">No se encontraron productos, intenta de nuevo</div>';
    searchResults.classList.add('show');
    clearBtn.classList.add('visible');
    return;
  }

  filteredProducts.forEach(product => {
    const suggestion = document.createElement('div');
    suggestion.className = 'suggestion-item';
    suggestion.innerHTML = `
      <img src="${product.imagenes[0] || 'https://via.placeholder.com/80x50'}" alt="${product.nombre}" class="suggestion-img" />
      <div class="suggestion-details">
        <div class="suggestion-info">
          <div class="suggestion-name">${product.nombre}</div>
          <div class="suggestion-price">L ${product.precio}</div>
        </div>
        <div class="suggestion-city">Disponible en: ${product.ciudad || 'No especificada'}</div>
      </div>
    `;
    suggestion.addEventListener('click', () => {
      try {
        const sanitizedName = sanitizeProductNameForUrl(product.nombre);
        const cleanId = cleanProid(product.proid);
        const productUrl = `https://cloudshophn.github.io/app/onlinestore#product-${cleanId}~${sanitizedName}`;
        window.location.href = productUrl; // Redirigir a la página de la tienda
        searchInput.value = '';
        searchResults.classList.remove('show');
        clearBtn.classList.remove('visible');
      } catch (error) {
        console.error('Error al redirigir:', error);
      }
    });
    searchResults.appendChild(suggestion);
  });

  searchResults.classList.add('show');
  clearBtn.classList.add('visible');
}

// Lógica principal
document.addEventListener('DOMContentLoaded', () => {
  // Verificar existencia de elementos del DOM
  if (!searchInput || !searchResults || !clearBtn || !searchBtn) {
    console.error('Elementos del DOM no encontrados');
    return;
  }

  // Función para cargar datos de Firebase solo cuando se necesite
  function loadData() {
    if (isDataInitialized) return;

    const productosRef = ref(db, 'productsbylocation');
    onValue(productosRef, (snapshot) => {
      const data = snapshot.val() || {};
      allProducts = [];
      Object.values(data).forEach(departamento => {
        Object.values(departamento).forEach(ciudad => {
          Object.entries(ciudad).forEach(([proid, producto]) => {
            allProducts.push({ ...producto, proid });
          });
        });
      });
      isDataInitialized = true;

      // Procesar consulta pendiente si existe
      if (pendingQuery) {
        renderSuggestions(allProducts, pendingQuery);
        pendingQuery = null;
      }
    }, {
      onlyOnce: false,
      error: (error) => {
        console.error('Error al leer Firebase:', error);
        searchResults.innerHTML = '<div class="suggestion-item no-results">Error al cargar datos, intenta de nuevo</div>';
        searchResults.classList.add('show');
      }
    });
  }

  // Cargar datos y procesar búsqueda al escribir
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    clearBtn.classList.toggle('visible', query.length > 0);
    if (!isDataInitialized) {
      loadData(); // Cargar datos solo si no se han cargado antes
    }
    if (isDataInitialized) {
      renderSuggestions(allProducts, query);
    } else {
      pendingQuery = query;
    }
  });

  // Cargar datos y procesar búsqueda al hacer clic en el botón
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (!query) return;
    clearBtn.classList.add('visible');
    if (!isDataInitialized) {
      loadData(); // Cargar datos solo si no se han cargado antes
    }
    if (isDataInitialized) {
      renderSuggestions(allProducts, query);
    } else {
      pendingQuery = query;
    }
  });

  // Limpiar el input al hacer clic en la "X"
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.remove('visible');
    searchResults.classList.remove('show');
    searchInput.focus();
  });

  // Ocultar sugerencias al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!searchResults.contains(e.target) && e.target !== searchInput && e.target !== clearBtn && e.target !== searchBtn) {
      searchResults.classList.remove('show');
    }
  });
});
