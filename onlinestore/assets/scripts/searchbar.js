import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

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

document.addEventListener('DOMContentLoaded', () => {
    console.log('searchbar.js cargado');

    // Seleccionar elementos del DOM para ambas barras de búsqueda
    const searchInput = document.getElementById('searchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const clearSearch = document.getElementById('clearSearch');
    const mobileClearSearch = document.querySelector('.mobile-clear-search');
    const searchResults = document.getElementById('searchResults');
    const mobileSearchResults = document.getElementById('mobileSearchResults');

    // Verificar que los elementos existen
    if (!searchInput || !mobileSearchInput || !clearSearch || !mobileClearSearch || !searchResults || !mobileSearchResults) {
        console.error('Uno o más elementos del DOM no se encontraron');
        return;
    }

    // Aplicar estilos a los contenedores de resultados
    [searchResults, mobileSearchResults].forEach(results => {
        results.style.zIndex = '1000';
        results.style.position = 'absolute';
        results.style.backgroundColor = 'white';
        results.style.border = '1px solid #ddd';
        results.style.borderRadius = '0 0 4px 4px';
        results.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        results.style.width = '100%';
        results.style.maxHeight = '400px'; // Aumentado para 20 sugerencias
        results.style.overflowY = 'auto';
        results.style.display = 'none';
    });

    // Función para buscar productos en Firebase
    async function searchProductsInFirebase(searchTerm) {
        const lowerSearch = searchTerm.toLowerCase().trim();
        if (!lowerSearch) return [];

        try {
            const locationsRef = ref(db, 'productsbylocation');
            const snapshot = await get(locationsRef);
            
            if (!snapshot.exists()) {
                console.log('No hay productos en la base de datos');
                return [];
            }
            
            const productsData = snapshot.val();
            const allProducts = [];
            
            for (const departamento in productsData) {
                for (const ciudad in productsData[departamento]) {
                    const cityProducts = productsData[departamento][ciudad];
                    
                    for (const productId in cityProducts) {
                        const product = cityProducts[productId];
                        allProducts.push({
                            id: productId,
                            nombre: product.nombre || '',
                            precio: parseFloat(product.precio) || 0,
                            imagenes: product.imagenes || [],
                            ciudad: ciudad,
                            marca: product.marca || '',
                            descripcion: product.descripcion || ''
                        });
                    }
                }
            }
            
            return allProducts.filter(product => 
                product.nombre.toLowerCase().includes(lowerSearch) ||
                product.marca.toLowerCase().includes(lowerSearch) ||
                product.descripcion.toLowerCase().includes(lowerSearch)
            );
        } catch (error) {
            console.error('Error al buscar productos:', error);
            return [];
        }
    }

    // Función para formatear precios
    function formatPrice(price) {
        return `L ${parseFloat(price).toFixed(2)}`;
    }

    // Función para mostrar sugerencias
    async function showSuggestions(searchTerm, input, resultsContainer) {
        const lowerSearch = searchTerm.toLowerCase().trim();
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';

        if (!lowerSearch) return;

        resultsContainer.innerHTML = '<div class="suggestion-item" style="padding: 10px; color: #666;">Buscando productos...</div>';
        resultsContainer.style.display = 'block';

        const matches = await searchProductsInFirebase(lowerSearch);
        resultsContainer.innerHTML = '';

        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div class="suggestion-item" style="padding: 10px; color: #666;">No se encontraron productos.</div>';
        } else {
            // Cambia el número en slice(0, 20) para ajustar la cantidad de sugerencias mostradas
            matches.slice(0, 100).forEach((product, index) => {
                const suggestion = document.createElement('div');
                suggestion.className = 'suggestion-item';
                suggestion.style.padding = '10px';
                suggestion.style.borderBottom = '1px solid #eee';
                suggestion.style.cursor = 'pointer';
                suggestion.style.display = 'flex';
                suggestion.style.alignItems = 'center';
                suggestion.style.gap = '10px';
                
                suggestion.innerHTML = `
                    <img src="${product.imagenes[0] || 'https://via.placeholder.com/40'}" alt="${product.nombre}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${product.nombre || 'Producto sin nombre'}</div>
                        <div style="font-size: 0.85em; color: #666;">
                            ${formatPrice(product.precio)}
                            <span style="margin-left: 8px;">Disponible en: ${product.ciudad}</span>
                        </div>
                    </div>
                `;
                
                suggestion.addEventListener('click', () => {
                    console.log('Producto seleccionado:', product.id);
                    // Buscar el producto completo en window.allProducts
                    const fullProduct = window.allProducts?.find(p => p.proid === product.id);
                    if (fullProduct) {
                        // Actualizar el campo de búsqueda
                        input.value = fullProduct.nombre;
                        resultsContainer.innerHTML = '';
                        resultsContainer.style.display = 'none';
                        // Actualizar el hash de la URL
                        const sanitizedName = window.sanitizeProductNameForUrl(fullProduct.nombre);
                        const cleanId = product.id.replace(/^proid-/, '');
                        window.location.hash = `#product-${cleanId}~${sanitizedName}`;
                        // Abrir el modal del producto
                        window.showProductModal(fullProduct);
                    } else {
                        console.error('Producto no encontrado en allProducts:', product.id);
                        window.showNotification('Producto no encontrado');
                    }
                });
                
                suggestion.addEventListener('mouseenter', () => {
                    suggestion.style.backgroundColor = '#f5f5f5';
                });
                
                suggestion.addEventListener('mouseleave', () => {
                    suggestion.style.backgroundColor = 'white';
                });
                
                resultsContainer.appendChild(suggestion);
            });
        }

        resultsContainer.style.display = 'block';

        // Navegación con teclado
        const suggestions = resultsContainer.querySelectorAll('.suggestion-item');
        let activeIndex = -1;

        input.addEventListener('keydown', (e) => {
            if (suggestions.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % suggestions.length;
                updateActiveSuggestion(suggestions, activeIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
                updateActiveSuggestion(suggestions, activeIndex);
            } else if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault();
                suggestions[activeIndex].click();
            }
        });
    }

    // Función para actualizar la sugerencia activa
    function updateActiveSuggestion(suggestions, activeIndex) {
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('active', index === activeIndex);
            if (index === activeIndex) {
                suggestion.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    // Función debounce para optimizar las búsquedas
    let debounceTimer;
    function debounceSearch(input, otherInput, clearIcon, resultsContainer) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const searchTerm = input.value;
            clearIcon.style.display = searchTerm ? 'inline-block' : 'none';
            otherInput.value = searchTerm;
            showSuggestions(searchTerm, input, resultsContainer);
        }, 300);
    }

    // Event listeners para los inputs
    searchInput.addEventListener('input', () => {
        console.log('Evento input en searchInput');
        debounceSearch(searchInput, mobileSearchInput, clearSearch, searchResults);
    });

    mobileSearchInput.addEventListener('input', () => {
        console.log('Evento input en mobileSearchInput');
        debounceSearch(mobileSearchInput, searchInput, mobileClearSearch, mobileSearchResults);
    });

    // Event listeners para los íconos de limpiar
    clearSearch.addEventListener('click', () => {
        console.log('Clic en clearSearch');
        searchInput.value = '';
        mobileSearchInput.value = '';
        clearSearch.style.display = 'none';
        mobileClearSearch.style.display = 'none';
        searchResults.innerHTML = '';
        mobileSearchResults.innerHTML = '';
        searchResults.style.display = 'none';
        mobileSearchResults.style.display = 'none';
    });

    mobileClearSearch.addEventListener('click', () => {
        console.log('Clic en mobileClearSearch');
        searchInput.value = '';
        mobileSearchInput.value = '';
        clearSearch.style.display = 'none';
        mobileClearSearch.style.display = 'none';
        searchResults.innerHTML = '';
        mobileSearchResults.innerHTML = '';
        searchResults.style.display = 'none';
        mobileSearchResults.style.display = 'none';
    });

    // Ocultar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!searchResults.contains(e.target) && 
            !mobileSearchResults.contains(e.target) && 
            !searchInput.contains(e.target) && 
            !mobileSearchInput.contains(e.target)) {
            searchResults.innerHTML = '';
            mobileSearchResults.innerHTML = '';
            searchResults.style.display = 'none';
            mobileSearchResults.style.display = 'none';
        }
    });

    // Manejar tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchResults.innerHTML = '';
            mobileSearchResults.innerHTML = '';
            searchResults.style.display = 'none';
            mobileSearchResults.style.display = 'none';
        }
    });
});