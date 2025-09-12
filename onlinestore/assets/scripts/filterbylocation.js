import { departamentosYCiudades } from './red.js';
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { renderProducts } from './structure.js';
import { showNotification } from './cardproduction.js';

// Seleccionar elementos del DOM
const productsContainer = document.getElementById('productsContainer');

// Variables globales para almacenar el filtro de ubicación
let selectedDepartamento = localStorage.getItem('selectedDepartamento') || '';
let selectedCiudad = localStorage.getItem('selectedCiudad') || '';

// Función para crear el modal de selección de ubicación
export function createLocationModal() {
  let modal = document.getElementById('localproModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'localproModal';
    modal.className = 'localpro-modal';
    document.body.appendChild(modal);
  }

  // Generar opciones para departamentos
  const departamentoOptions = Object.keys(departamentosYCiudades)
    .sort()
    .map(departamento => `<option value="${departamento}" ${departamento === selectedDepartamento ? 'selected' : ''}>${departamento}</option>`)
    .join('');

  modal.innerHTML = `
    <div class="localpro-content">
      <div class="localpro-header">
        <h2>Encuentra Productos Cerca de Ti</h2>
        <button class="localpro-close" id="localproCloseModal">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="localpro-body">
        <div class="localpro-form">
          <label for="localproDepartamentoSelect">Departamento:</label>
          <select id="localproDepartamentoSelect" name="departamento">
            <option value="">Seleccione un departamento</option>
            ${departamentoOptions}
          </select>
          <label for="localproCiudadSelect">Ciudad:</label>
          <select id="localproCiudadSelect" name="ciudad" ${selectedDepartamento ? '' : 'disabled'}>
            <option value="">Seleccione una ciudad</option>
            ${selectedDepartamento ? departamentosYCiudades[selectedDepartamento].sort().map(ciudad => 
              `<option value="${ciudad}" ${ciudad === selectedCiudad ? 'selected' : ''}>${ciudad}</option>`).join('') : ''}
          </select>
          <div class="localpro-actions">
            <button id="localproFindButton" class="localpro-find-btn">Find</button>
            <button id="localproViewAllButton" class="localpro-view-all-btn">Ver todos</button>
          </div>
        </div>
      </div>
    </div>
  `;

  return modal;
}

// Función para abrir el modal
function openLocationModal() {
  const modal = createLocationModal();
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Configurar eventos después de crear el modal
  setupModalEvents();
}

// Función para cerrar el modal
function closeLocationModal() {
  const modal = document.getElementById('localproModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = 'auto';
  }
}

// Función para mostrar todos los productos (usada por "Ver todos", cerrar modal y clic fuera)
function showAllProducts() {
  selectedDepartamento = '';
  selectedCiudad = '';
  localStorage.setItem('selectedDepartamento', selectedDepartamento);
  localStorage.setItem('selectedCiudad', selectedCiudad);
  console.log('Guardado en localStorage (View All):', { selectedDepartamento, selectedCiudad }); // Depuración
  filterProductsByLocation('', '');
  closeLocationModal();
}

// Función para poblar el selector de ciudades según el departamento seleccionado
function populateCities(departamentoSelect, ciudadSelect) {
  const departamento = departamentoSelect.value;
  ciudadSelect.innerHTML = '<option value="">Seleccione una ciudad</option>';
  ciudadSelect.disabled = !departamento;

  if (departamento && departamentosYCiudades[departamento]) {
    const ciudades = departamentosYCiudades[departamento].sort();
    ciudades.forEach(ciudad => {
      const option = document.createElement('option');
      option.value = ciudad;
      option.textContent = ciudad;
      if (ciudad === selectedCiudad) option.selected = true;
      ciudadSelect.appendChild(option);
    });
    ciudadSelect.disabled = false;
  }
}

