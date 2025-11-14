# Sistema de Mensajes Comunitarios

## 📋 Descripción

Sistema de dos pantallas independientes para que los usuarios elijan mensajes predefinidos sobre su visión de San Juan.

## 🎯 Pantallas Creadas

### 1. Pantalla de Selección (`seleccion-mensaje.html`)

**Funcionalidad:**
- Muestra una lista de 13 mensajes predefinidos
- Permite seleccionar **solo uno** mediante click
- Al seleccionar, el mensaje se resalta en celeste
- Botón "CONFIRMAR SELECCIÓN" (deshabilitado hasta que se seleccione un mensaje)
- Al confirmar, genera el objeto: `{ mensajeElegido, nombreUsuario }`

**Archivos:**
- `seleccion-mensaje.html`
- `css/seleccion-mensaje.css`
- `js/seleccion-mensaje.js`

### 2. Pantalla de Visualización (`visualizacion-mensajes.html`)

**Funcionalidad:**
- Muestra todas las palabras de los mensajes elegidos flotando
- Animación continua con efecto de brillo (glow)
- Las palabras se mueven lentamente y rebotan en los bordes
- Contador de mensajes compartidos
- Usa p5.js para la visualización

**Archivos:**
- `visualizacion-mensajes.html`
- `css/visualizacion-mensajes.css`
- `js/visualizacion-mensajes.js`

## 🚀 Cómo Usar

### Para Debuggear la Pantalla de Selección:

1. Abrir en el navegador: `seleccion-mensaje.html`
2. Hacer click en cualquier mensaje de la lista
3. El mensaje se resaltará en celeste
4. Click en "CONFIRMAR SELECCIÓN"
5. Ver en la consola el objeto generado:
   ```javascript
   {
     mensajeElegido: "Un San Juan más verde y sostenible",
     nombreUsuario: "Usuario"
   }
   ```

### Para Debuggear la Pantalla de Visualización:

1. Primero, agregar algunos mensajes desde la pantalla de selección
2. O usar la consola del navegador:
   ```javascript
   agregarMensajePrueba()  // Agrega un mensaje aleatorio
   ```
3. Abrir en el navegador: `visualizacion-mensajes.html`
4. Ver las palabras flotando con animación

## 🛠️ Funciones de Debug (Consola del Navegador)

### En `seleccion-mensaje.html`:
```javascript
limpiarMensajes()  // Elimina todos los mensajes guardados
```

### En `visualizacion-mensajes.html`:
```javascript
agregarMensajePrueba()  // Agrega un mensaje de prueba
limpiarMensajes()       // Elimina todos los mensajes
```

## 💾 Almacenamiento

Los mensajes se guardan en `localStorage` con la clave `mensajesComunitarios`.

**Estructura:**
```javascript
[
  {
    mensajeElegido: "Un San Juan más verde y sostenible",
    nombreUsuario: "Juan Pablo"
  },
  {
    mensajeElegido: "La energía que nos impulsa hacia el futuro",
    nombreUsuario: "María"
  }
]
```

## 📝 Mensajes Predefinidos

1. "Un San Juan más verde y sostenible"
2. "La energía que nos impulsa hacia el futuro"
3. "Creciendo con respeto por nuestra tierra"
4. "Un lugar donde la tecnología y la tradición conviven"
5. "Construyendo un mañana mejor entre todos"
6. "San Juan innovador, humano y creativo"
7. "El futuro nace en cada idea"
8. "Un San Juan lleno de oportunidades"
9. "Soñamos grande y avanzamos juntos"
10. "La comunidad que transforma el futuro"
11. "Un San Juan que inspira"
12. "La identidad que evoluciona"
13. "Un San Juan conectado con su gente"

## 🎨 Características de Diseño

- **Fuente Roboto** para textos de usuario y mensajes
- **Fuente Arkitech** para títulos y elementos principales
- **Color principal:** #00D4FF (celeste neón)
- **Efectos:** Glow, animaciones suaves, transiciones
- **Responsive:** Adaptado para diferentes tamaños de pantalla

## 🔄 Flujo de Datos

```
Usuario selecciona mensaje
        ↓
Click en "CONFIRMAR"
        ↓
Objeto { mensajeElegido, nombreUsuario }
        ↓
Guardado en localStorage
        ↓
Pantalla de visualización lee localStorage
        ↓
Muestra palabras flotantes
```

## ⚠️ Notas Importantes

- **NO está integrado** con otras pantallas aún
- **NO usa IA** - solo almacenamiento local
- **Pantallas independientes** para debugging
- El nombre de usuario se obtiene de `localStorage.getItem('userName')`
- Si no hay nombre guardado, usa "Usuario" por defecto

## 🧪 Testing Rápido

1. Abrir `seleccion-mensaje.html`
2. Seleccionar 3-4 mensajes diferentes (uno por vez, confirmando cada uno)
3. Abrir `visualizacion-mensajes.html`
4. Ver las palabras flotando
5. Usar `limpiarMensajes()` en consola para resetear
