document.addEventListener('DOMContentLoaded', function() {
  const whatsappForm = document.getElementById('whatsappForm');
  
  if (whatsappForm) {
    whatsappForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validación básica
      const name = document.getElementById('name');
      const subject = document.getElementById('subject');
      const message = document.getElementById('message');
      const privacy = document.getElementById('privacy');
      
      // Resetear errores
      document.querySelectorAll('.error').forEach(el => el.remove());
      
      let isValid = true;
      
      if (name.value.trim() === '') {
        showError(name, 'Por favor ingresa tu nombre');
        isValid = false;
      }
      
      if (subject.value === '' || subject.value === null) {
        showError(subject, 'Por favor selecciona un motivo');
        isValid = false;
      }
      
      if (message.value.trim() === '') {
        showError(message, 'Por favor escribe tu mensaje');
        isValid = false;
      }
      
      if (!privacy.checked) {
        showError(privacy, 'Debes aceptar las políticas');
        isValid = false;
      }
      
      if (isValid) {
        // Formatear mensaje para WhatsApp
        const phoneNumber = '+50488118862'; // Reemplaza con tu número
        const text = `Hola, soy *${name.value.trim()}*.\n\n` +
                    `*Motivo:* ${subject.value}\n` +
                    `*Mensaje:* ${message.value.trim()}`;
        
        // Codificar para URL
        const encodedText = encodeURIComponent(text);
        
        // Redirigir a WhatsApp
        window.open(`https://wa.me/${phoneNumber}?text=${encodedText}`, '_blank');
      }
    });
  }
  
  function showError(input, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error';
    errorElement.style.color = '#e74c3c';
    errorElement.style.fontSize = '0.8rem';
    errorElement.style.marginTop = '0.25rem';
    errorElement.textContent = message;
    
    // Insertar después del campo
    input.parentNode.insertBefore(errorElement, input.nextSibling);
    
    // Resaltar campo con error
    input.style.borderColor = '#e74c3c';
    
    // Remover error al escribir/seleccionar
    input.addEventListener('input', function() {
      errorElement.remove();
      input.style.borderColor = '#e0e0e0';
    });
  }
});