// Funciones principales del sitio web
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todas las funciones
    initializeNavigation();
    initializeReservationForm();
    initializeScrollEffects();
    initializeMobileMenu();
    initializeGoogleAnalytics();
    
    // Configurar fecha mínima para reservas
    setMinimumDate();
});

// Navegación suave
function initializeNavigation() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Tracking para Google Analytics
                gtag('event', 'navigation_click', {
                    'section': this.getAttribute('href').substring(1),
                    'link_text': this.textContent
                });
            }
        });
    });
}

// Función para scroll suave a sección específica
function scrollToSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = target.offsetTop - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // Tracking para Google Analytics
        gtag('event', 'cta_click', {
            'button_text': 'Reservar Mesa',
            'target_section': sectionId
        });
    }
}

// Menú móvil
function initializeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
            
            // Tracking para Google Analytics
            gtag('event', 'mobile_menu_toggle', {
                'menu_state': navMenu.classList.contains('active') ? 'open' : 'closed'
            });
        });
        
        // Cerrar menú al hacer clic en un enlace
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            });
        });
    }
}

// Configurar fecha mínima para reservas
function setMinimumDate() {
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const formattedDate = tomorrow.toISOString().split('T')[0];
        fechaInput.setAttribute('min', formattedDate);
    }
}

// Manejo del formulario de reservas
function initializeReservationForm() {
    const form = document.getElementById('reservationForm');
    
    if (form) {
        form.addEventListener('submit', handleReservationSubmit);
        
        // Validación en tiempo real
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    }
}

// Validación de campos individuales
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Remover errores previos
    clearFieldError(event);
    
    let isValid = true;
    let errorMessage = '';
    
    switch (field.type) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Por favor ingresa un email válido';
            }
            break;
            
        case 'tel':
            const phoneRegex = /^[+]?[\d\s\-\(\)]{9,15}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Por favor ingresa un teléfono válido';
            }
            break;
            
        case 'date':
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate <= today) {
                isValid = false;
                errorMessage = 'La fecha debe ser posterior a hoy';
            }
            break;
            
        case 'text':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Este campo debe tener al menos 2 caracteres';
            }
            break;
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

// Mostrar error en campo específico
function showFieldError(field, message) {
    field.classList.add('error');
    
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        errorElement.style.color = '#721c24';
        errorElement.style.fontSize = '0.9rem';
        errorElement.style.marginTop = '0.5rem';
        errorElement.style.display = 'block';
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

// Limpiar error de campo
function clearFieldError(event) {
    const field = event.target;
    field.classList.remove('error');
    
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

// Envío del formulario de reservas
async function handleReservationSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('.submit-button');
    const statusMessage = document.getElementById('reservationStatus');
    
    // Deshabilitar botón y mostrar loading
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    
    try {
        // Validar todos los campos
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Validaciones adicionales
        if (!validateReservationData(data)) {
            throw new Error('Por favor completa todos los campos correctamente');
        }
        
        // Guardar reserva en localStorage
        let reservas = localStorage.getItem('reservasDelicias');
        reservas = reservas ? JSON.parse(reservas) : [];
        reservas.push(data);
        localStorage.setItem('reservasDelicias', JSON.stringify(reservas));
        
        // Simular envío a API (reemplazar con tu endpoint real)
        const response = await submitReservation(data);
        
        if (response.success) {
            showStatusMessage('¡Reserva enviada exitosamente! Te contactaremos pronto para confirmar.', 'success');
            form.reset();
            
            // Tracking para Google Analytics
            gtag('event', 'reservation_submitted', {
                'date': data.fecha,
                'time': data.hora,
                'guests': data.personas,
                'value': 1
            });
            
            // Enviar evento personalizado a Google Tag Manager
            if (typeof dataLayer !== 'undefined') {
                dataLayer.push({
                    'event': 'reservation_success',
                    'reservation_date': data.fecha,
                    'reservation_time': data.hora,
                    'guests_count': data.personas,
                    'customer_email': data.email
                });
            }
        } else {
            throw new Error(response.message || 'Error al enviar la reserva');
        }
        
    } catch (error) {
        showStatusMessage(error.message, 'error');
        
        // Tracking de errores
        gtag('event', 'reservation_error', {
            'error_message': error.message
        });
    } finally {
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.textContent = 'Confirmar Reserva';
    }
}

// Validar datos de reserva
function validateReservationData(data) {
    const requiredFields = ['nombre', 'email', 'telefono', 'fecha', 'hora', 'personas'];
    
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            return false;
        }
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        return false;
    }
    
    // Validar fecha futura
    const reservationDate = new Date(data.fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (reservationDate <= today) {
        return false;
    }
    
    return true;
}

