import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, get, set, runTransaction } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

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

// Cargar datos del carrito desde localStorage
const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
const cartItemsContainer = document.getElementById('cashCartItems');
const subtotalElement = document.getElementById('cashSubtotal');
const shippingElement = document.getElementById('cashShipping');
const taxesElement = document.getElementById('cashTaxes');
const grandTotalElement = document.getElementById('cashGrandTotal');
const emptyCartModal = document.getElementById('emptyCashCartModal');
const countdownElement = document.getElementById('countdown');

// Función para formatear precios
function formatPrice(price) {
  return `L ${parseFloat(price).toFixed(2)}`;
}

// Función para formatear el ID con guiones
function formatPersonalId(input) {
  let value = input.value.replace(/-/g, '');
  value = value.replace(/\D/g, '');
  
  if (value.length > 4) {
    value = value.substring(0, 4) + '-' + value.substring(4);
  }
  if (value.length > 9) {
    value = value.substring(0, 9) + '-' + value.substring(9);
  }
  
  if (value.length > 15) {
    value = value.substring(0, 15);
  }
  
  input.value = value;
}

// Función para formatear la fecha de entrega
function formatDeliveryDate(day) {
  const deliveryDays = [7, 14, 21, 28];
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let deliveryDay = parseInt(day);
  if (!deliveryDays.includes(deliveryDay)) {
    deliveryDay = deliveryDays[0]; // Fallback al primer día disponible
  }
  
  // Encontrar el próximo día de entrega disponible
  let nextDeliveryDay = deliveryDays.find(d => d >= currentDay && d >= deliveryDay);
  let deliveryMonth = currentMonth;
  let deliveryYear = currentYear;
  
  if (!nextDeliveryDay || nextDeliveryDay < deliveryDay) {
    nextDeliveryDay = deliveryDay;
    deliveryMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    deliveryYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  }
  
  return `${nextDeliveryDay} de ${new Date(deliveryYear, deliveryMonth).toLocaleString('es-ES', { month: 'long' })}`;
}

// Función para mostrar el modal y manejar la cuenta regresiva
function showEmptyCartModal() {
  emptyCartModal.classList.add('show');
  document.body.style.overflow = 'hidden';

  let timeLeft = 5;
  countdownElement.textContent = timeLeft;

  const countdown = setInterval(() => {
    timeLeft -= 1;
    countdownElement.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      window.location.href = 'https://cloudshophn.github.io/app/onlinestore';
    }
  }, 1000);
}

// Función para obtener datos del producto desde Firebase
async function getProductData(proid) {
  try {
    const productosRef = ref(db, 'productsbylocation');
    const snapshot = await get(productosRef);
    const data = snapshot.val() || {};

    let productData = null;
    Object.values(data).forEach(departamento => {
      Object.values(departamento).forEach(ciudad => {
        if (ciudad[proid]) {
          productData = ciudad[proid];
          productData.proid = proid;
        }
      });
    });

    return productData;
  } catch (error) {
    console.error('Error al obtener datos del producto:', error);
    return null;
  }
}

// Función para calcular el costo de entrega anticipada basado en el subtotal de productos con entrega anticipada
function calculateAnticipatedDeliveryCost(subtotal) {
  if (subtotal <= 1000) return subtotal * 0.09;
  if (subtotal <= 7500) return subtotal * 0.08;
  if (subtotal <= 15000) return subtotal * 0.07;
  if (subtotal <= 30000) return subtotal * 0.06;
  if (subtotal <= 50000) return subtotal * 0.05;
  return subtotal * 0.04;
}

