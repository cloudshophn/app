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
    const modal = document.getElementById('orderVerificationModal');
    const exitButton = document.getElementById('exitOrderModal');
    const verificationForm = document.getElementById('orderVerificationForm');
    const personalIdInput = document.getElementById('orderPersonalId');
    const orderNumberInput = document.getElementById('orderNumber');
    const errorMessage = document.getElementById('errorMessage');
    const detailsContainer = document.getElementById('detailsContainer');
    const viewDetailsButton = document.getElementById('viewDetailsButton');

    // Función para formatear el número de identidad (XXXX-XXXX-XXXXX)
    function formatPersonalId(value) {
        // Limpiar todo lo que no sea número
        const cleaned = value.replace(/\D/g, '');
        // Limitar a 13 dígitos
        const limited = cleaned.slice(0, 13);
        // Aplicar formato: XXXX-XXXX-XXXXX
        let formatted = '';
        for (let i = 0; i < limited.length; i++) {
            if (i === 4 || i === 8) {
                formatted += '-';
            }
            formatted += limited[i];
        }
        return formatted;
    }

    // Listener para formatear el número de identidad mientras se escribe
    personalIdInput.addEventListener('input', (e) => {
        const cursorPosition = e.target.selectionStart;
        const oldValue = e.target.value;
        const cleanedValue = oldValue.replace(/\D/g, '');
        const newValue = formatPersonalId(cleanedValue);

        e.target.value = newValue;

        // Ajustar la posición del cursor
        let newCursorPosition = cursorPosition;
        if (cleanedValue.length > oldValue.replace(/\D/g, '').length) {
            // Se añadió un carácter no numérico, ajustar cursor
            newCursorPosition = cursorPosition;
        } else if (newValue.length > oldValue.length) {
            // Se añadió un guion, mover el cursor después del guion
            if (newValue[cursorPosition - 1] === '-') {
                newCursorPosition = cursorPosition + 1;
            }
        } else if (newValue.length < oldValue.length) {
            // Se borró un guion, ajustar el cursor antes
            if (oldValue[cursorPosition] === '-') {
                newCursorPosition = cursorPosition - 1;
            }
        }
        e.target.setSelectionRange(newCursorPosition, newCursorPosition);
    });

    // Listener para formatear el número de orden mientras se escribe
    orderNumberInput.addEventListener('input', (e) => {
        const cleanedValue = e.target.value.replace(/\D/g, '');
        e.target.value = cleanedValue.slice(0, 8); // Limitar a 8 dígitos
    });

    // Abrir el modal al cargar la página
    modal.classList.add('open');

    // Cerrar la página al hacer clic en "Salir"
    exitButton.addEventListener('click', () => {
        window.location.href = '/'; // Redirigir a la página principal
    });

    // Función para validar las credenciales del pedido
    async function validateOrderCredentials(orderNumber, personalId) {
        try {
            // Validar que el número de orden tenga exactamente 8 dígitos
            if (orderNumber.length !== 8) {
                return { 
                    success: false, 
                    error: 'El número de orden debe tener exactamente 8 dígitos' 
                };
            }
            
            // Referencia a la orden específica en myorderdetails
            const orderRef = ref(db, `myorderdetails/${orderNumber}`);
            const snapshot = await get(orderRef);
            
            if (snapshot.exists()) {
                const orderData = snapshot.val();
                // Comparar el ID personal (sin guiones para la comparación)
                const storedPersonalId = orderData.customer?.personalId || '';
                const cleanedStoredId = storedPersonalId.replace(/-/g, '');
                const cleanedInputId = personalId.replace(/-/g, '');
                
                if (cleanedStoredId === cleanedInputId) {
                    return { 
                        success: true, 
                        orderData: orderData,
                        orderNumber: orderNumber
                    };
                } else {
                    return { 
                        success: false, 
                        error: 'El número de identidad no coincide con la orden' 
                    };
                }
            } else {
                return { 
                    success: false, 
                    error: 'No se encontró la orden con ese número' 
                };
            }
        } catch (error) {
            console.error('Error al validar la orden:', error);
            return { 
                success: false, 
                error: 'Error al conectar con la base de datos' 
            };
        }
    }

    // Manejar el envío del formulario (Confirmar)
    verificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const personalId = personalIdInput.value.trim();
        const orderNumber = orderNumberInput.value.trim();
        
        // Validaciones básicas
        if (!personalId || !orderNumber) {
            showError('Por favor, complete todos los campos');
            return;
        }
        
        if (personalId.replace(/\D/g, '').length !== 13) {
            showError('El número de identidad debe tener 13 dígitos');
            return;
        }
        
        // Validar que el número de orden tenga exactamente 8 dígitos
        if (orderNumber.length !== 8) {
            showError('El número de orden debe tener exactamente 8 dígitos');
            return;
        }
        
        // Ocultar mensaje de error previo
        errorMessage.style.display = 'none';
        
        // Mostrar indicador de carga
        const submitButton = verificationForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando...';
        submitButton.disabled = true;
        
        try {
            // Validar credenciales
            const validationResult = await validateOrderCredentials(orderNumber, personalId);
            
            if (validationResult.success) {
                // Credenciales válidas - cerrar modal y mostrar botón de detalles
                modal.classList.remove('open');
                detailsContainer.style.display = 'block';
                
                // Guardar información de la orden para usar en el PDF
                sessionStorage.setItem('validatedOrder', JSON.stringify({
                    orderNumber: validationResult.orderNumber,
                    orderData: validationResult.orderData
                }));
                
            } else {
                // Credenciales inválidas - mostrar error
                showError(validationResult.error);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al verificar la orden. Intente nuevamente.');
        } finally {
            // Restaurar botón
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    });

    // Función para mostrar mensajes de error
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    // Configurar el botón de ver detalles (para generar PDF)
    viewDetailsButton.addEventListener('click', () => {
        const orderInfo = JSON.parse(sessionStorage.getItem('validatedOrder'));
        if (orderInfo) {
            generateOrderPDF(orderInfo.orderNumber, orderInfo.orderData);
        } else {
            showError('No se encontró información de la orden');
            detailsContainer.style.display = 'none';
            modal.classList.add('open');
        }
    });

    // Función para generar PDF (placeholder - implementar después)
    // Función para generar PDF con los detalles de la orden