// Función para filtrar productos por ubicación
function filterProductsByLocation(departamento, ciudad) {
  const db = getDatabase();
  const productosRef = ref(db, 'productsbylocation');
  onValue(productosRef, (snapshot) => {
    const data = snapshot.val() || {};
    let filteredProducts = [];
    const excludedCategories = ['moda', 'ferreteria', 'tecnologia'];

    // Recorrer la base de datos para obtener productos filtrados
    Object.entries(data).forEach(([dep, ciudades]) => {
      if (!departamento || dep === departamento) {
        Object.entries(ciudades).forEach(([ciud, productos]) => {
          if (!ciudad || ciud === ciudad) {
            Object.entries(productos).forEach(([proid, producto]) => {
              if (!excludedCategories.includes(producto.categoria?.toLowerCase())) {
                filteredProducts.push({ ...producto, proid });
              }
            });
          }
        });
      }
    });

    // Obtener conteo de categorías para renderProducts
    const categoryCounts = {};
    filteredProducts.forEach(producto => {
      const category = producto.categoria || 'Sin categoría';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Obtener categorías seleccionadas desde el contenedor de filtros
    const selectedCategories = [...document.querySelectorAll('#categoriesContainer input[name="category"]:checked')].map(cb => cb.value);

    // Filtrar productos según categorías seleccionadas, si las hay
    let finalProducts = selectedCategories.length > 0
      ? filteredProducts.filter(p => selectedCategories.includes(p.categoria))
      : filteredProducts;

    // Renderizar productos
    renderProducts(
      finalProducts,
      selectedCategories,
      productsContainer,
      1, // currentCategoryPage
      10, // categoriesPerPage
      categoryCounts,
      {} // loadedProductsPerCategory
    );

    // Mostrar notificación
    if (finalProducts.length === 0) {
      showNotification('No se encontraron productos para la ubicación seleccionada');
    } else {
      showNotification('Filtro de ubicación aplicado');
    }
  }, { onlyOnce: true });
}

// Función para configurar eventos del modal
function setupModalEvents() {
  const departamentoSelect = document.getElementById('localproDepartamentoSelect');
  const ciudadSelect = document.getElementById('localproCiudadSelect');
  const findButton = document.getElementById('localproFindButton');
  const viewAllButton = document.getElementById('localproViewAllButton');
  const closeButton = document.getElementById('localproCloseModal');
  const modal = document.getElementById('localproModal');

  // Poblar ciudades cuando cambie el departamento
  departamentoSelect.addEventListener('change', () => {
    populateCities(departamentoSelect, ciudadSelect);
  });

  // Manejar clic en "Find"
  findButton.addEventListener('click', () => {
    const departamento = departamentoSelect.value;
    const ciudad = ciudadSelect.value;

    if (!departamento) {
      showNotification('Por favor, seleccione un departamento');
      return;
    }

    selectedDepartamento = departamento;
    selectedCiudad = ciudad;
    localStorage.setItem('selectedDepartamento', selectedDepartamento);
    localStorage.setItem('selectedCiudad', selectedCiudad);
    console.log('Guardado en localStorage:', { selectedDepartamento, selectedCiudad }); // Depuración
    filterProductsByLocation(departamento, ciudad);
    closeLocationModal();
  });

  // Manejar clic en "Ver todos"
  viewAllButton.addEventListener('click', showAllProducts);

  // Manejar clic en cerrar modal (mismo comportamiento que "Ver todos")
  closeButton.addEventListener('click', showAllProducts);

  // Cerrar modal al hacer clic fuera (mismo comportamiento que "Ver todos")
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      showAllProducts();
    }
  });

  // Cerrar modal con tecla Escape (mismo comportamiento que "Ver todos")
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      showAllProducts();
    }
  });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  // Crear y abrir el modal al cargar la página
  openLocationModal();

  // Añadir ícono de ubicación
  const locationIcon = document.createElement('button');
  locationIcon.className = 'location-icon';
  locationIcon.innerHTML = '<span class="material-icons">location_on</span>';
  document.body.appendChild(locationIcon);

  // Manejar clic en el ícono de ubicación
  locationIcon.addEventListener('click', openLocationModal);
});

// Exportar variables para usar en otros archivos
export { selectedDepartamento, selectedCiudad };