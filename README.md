cat > README.md << 'EOF'
# 🗺️ UBIQATE

**Versión:** 1.1  
**Autor:** [@Gonzalo-CR](https://github.com/Gonzalo-CR)  
**Licencia:** MIT  
**Estado:** ✅ Funcional y Mejorado

---

## 🌟 ¿Qué es UBIQATE?

UBIQATE es una herramienta web avanzada para conversión de coordenadas geográficas y planificación de rutas. Combina funcionalidades de geocodificación, conversión entre sistemas de coordenadas y navegación con una interfaz moderna e intuitiva.

---

## 🚀 Características Principales

### 📍 Conversión de Coordenadas
- **Formatos soportados:**
  - 📍 Grados Decimales (DD)
  - 🧭 Grados, Minutos y Segundos (DMS)
  - 🗺️ Coordenadas UTM
  - 🏠 Direcciones físicas
- Conversión bidireccional automática
- Visualización en múltiples formatos simultáneamente

### 🗺️ Sistema de Navegación Avanzado
- **Planificación de rutas con múltiples destinos**
- **Modos de transporte:**
  - 🚗 Vehículo
  - 🚶 A pie
  - 🚴 Bicicleta
- **Instrucciones detalladas** paso a paso por tramos
- **Marcadores diferenciados** para inicio, destinos y waypoints

### 🎯 Funcionalidades de Ubicación
- **📍 Obtención de ubicación actual** con un clic
- **🔍 Búsqueda por dirección** o coordenadas
- **🖱️ Interacción con mapa** - clic para obtener coordenadas
- **🔄 Geocodificación directa e inversa**

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Mapas:** [Leaflet.js](https://leafletjs.com/)
- **Coordenadas:** [Proj4js](https://proj4js.org/)
- **Geocodificación:** Nominatim (OpenStreetMap)
- **Rutas:** OSRM (Open Source Routing Machine)
- **Iconos:** Font Awesome 6
- **Diseño:** CSS Grid, Flexbox, Variables CSS

---

## 📱 Cómo Usar

### 🔄 Conversión de Coordenadas (Pestaña 1)
1. Selecciona el tipo de entrada (DD, DMS, UTM o Dirección)
2. Ingresa las coordenadas o dirección
3. Haz clic en **"Convertir y Mostrar"**
4. Los resultados aparecen en todos los formatos
5. La ubicación se marca automáticamente en el mapa

### 🗺️ Planificación de Rutas (Pestaña 2)
1. **Establece el punto de inicio:**
   - Ingresa una dirección y haz clic en **"Buscar"**
   - O usa **"Actual"** para tu ubicación actual
2. **Agrega destinos:**
   - Usa **"Agregar Destino"** para múltiples paradas
   - Busca cada destino individualmente
   - O haz clic directo en el mapa
3. **Selecciona el modo de transporte**
4. **Calcula la ruta** con el botón correspondiente
5. **Sigue las instrucciones** paso a paso

### 🖱️ Interacción con el Mapa
- **Clic en cualquier punto** para obtener coordenadas
- **En pestaña de rutas:** los clics agregan destinos automáticamente
- **Zoom y arrastre** para navegar el mapa


## 🚀 Instalación y Uso

### 🌐 Modo Web (Recomendado)
- **Accede a la versión online en:**  
  https://gonzalo-cr.github.io/UBIQATE_v1/
- **No requiere instalación** - funciona directamente en tu navegador
- **Siempre actualizada** con la última versión

### 💻 Modo Local
1. **Cloná o descargá** este repositorio
   ```bash
   git clone https://github.com/Gonzalo-CR/UBIQATE_V1.git

---

## 📂 Estructura del Proyecto
UBIQATE/
- index.html # Interfaz principal con sistema de pestañas
- styles.css # Estilos modernos y responsive
- script.js # Lógica de aplicación y APIs
- README.md # Documentación

---


### 🏗️ Arquitectura Mejorada
- **Sistema de pestañas** para separar funcionalidades
- **Componentes modulares** en CSS
- **Manejo de estado** para múltiples destinos
- **Eventos dinámicos** para elementos generados

---

## ✨ Novedades en Versión 1.1

### 🎨 Mejoras de Interfaz
- ✅ **Sistema de pestañas** reorganizado
- ✅ **Diseño moderno** con tarjetas y sombras
- ✅ **Iconografía** consistente con Font Awesome
- ✅ **Colores profesionales** y transiciones suaves
- ✅ **Responsive design** mejorado

### 🗺️ Funcionalidades de Ruta
- ✅ **Múltiples destinos** encadenados
- ✅ **Modos de transporte** (vehículo, pie, bicicleta)
- ✅ **Instrucciones por tramos** con iconos
- ✅ **Información de ruta** (distancia, duración)
- ✅ **Marcadores numerados** para waypoints

### 🔧 Características Técnicas
- ✅ **Geolocalización** nativa del navegador
- ✅ **Validación de formularios** mejorada
- ✅ **Manejo de errores** más robusto
- ✅ **Optimización** de código y rendimiento

---

## 🌐 Servicios Externos Utilizados

UBIQATE utiliza los siguientes servicios y librerías:

- **🗺️ [OpenStreetMap](https://www.openstreetmap.org/)** - Mapas base y datos geográficos
- **🧭 [Leaflet.js](https://leafletjs.com/)** - Visualización interactiva de mapas
- **📐 [Proj4js](https://proj4js.org/)** - Conversión entre sistemas de coordenadas
- **🔍 [Nominatim](https://nominatim.org/)** - Geocodificación directa e inversa
- **🛣️ [OSRM](http://project-osrm.org/)** - Cálculo de rutas entre puntos
- **🎨 [Font Awesome](https://fontawesome.com/)** - Iconografía moderna

> ⚠️ **Nota:** Este proyecto respeta las condiciones de uso y atribución de cada servicio. Los mapas incluyen créditos visibles según lo requerido por OpenStreetMap.

---

## 🚧 Próximas Mejoras

- [ ] **Exportación de rutas** (GPX, KML)
- [ ] **Historial de búsquedas**
- [ ] **Waypoints arrastrables** en el mapa
- [ ] **Perfiles de transporte** personalizados
- [ ] **Compartir rutas** por enlace
- [ ] **Modo oscuro**
- [ ] **Soporte multidioma**

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Algunas ideas:

- Mejorar la validación de datos de entrada
- Agregar más formatos de exportación
- Implementar caché para búsquedas frecuentes
- Mejorar la accesibilidad
- Agregar tests unitarios

---

## 📋 Requisitos del Sistema

- **Navegador:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Conexión:** Internet (para APIs de mapas y geocodificación)
- **Permisos:** Geolocalización (opcional, para ubicación actual)

---

## 🇦🇷 Hecho con Orgullo

Desarrollado desde Argentina 🇦🇷 por [Gonzalo-CR](https://github.com/Gonzalo-CR), con enfoque en utilidad práctica, trazabilidad y experiencia de usuario moderna.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

---
**⭐ ¿Te gusta UBIQATE? ¡Dale una estrella al repositorio!**