// Renderizar lista de compras y actualizar totales
async function renderCartItems() {
  console.log('CartItems:', cartItems); // Depuración
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
  let deliveryDate = '';
  const anticipatedDeliveryItems = cartItems.filter(item => item.immediateDelivery);
  const numAnticipatedItems = anticipatedDeliveryItems.length;

  // Calcular subtotal de todos los productos
  cartItems.forEach(item => {
    const priceNum = parseFloat(item.price) || 0;
    const itemSubtotal = priceNum * item.quantity;
    subtotal += itemSubtotal;
  });

  // Calcular subtotal solo de productos con entrega anticipada
  let anticipatedSubtotal = 0;
  anticipatedDeliveryItems.forEach(item => {
    const priceNum = parseFloat(item.price) || 0;
    anticipatedSubtotal += priceNum * item.quantity;
  });

  // Calcular costo total de entrega anticipada basado en el subtotal de productos con entrega anticipada
  const totalDeliveryCost = numAnticipatedItems > 0 ? calculateAnticipatedDeliveryCost(anticipatedSubtotal) : 0;
  const deliveryCostPerItem = numAnticipatedItems > 0 ? totalDeliveryCost / numAnticipatedItems : 0;
  shipping = totalDeliveryCost;

  for (const item of cartItems) {
    const priceNum = parseFloat(item.price) || 0;
    const itemSubtotal = priceNum * item.quantity;
    const itemDeliveryCost = item.immediateDelivery ? deliveryCostPerItem : 0;

    // Obtener fechaEntrega desde Firebase
    const productData = await getProductData(item.proid);
    const itemDeliveryDate = productData && productData.fechaEntrega 
      ? formatDeliveryDate(productData.fechaEntrega) 
      : 'No especificada';

    // Si no hay deliveryDate general, tomar la del primer ítem
    if (!deliveryDate) {
      deliveryDate = itemDeliveryDate;
    }

    const itemElement = document.createElement('div');
    itemElement.className = 'cash-cart-item';
    itemElement.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="cash-cart-details">
        <h3>${item.name}</h3>
        <p><strong>ProID:</strong> ${item.proid}</p>
        <p><strong>Precio:</strong> ${formatPrice(item.price)}</p>
        <p><strong>Cantidad:</strong> ${item.quantity}</p>
        ${item.immediateDelivery ? `<p><strong>Entrega anticipada:</strong> Sí (Costo: ${formatPrice(itemDeliveryCost)})</p>` : '<p><strong>Entrega anticipada:</strong> No</p>'}
        <p><strong>Fecha estimada de entrega:</strong> ${itemDeliveryDate}</p>
        <p class="cash-cart-subtotal"><strong>Subtotal:</strong> ${formatPrice(itemSubtotal)}</p>
      </div>
    `;
    cartItemsContainer.appendChild(itemElement);
  }

  const taxes = 0; // Impuestos siempre 0, ya están incluidos
  const grandTotal = subtotal + shipping;

  // Añadir mensaje de entrega estimada
  const deliveryMessage = document.createElement('div');
  deliveryMessage.className = 'delivery-message mt-4 text-gray-700';
  if (numAnticipatedItems > 0) {
    const productList = anticipatedDeliveryItems.map(item => item.name).join(', ');
    const verb = numAnticipatedItems > 1 ? 'serán' : 'será';
    deliveryMessage.innerHTML = `<p><strong>Entrega estimada:</strong> La entrega estimada será el ${deliveryDate}. El producto ${productList} ${verb} entregado${numAnticipatedItems > 1 ? 's' : ''} antes que el resto.</p>`;
  } else {
    deliveryMessage.innerHTML = `<p><strong>Entrega estimada:</strong> La entrega estimada será el ${deliveryDate}.</p>`;
  }
  cartItemsContainer.appendChild(deliveryMessage);

  subtotalElement.textContent = formatPrice(subtotal);
  shippingElement.textContent = formatPrice(shipping);
  taxesElement.textContent = formatPrice(taxes);
  grandTotalElement.textContent = formatPrice(grandTotal);
}

// Ejecutar renderizado al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('CartItems al cargar:', cartItems); // Depuración
  console.log('localStorage cartItems:', localStorage.getItem('cartItems')); // Depuración

  // Verificar si el carrito está vacío
  if (cartItems.length === 0) {
    console.log('Carrito vacío, mostrando modal');
    showEmptyCartModal();
    return;
  }

  // Agregar el event listener para formatear el ID
  const personalIdInput = document.getElementById('personalId');
  if (personalIdInput) {
    personalIdInput.addEventListener('input', function() {
      formatPersonalId(this);
    });
    
    personalIdInput.addEventListener('paste', function(e) {
      setTimeout(() => {
        formatPersonalId(this);
      }, 0);
    });
  }

  renderCartItems();

  // Manejo del formulario de contacto
  const contactForm = document.getElementById('cashContactForm');
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const personalId = document.getElementById('personalId').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const emailReceipt = document.getElementById('emailReceipt').value;
    const ubicacionResidencia = document.getElementById('ubicacionResidencia').value;

    // Validaciones
    if (!fullName.trim()) {
      alert('El nombre completo es obligatorio.');
      return;
    }

    if (!/^[0-9]{4}-[0-9]{4}-[0-9]{5}$/.test(personalId)) {
      alert('El ID debe tener el formato correcto: XXXX-XXXX-XXXXX.');
      return;
    }

    if (!/^[0-9]{8,15}$/.test(phoneNumber)) {
      alert('El número de teléfono debe tener entre 8 y 15 dígitos numéricos.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailReceipt)) {
      alert('Por favor, ingrese un correo electrónico válido.');
      return;
    }

    if (!ubicacionResidencia.trim()) {
      alert('La ubicación de residencia es obligatoria.');
      return;
    }

    // Crear estructura de la orden
    const orderData = {
      method: 'efectivo',
      customer: {
        fullName: fullName,
        personalId: personalId,
        phoneNumber: phoneNumber,
        emailReceipt: emailReceipt,
        ubicacionResidencia: ubicacionResidencia
      },
      products: {},
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Calcular subtotal de productos con entrega anticipada para costos de entrega
    let anticipatedSubtotal = 0;
    const anticipatedDeliveryItems = cartItems.filter(item => item.immediateDelivery);
    anticipatedDeliveryItems.forEach(item => {
      const priceNum = parseFloat(item.price) || 0;
      anticipatedSubtotal += priceNum * item.quantity;
    });

    const numAnticipatedItems = anticipatedDeliveryItems.length;
    const totalDeliveryCost = numAnticipatedItems > 0 ? calculateAnticipatedDeliveryCost(anticipatedSubtotal) : 0;
    const deliveryCostPerItem = numAnticipatedItems > 0 ? totalDeliveryCost / numAnticipatedItems : 0;

    // Obtener datos de productos desde Firebase para la orden
    for (const item of cartItems) {
      const productData = await getProductData(item.proid);
      if (productData) {
        const basePrice = parseFloat(productData.precio) || 0;
        const commission = parseFloat(productData.comision) || 0;
        const priceWithCommission = basePrice + (basePrice * commission);
        const itemDeliveryCost = item.immediateDelivery ? deliveryCostPerItem : 0;
        const itemDeliveryDate = productData && productData.fechaEntrega 
          ? formatDeliveryDate(productData.fechaEntrega) 
          : 'No especificada';

        orderData.products[item.proid] = {
          quantity: item.quantity,
          price: parseFloat(priceWithCommission.toFixed(2)),
          deliveryCost: parseFloat(itemDeliveryCost.toFixed(2)),
          deliveryDate: itemDeliveryDate,
          immediateDelivery: item.immediateDelivery
        };
      }
    }

    console.log('Guardando orden:', orderData); // Depuración

    // Generar número de orden correlativo
    try {
      const counterRef = ref(db, 'ordercash_counter');
      let orderNumber;
      
      await runTransaction(counterRef, (currentCount) => {
        if (currentCount === null) {
          currentCount = 0;
        }
        return currentCount + 1;
      }).then(async (transactionResult) => {
        const count = transactionResult.snapshot.val();
        orderNumber = count.toString().padStart(8, '0'); // Formato: 00000001
        
        // Guardar la orden en ordercash/orders/00000001
        const orderRef = ref(db, `ordercash/orders/${orderNumber}`);
        await set(orderRef, orderData);
        
        // Replicar la orden en myorderdetails/00000001
        const orderDetailsRef = ref(db, `myorderdetails/${orderNumber}`);
        await set(orderDetailsRef, orderData);

        // Generar mensaje para WhatsApp
        const message = `Hola, quiero coordinar un pago en efectivo.\nNombre: ${fullName}\nnumero de orden: ${orderNumber}`;
        const whatsappUrl = `https://wa.me/+50488118862?text=${encodeURIComponent(message)}`;

        // Limpiar el carrito
        localStorage.removeItem('cartItems');

        // Redirigir a WhatsApp
        window.location.href = whatsappUrl;
      });
    } catch (error) {
      console.error('Error al generar o guardar la orden:', error);
      alert('Error al procesar la orden. Intenta de nuevo.');
    }
  });
});