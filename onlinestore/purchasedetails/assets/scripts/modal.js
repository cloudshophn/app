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
        const cleaned = value.replace(/\D/g, '');
        const limited = cleaned.slice(0, 13);
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

        let newCursorPosition = cursorPosition;
        if (cleanedValue.length > oldValue.replace(/\D/g, '').length) {
            newCursorPosition = cursorPosition;
        } else if (newValue.length > oldValue.length) {
            if (newValue[cursorPosition - 1] === '-') {
                newCursorPosition = cursorPosition + 1;
            }
        } else if (newValue.length < oldValue.length) {
            if (oldValue[cursorPosition] === '-') {
                newCursorPosition = cursorPosition - 1;
            }
        }
        e.target.setSelectionRange(newCursorPosition, newCursorPosition);
    });

    // Listener para formatear el número de orden mientras se escribe
    orderNumberInput.addEventListener('input', (e) => {
        const cleanedValue = e.target.value.replace(/\D/g, '');
        e.target.value = cleanedValue.slice(0, 8);
    });

    // Abrir el modal al cargar la página
    modal.classList.add('open');

    // Cerrar la página al hacer clic en "Salir"
    exitButton.addEventListener('click', () => {
        window.location.href = '/';
    });

    // Función para validar las credenciales del pedido
    async function validateOrderCredentials(orderNumber, personalId) {
        try {
            if (orderNumber.length !== 8) {
                return { 
                    success: false, 
                    error: 'El número de orden debe tener exactamente 8 dígitos' 
                };
            }
            
            const orderRef = ref(db, `myorderdetails/${orderNumber}`);
            const snapshot = await get(orderRef);
            
            if (snapshot.exists()) {
                const orderData = snapshot.val();
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
        
        if (!personalId || !orderNumber) {
            showError('Por favor, complete todos los campos');
            return;
        }
        
        if (personalId.replace(/\D/g, '').length !== 13) {
            showError('El número de identidad debe tener 13 dígitos');
            return;
        }
        
        if (orderNumber.length !== 8) {
            showError('El número de orden debe tener exactamente 8 dígitos');
            return;
        }
        
        errorMessage.style.display = 'none';
        
        const submitButton = verificationForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando...';
        submitButton.disabled = true;
        
        try {
            const validationResult = await validateOrderCredentials(orderNumber, personalId);
            
            if (validationResult.success) {
                modal.classList.remove('open');
                detailsContainer.style.display = 'block';
                
                sessionStorage.setItem('validatedOrder', JSON.stringify({
                    orderNumber: validationResult.orderNumber,
                    orderData: validationResult.orderData
                }));
                
            } else {
                showError(validationResult.error);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al verificar la orden. Intente nuevamente.');
        } finally {
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

    // Función para generar PDF con los detalles de la orden
    async function generateOrderPDF(orderNumber, orderData) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPosition = margin;
        
        // Función para agregar pie de página - CORREGIDA PARA CONSISTENCIA EN TODAS LAS PÁGINAS
        function addFooter(pageNumber, totalPages) {
            const footerY = pageHeight - 25;
            
            doc.setDrawColor(220, 220, 220);
            doc.line(margin, footerY, pageWidth - margin, footerY);
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            
            // Texto de contacto - DIVIDIDO PARA EVITAR DISTORSIÓN
            const contactText = "cloudstophn@gmail.com | +504 8811-8862";
            const contactLines = doc.splitTextToSize(contactText, pageWidth - 2 * margin - 50);
            doc.text(contactLines, margin, footerY + 7);
            
            // Numeración de páginas
            doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, footerY + 7, { align: 'right' });
        }
        
        // Obtener nombres de productos desde Firebase
        const productNames = await getProductNames(orderData.products);
        
        // ===== ENCABEZADO =====
        try {
            doc.addImage(await getLogoBase64(), 'PNG', margin, yPosition, 40, 15);
        } catch (e) {
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(59, 89, 152);
            doc.text("CloudShop", margin, yPosition + 10);
        }
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("San Pedro Sula, Cortés, Honduras", margin, yPosition + 20);
        doc.text("cloudstophn@gmail.com | +504 8811-8862", margin, yPosition + 25);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(59, 89, 152);
        doc.text(`ORDEN #${orderNumber}`, pageWidth - margin, yPosition + 10, { align: 'right' });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Fecha: ${formatDate(orderData.timestamp)}`, pageWidth - margin, yPosition + 20, { align: 'right' });
        
        yPosition += 35;
        
        doc.setDrawColor(59, 89, 152);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text("DETALLES DE COMPRA", pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(255, 87, 34);
        doc.text("DOCUMENTO INFORMATIVO - NO ES UNA FACTURA FISCAL", pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;
        
        // ===== DATOS DEL CLIENTE =====
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(59, 89, 152);
        doc.text("INFORMACIÓN DEL CLIENTE", margin, yPosition);
        yPosition += 8;
        
        doc.setDrawColor(59, 89, 152);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, margin + 70, yPosition);
        yPosition += 10;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        const clientInfoLeft = [
            `Nombre:${orderData.customer.fullName || "N/A"}`,
            `Teléfono:${orderData.customer.phoneNumber || "N/A"}`,
            `Identidad:${orderData.customer.personalId || "N/A"}`
        ];
        
        const clientInfoRight = [
            `Dirección:${orderData.customer.ubicacionResidencia || "N/A"}`,
            `Método de pago:${formatPaymentMethod(orderData.method)}`,
            `Estado:${formatOrderStatus(orderData.status)}`
        ];
        
        let tempY = yPosition;
        clientInfoLeft.forEach(line => {
            doc.setTextColor(40, 40, 40);
            doc.text(line.split(':')[0] + ':', margin, tempY);
            doc.setTextColor(100, 100, 100);
            doc.text(line.split(':')[1], margin + 25, tempY);
            tempY += 7;
        });
        
        tempY = yPosition;
        clientInfoRight.forEach(line => {
            doc.setTextColor(40, 40, 40);
            doc.text(line.split(':')[0] + ':', pageWidth / 2, tempY);
            doc.setTextColor(100, 100, 100);
            doc.text(line.split(':')[1], pageWidth / 2 + 25, tempY);
            tempY += 7;
        });
        
        yPosition = tempY + 15;
        
        if (yPosition > pageHeight - 100) {
            doc.addPage();
            yPosition = margin;
        }
        
        // ===== TABLA DE PRODUCTOS =====
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(59, 89, 152);
        doc.text("DETALLES DE PRODUCTOS", margin, yPosition);
        yPosition += 8;
        
        doc.line(margin, yPosition, margin + 75, yPosition);
        yPosition += 10;
        
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
            
            const maxProductNameLength = 30;
            const productNameLines = doc.splitTextToSize(
                productName, 
                maxProductNameLength
            );
            
            tableData.push([
                { content: productNameLines, styles: { valign: 'middle' } },
                quantity.toString(),
                `L ${price.toFixed(2)}`,
                "L 0.00",
                `L ${productSubtotal.toFixed(2)}`
            ]);
        });
        
        doc.autoTable({
            startY: yPosition,
            head: [
                [
                    { content: 'Producto', styles: { halign: 'left', fillColor: [59, 89, 152] } },
                    { content: 'Cantidad', styles: { halign: 'center', fillColor: [59, 89, 152] } },
                    { content: 'Precio Unit.', styles: { halign: 'right', fillColor: [59, 89, 152] } },
                    { content: 'Impuesto', styles: { halign: 'right', fillColor: [59, 89, 152] } },
                    { content: 'Subtotal', styles: { halign: 'right', fillColor: [59, 89, 152] } }
                ]
            ],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 89, 152],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 3
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 3,
                textColor: [40, 40, 40],
                lineColor: [220, 220, 220],
                lineWidth: 0.25
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            margin: { left: margin, right: margin },
            tableWidth: 'auto',
            columnStyles: {
                0: { cellWidth: 65, halign: 'left' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 30, halign: 'right' },
                4: { cellWidth: 30, halign: 'right' }
            },
            pageBreak: 'auto',
            didDrawPage: (data) => {
                // Aplicar pie de página en cada página después de dibujar
                addFooter(data.pageNumber, doc.internal.getNumberOfPages());
            }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
        
        if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = margin;
        }
        
        // ===== TOTALES =====
        const total = subtotal + totalShipping;
        
        doc.autoTable({
            startY: yPosition,
            body: [
                ["Subtotal", `L ${subtotal.toFixed(2)}`],
                ["Descuento", "L 0.00"],
                ["Costo de envío", `L ${totalShipping.toFixed(2)}`],
                ["TOTAL", `L ${total.toFixed(2)}`]
            ],
            theme: 'plain',
            styles: {
                fontSize: 10,
                cellPadding: 3,
                textColor: [40, 40, 40],
                lineWidth: 0
            },
            columnStyles: {
                0: { cellWidth: 40, fontStyle: 'bold', halign: 'right' },
                1: { cellWidth: 40, fontStyle: 'bold', halign: 'right' }
            },
            margin: { left: pageWidth - margin - 85 },
            willDrawCell: (data) => {
                if (data.row.index === 3) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [245, 247, 250];
                }
            },
            didDrawCell: (data) => {
                if (data.row.index === 3) {
                    doc.setDrawColor(59, 89, 152);
                    doc.setLineWidth(0.5);
                    doc.line(data.cell.x, data.cell.y - 2, data.cell.x + data.cell.width, data.cell.y - 2);
                }
            }
        });
        
        yPosition = doc.lastAutoTable.finalY + 20;
        
        if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = margin;
        }
        
        // ===== INFORMACIÓN ADICIONAL =====
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(59, 89, 152);
        doc.text("INFORMACIÓN ADICIONAL", margin, yPosition);
        yPosition += 8;
        
        doc.setDrawColor(59, 89, 152);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, margin + 80, yPosition);
        yPosition += 10;
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        const thanksText = "Agradecemos su preferencia. Para consultas sobre su pedido, puede contactarnos a través de nuestros canales de atención al cliente.";
        const thanksLines = doc.splitTextToSize(thanksText, pageWidth - 2 * margin);
        doc.text(thanksLines, margin, yPosition);
        yPosition += thanksLines.length * 5 + 8;
        
        if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
        }
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        const legalText = "Este documento es un comprobante de compra informativo y no constituye una factura fiscal. Para cualquier reclamo o consulta, refiérase al número de orden proporcionado. Conserve este documento para sus registros.";
        const legalLines = doc.splitTextToSize(legalText, pageWidth - 2 * margin);
        doc.text(legalLines, margin, yPosition);
        
        // Aplicar pie de página a todas las páginas DESPUÉS DE TODO EL CONTENIDO
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addFooter(i, totalPages);
        }
        
        doc.save(`Orden_${orderNumber}_CloudShop.pdf`);
    }

    // Función para obtener nombres de productos desde Firebase
    async function getProductNames(products) {
        const productNames = {};
        
        try {
            const productosRef = ref(db, 'productsbylocation');
            const snapshot = await get(productosRef);
            const data = snapshot.val() || {};
            
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
    
    // Función para formatear método de pago
    function formatPaymentMethod(method) {
        if (!method) return "N/A";
        
        const methods = {
            'efectivo': 'Efectivo',
            'tarjeta': 'Tarjeta de Crédito/Débito',
            'transferencia': 'Transferencia Bancaria'
        };
        
        return methods[method] || method;
    }
    
    // Función para formatear estado de la orden
    function formatOrderStatus(status) {
        if (!status) return "N/A";
        
        const statuses = {
            'pending': 'Pendiente',
            'processing': 'En Proceso',
            'shipped': 'Enviado',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        };
        
        return statuses[status] || status;
    }
    
    // Función para obtener logo en base64
    async function getLogoBase64() {
        return new Promise((resolve, reject) => {
            reject("No logo available");
        });
    }
});
