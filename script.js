// El San Juan que Quiero - Script principal

document.addEventListener('DOMContentLoaded', function() {
    // Ajuste de escala para diferentes dispositivos
    adjustScale();
    
    // Reajustar en cambio de orientación o tamaño
    window.addEventListener('resize', adjustScale);
    window.addEventListener('orientationchange', adjustScale);
});

function adjustScale() {
    const container = document.querySelector('.main-container');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Referencia de diseño: 1080x1920
    const designWidth = 1080;
    const designHeight = 1920;
    
    // Calcular escala basada en la relación de aspecto
    const scaleX = windowWidth / designWidth;
    const scaleY = windowHeight / designHeight;
    
    // Usar la menor escala para mantener todo visible
    const scale = Math.min(scaleX, scaleY, 1);
    
    // Aplicar transformación si es necesario
    if (windowWidth < designWidth || windowHeight < designHeight) {
        container.style.transform = `scale(${scale})`;
        container.style.transformOrigin = 'center center';
    } else {
        container.style.transform = 'none';
    }
}