async function generateOrderPDF(orderNumber, orderData) {
    // Inicializar jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración inicial
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;
    
    // Obtener nombres de productos desde Firebase
    const productNames = await getProductNames(orderData.products);
    
    // ===== ENCABEZADO =====
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(59, 130, 246); // Azul
    doc.text("CloudShop", pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0); // Negro
    doc.text("San Pedro Sula, Cortés, Honduras", pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text("cloudshophn@gmail.com", pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text("+504 8811-8862", pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Aclaración de no factura
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 0, 0); // Rojo
    doc.text("ESTO NO ES UNA FACTURA", pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    // Título
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Negro
    doc.text("Detalles de su compra", pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    // ===== DATOS DEL CLIENTE =====
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("DATOS DEL CLIENTE", margin, yPosition);
    yPosition += 10;
    
    // Tabla de datos del cliente
    const clientData = [
        ["Nombre:", orderData.customer.fullName || "N/A"],
        ["Número de orden:", orderNumber],
        ["Estado de orden:", orderData.status || "pending"],
        ["Teléfono:", orderData.customer.phoneNumber || "N/A"],
        ["Dirección:", orderData.customer.ubicacionResidencia || "N/A"],
        ["Identidad:", orderData.customer.personalId || "N/A"],
        ["Fecha:", formatDate(orderData.timestamp)],
        ["Método de pago:", orderData.method || "efectivo"]
    ];
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    clientData.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, margin, yPosition);
        doc.setFont(undefined, 'normal');
        
        // Dividir valores largos en múltiples líneas
        const maxWidth = 80;
        const lines = doc.splitTextToSize(value, maxWidth);
        
        if (lines.length > 1) {
            doc.text(lines[0], margin + 40, yPosition);
            for (let i = 1; i < lines.length; i++) {
                yPosition += 5;
                doc.text(lines[i], margin + 40, yPosition);
            }
            yPosition += 7;
        } else {
            doc.text(value, margin + 40, yPosition);
            yPosition += 7;
        }
    });
    
    yPosition += 10;
    
    // ===== TABLA DE PRODUCTOS =====
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("DETALLES DE PRODUCTOS", margin, yPosition);
    yPosition += 15;
    
    // Preparar datos para la tabla
    const tableData = [];
    let subtotal = 0;
    let totalShipping = 0;
    
    Object.entries(orderData.products).forEach(([proid, product]) => {
        const productName = productNames[proid] || `Producto ${proid}`;
        const price = product.price || 0;
        const quantity = product.quantity || 0;
        const productSubtotal = price * quantity;
        const shipping = product.deliveryCost || 0;
        
        subtotal += productSubtotal;
        totalShipping += shipping;
        
        tableData.push([
            productName,
            quantity.toString(),
            `L ${price.toFixed(2)}`,
            "L 0.00", // Impuestos (siempre 0 según tu código)
            `L ${productSubtotal.toFixed(2)}`
        ]);
    });
    
    // Crear tabla con AutoTable
    doc.autoTable({
        startY: yPosition,
        head: [['Producto', 'Cantidad', 'Precio', 'Impuesto', 'Subtotal']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 70 }, // Producto
            1: { cellWidth: 20 }, // Cantidad
            2: { cellWidth: 30 }, // Precio
            3: { cellWidth: 30 }, // Impuesto
            4: { cellWidth: 30 }  // Subtotal
        }
    });
    
    // Obtener la posición Y después de la tabla
    yPosition = doc.lastAutoTable.finalY + 10;
    
    // ===== TOTALES =====
    const total = subtotal + totalShipping;
    
    const totalsData = [
        ["Subtotal:", `L ${subtotal.toFixed(2)}`],
        ["Descuento:", "L 0.00"], // Siempre 0 según la estructura
        ["Envío:", `L ${totalShipping.toFixed(2)}`],
        ["Total:", `L ${total.toFixed(2)}`]
    ];
    
    // Tabla de totales
    doc.autoTable({
        startY: yPosition,
        body: totalsData,
        theme: 'grid',
        styles: {
            fontSize: 10,
            cellPadding: 3
        },
        bodyStyles: {
            fillColor: [240, 240, 240]
        },
        columnStyles: {
            0: { cellWidth: 30, fontStyle: 'bold' },
            1: { cellWidth: 30, fontStyle: 'bold', halign: 'right' }
        }
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;
    
    // ===== COMENTARIOS Y NOTAS =====
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text("Comentarios:", margin, yPosition);
    yPosition += 7;
    
    doc.setFont(undefined, 'normal');
    const comments = "Gracias por su compra. Para consultas contacte a cloudshophn@gmail.com";
    const commentLines = doc.splitTextToSize(comments, pageWidth - 2 * margin);
    doc.text(commentLines, margin, yPosition);
    yPosition += commentLines.length * 5 + 10;
    
    // Nota legal
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const legalText = "**Nota: Este documento no es una factura oficial y no tiene validez fiscal. " +
                     "Su finalidad es únicamente informativa, mostrando los detalles de su compra. " +
                     "Conserve este comprobante para cualquier referencia o consulta sobre su pedido.";
    
    const legalLines = doc.splitTextToSize(legalText, pageWidth - 2 * margin);
    doc.text(legalLines, margin, yPosition);
    yPosition += legalLines.length * 4 + 10;
    
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("cloudshophn@gmail.com    +504 8811-8862", pageWidth / 2, yPosition, { align: 'center' });
    
    // Guardar PDF
    doc.save(`compra_${orderNumber}.pdf`);
}

// Función para obtener nombres de productos desde Firebase
async function getProductNames(products) {
    const productNames = {};
    
    try {
        const productosRef = ref(db, 'productsbylocation');
        const snapshot = await get(productosRef);
        const data = snapshot.val() || {};
        
        // Buscar en toda la estructura de productsbylocation
        Object.values(data).forEach(departamento => {
            Object.values(departamento).forEach(ciudad => {
                Object.entries(ciudad).forEach(([proid, productData]) => {
                    if (products[proid]) {
                        productNames[proid] = productData.nombre || `Producto ${proid}`;
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error al obtener nombres de productos:', error);
    }
    
    return productNames;
}

// Función para formatear fecha
function formatDate(timestamp) {
    if (!timestamp) return "N/A";
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-HN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

    // Cerrar el modal con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            window.location.href = '/'; // Redirigir como el botón "Salir"
        }
    });
});