// Simular envío de reserva (reemplazar con tu API real)
async function submitReservation(data) {
    // Simular llamada a API
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simular respuesta exitosa (90% de las veces)
            const success = Math.random() > 0.1;
            
            if (success) {
                resolve({
                    success: true,
                    message: 'Reserva procesada exitosamente',
                    reservationId: 'RES-' + Date.now()
                });
            } else {
                resolve({
                    success: false,
                    message: 'Error del servidor. Por favor intenta nuevamente.'
                });
            }
        }, 2000);
    });
}

// Mostrar mensaje de estado
function showStatusMessage(message, type) {
    const statusElement = document.getElementById('reservationStatus');
    
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        statusElement.style.display = 'block';
        
        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
        
        // Scroll suave hacia el mensaje
        statusElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Efectos de scroll
function initializeScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observar elementos que queremos animar
    const elementsToObserve = document.querySelectorAll('.menu-item, .gallery-item, .contact-item, .mission, .vision');
    elementsToObserve.forEach(el => observer.observe(el));
}

// Inicializar Google Analytics personalizado
function initializeGoogleAnalytics() {
    // Tracking de clicks en botones importantes
    document.querySelectorAll('[data-gtm-event]').forEach(element => {
        element.addEventListener('click', function() {
            const eventName = this.getAttribute('data-gtm-event');
            const eventData = {};
            
            // Recopilar todos los atributos data-gtm-*
            Array.from(this.attributes).forEach(attr => {
                if (attr.name.startsWith('data-gtm-') && attr.name !== 'data-gtm-event') {
                    const key = attr.name.replace('data-gtm-', '');
                    eventData[key] = attr.value;
                }
            });
            
            // Enviar evento a Google Analytics
            gtag('event', eventName, eventData);
            
            // Enviar evento a Google Tag Manager
            if (typeof dataLayer !== 'undefined') {
                dataLayer.push({
                    'event': eventName,
                    ...eventData
                });
            }
        });
    });
    
    // Tracking de scroll depth
    let scrollDepthTracked = {
        25: false,
        50: false,
        75: false,
        90: false
    };
    
    window.addEventListener('scroll', function() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        Object.keys(scrollDepthTracked).forEach(depth => {
            if (scrollPercent >= depth && !scrollDepthTracked[depth]) {
                scrollDepthTracked[depth] = true;
                gtag('event', 'scroll_depth', {
                    'depth': depth + '%'
                });
            }
        });
    });
    
    // Tracking de tiempo en página
    let timeOnPage = 0;
    const startTime = Date.now();
    
    setInterval(() => {
        timeOnPage = Math.round((Date.now() - startTime) / 1000);
        
        // Enviar evento cada 30 segundos
        if (timeOnPage % 30 === 0 && timeOnPage > 0) {
            gtag('event', 'time_on_page', {
                'time_seconds': timeOnPage
            });
        }
    }, 1000);
}

// Función para manejar errores globales
window.addEventListener('error', function(event) {
    gtag('event', 'javascript_error', {
        'error_message': event.message,
        'error_filename': event.filename,
        'error_lineno': event.lineno
    });
});

// Función para detectar si es móvil
function isMobile() {
    return window.innerWidth <= 768;
}

// Función para formatear fecha
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return new Date(date).toLocaleDateString('es-ES', options);
}

// Función para validar horario de atención
function isValidReservationTime(date, time) {
    const reservationDateTime = new Date(`${date} ${time}`);
    const day = reservationDateTime.getDay();
    const hour = reservationDateTime.getHours();
    
    // Verificar que esté dentro del horario de atención (12:00 - 22:00)
    return hour >= 12 && hour <= 22;
}

// Exportar funciones para uso global
window.RestauranteDelicias = {
    scrollToSection,
    isMobile,
    formatDate,
    isValidReservationTime
};