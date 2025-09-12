// Cargar datos del carrito desde localStorage
const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
const cartItemsContainer = document.getElementById('cartItems');
const subtotalElement = document.getElementById('subtotal');
const shippingElement = document.getElementById('shipping');
const taxesElement = document.getElementById('taxes');
const grandTotalElement = document.getElementById('grandTotal');
const emptyCartModal = document.getElementById('emptyCartModal');
const countdownElement = document.getElementById('countdown');

// Función para formatear precios
function formatPrice(price) {
  return `L ${parseFloat(price).toFixed(2)}`;
}

// Función para validar la fecha de vencimiento (formato: "MM/AA")
function validateExpiryDate(dateStr) {
  const regex = /^([0-1][0-9])\/([0-9]{2})$/;
  const match = dateStr.match(regex);
  if (!match) return false;

  const month = parseInt(match[1]);
  const year = parseInt(match[2]);
  const currentYear = new Date().getFullYear() % 100; // Últimos 2 dígitos del año actual
  const currentMonth = new Date().getMonth() + 1; // Mes actual (1-12)

  if (month < 1 || month > 12) return false;
  if (year < currentYear || year > currentYear + 10) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

// Función para formatear la entrada de la fecha de vencimiento en tiempo real
function formatExpiryDateInput(input) {
  let value = input.value.replace(/[^0-9]/g, ''); // Solo números
  if (value.length > 2) {
    value = value.slice(0, 2) + '/' + value.slice(2, 4); // Inserta barra después de MM
  }
  input.value = value.slice(0, 5); // Limita a MM/AA (5 caracteres)
}

// Función para prevenir caracteres no numéricos en el campo de fecha
function restrictToNumbers(event) {
  const char = String.fromCharCode(event.keyCode || event.which);
  if (!/[0-9]/.test(char)) {
    event.preventDefault();
  }
}

// Función para mostrar el modal y manejar la cuenta regresiva
function showEmptyCartModal() {
  emptyCartModal.classList.add('show'); // Usar clase 'show' en lugar de remover 'hidden'
  document.body.style.overflow = 'hidden';

  let timeLeft = 5;
  countdownElement.textContent = timeLeft;

  const countdown = setInterval(() => {
    timeLeft -= 1;
    countdownElement.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      window.location.href = '../onlinestore.html';
    }
  }, 1000);
}

// Renderizar lista de compras y actualizar totales
function renderCartItems() {
  cartItemsContainer.innerHTML = '';
  if (cartItems.length === 0) {
    cartItemsContainer.innerHTML = '<p class="text-gray-600">Tu carrito está vacío</p>';
    subtotalElement.textContent = formatPrice(0);
    shippingElement.textContent = formatPrice(0);
    taxesElement.textContent = formatPrice(0);
    grandTotalElement.textContent = formatPrice(0);
    return;
  }

  let subtotal = 0;
  let shipping = 0;

  cartItems.forEach(item => {
    const priceNum = parseFloat(item.price) || 0;
    const deliveryCost = parseFloat(item.deliveryCost) || 0;
    const itemSubtotal = priceNum * item.quantity;
    subtotal += itemSubtotal;
    if (item.immediateDelivery) {
      shipping += deliveryCost; // Suma el costo de entrega una sola vez por producto
    }

    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    itemElement.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-details">
        <h3>${item.name}</h3>
        <p><strong>ProID:</strong> ${item.proid}</p>
        <p><strong>Precio:</strong> ${formatPrice(item.price)}</p>
        <p><strong>Cantidad:</strong> ${item.quantity}</p>
        ${item.immediateDelivery ? `<p><strong>Entrega inmediata:</strong> Sí (Costo: ${formatPrice(item.deliveryCost)})</p>` : '<p><strong>Entrega inmediata:</strong> No</p>'}
        <p class="cart-subtotal"><strong>Subtotal:</strong> ${formatPrice(itemSubtotal)}</p>
      </div>
    `;
    cartItemsContainer.appendChild(itemElement);
  });

  const taxes = 0; // Impuestos siempre 0, ya están incluidos
  const grandTotal = subtotal + shipping;

  subtotalElement.textContent = formatPrice(subtotal);
  shippingElement.textContent = formatPrice(shipping);
  taxesElement.textContent = formatPrice(taxes);
  grandTotalElement.textContent = formatPrice(grandTotal);
}

// Ejecutar renderizado al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si el carrito está vacío
  if (cartItems.length === 0) {
    showEmptyCartModal();
    return;
  }

  renderCartItems();

  // Formatear y restringir fecha de vencimiento
  const expiryDateInput = document.getElementById('expiryDate');
  expiryDateInput.addEventListener('input', () => formatExpiryDateInput(expiryDateInput));
  expiryDateInput.addEventListener('keypress', restrictToNumbers);

  // Manejo del formulario de pago
  const paymentForm = document.getElementById('paymentForm');
  paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const cardNumber = document.getElementById('cardNumber').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const phoneNumber = document.getElementById('phoneNumber').value;

    // Validaciones
    if (!/^[0-9]{16}$/.test(cardNumber)) {
      alert('El número de tarjeta debe tener 16 dígitos numéricos.');
      return;
    }

    if (!validateExpiryDate(expiryDate)) {
      alert('La fecha de vencimiento debe estar en formato MM/AA (e.g., 09/28) y ser una fecha futura válida.');
      return;
    }

    if (!/^[0-9]{3,4}$/.test(cvv)) {
      alert('El CVV debe tener 3 o 4 dígitos numéricos.');
      return;
    }

    if (!/^[0-9]{8,15}$/.test(phoneNumber)) {
      alert('El número de teléfono debe tener entre 8 y 15 dígitos numéricos.');
      return;
    }

    // Aquí puedes agregar la lógica para procesar el pago
    alert('Procesando pago... (Esta es una simulación, implementa la pasarela de pago real aquí)');
  });
});