let map;
let marker;
let startMarker;
let destinationMarkers = [];
let routeLayer;
let transportMode = 'driving';

document.addEventListener('DOMContentLoaded', (event) => {
    // Configuración de pestañas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Ocultar todas las pestañas
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Desactivar todos los botones de pestaña
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Mostrar la pestaña seleccionada
            document.getElementById(tabId).classList.add('active');
            this.classList.add('active');
        });
    });

    // Configuración de la pestaña de ubicación
    document.getElementById('input-type').addEventListener('change', changeInputType);
    document.getElementById('convert-btn').addEventListener('click', convertAndShow);
    document.getElementById('current-location-btn').addEventListener('click', getCurrentLocation);

    // Configuración de la pestaña de rutas
    document.getElementById('search-start-btn').addEventListener('click', searchStartLocation);
    document.getElementById('current-location-start-btn').addEventListener('click', setCurrentLocationAsStart);
    document.getElementById('add-destination-btn').addEventListener('click', addDestination);
    document.getElementById('calculate-route-btn').addEventListener('click', calculateRoute);
    document.getElementById('clear-route-btn').addEventListener('click', clearRoute);
    
    // Configurar selectores de modo de transporte
    document.querySelectorAll('.transport-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.transport-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            transportMode = this.getAttribute('data-mode');
            
            // Si ya hay una ruta trazada, recalcular con el nuevo modo
            if (startMarker && destinationMarkers.length > 0) {
                calculateRoute();
            }
        });
    });

    initMap();
});

function initMap() {
    map = L.map('map').setView([-34.6037, -58.3816], 13); // Buenos Aires por defecto
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Añadir evento de clic al mapa
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        
        // Dependiendo de la pestaña activa, realizar diferentes acciones
        const activeTab = document.querySelector('.tab-content.active').id;
        
        if (activeTab === 'location-tab') {
            updateOutputs(lat, lon);
            updateMap(lat, lon);
            reverseGeocode(lat, lon);
        } else if (activeTab === 'route-tab') {
            // En la pestaña de rutas, agregar como destino
            addDestinationFromCoords(lat, lon);
        }
    });
}

function changeInputType() {
    const inputType = document.getElementById('input-type').value;
    document.getElementById('dd-input').style.display = 'none';
    document.getElementById('dms-input').style.display = 'none';
    document.getElementById('utm-input').style.display = 'none';
    document.getElementById('address-input').style.display = 'none';
    document.getElementById(`${inputType}-input`).style.display = 'grid';
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // Actualizar la interfaz
                updateOutputs(lat, lon);
                updateMap(lat, lon);
                reverseGeocode(lat, lon);
            },
            error => {
                alert('No se pudo obtener la ubicación actual: ' + error.message);
            }
        );
    } else {
        alert('La geolocalización no es compatible con este navegador.');
    }
}

function setCurrentLocationAsStart() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // Actualizar el campo de dirección inicial
                document.getElementById('start-address').value = "Ubicación actual";
                
                // Establecer como ubicación inicial
                setStartLocation(lat, lon);
            },
            error => {
                alert('No se pudo obtener la ubicación actual: ' + error.message);
            }
        );
    } else {
        alert('La geolocalización no es compatible con este navegador.');
    }
}

function setStartLocation(lat, lon) {
    if (startMarker) {
        map.removeLayer(startMarker);
    }
    
    // Crear un icono personalizado para el punto de inicio
    const startIcon = L.divIcon({
        className: 'start-marker',
        html: '<i class="fas fa-flag"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    
    startMarker = L.marker([lat, lon], {icon: startIcon}).addTo(map)
        .bindPopup('<b>Punto de partida</b>')
        .openPopup();
        
    // Centrar el mapa en el punto de inicio
    map.setView([lat, lon], 13);
}

function searchStartLocation() {
    const address = document.getElementById('start-address').value;
    if (address.trim() === '') {
        alert('Por favor, ingrese una dirección de inicio.');
        return;
    }
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                
                setStartLocation(lat, lon);
                document.getElementById('start-address').value = data[0].display_name;
            } else {
                alert('No se encontró la dirección de inicio.');
            }
        })
        .catch(error => {
            console.error('Error al buscar inicio:', error);
            alert('Error al buscar la dirección de inicio.');
        });
}

function addDestination() {
    const destinationsContainer = document.querySelector('.destinations-container .input-group');
    const newDestination = document.createElement('div');
    newDestination.className = 'destination-item';
    newDestination.innerHTML = `
        <input type="text" class="destination-input" placeholder="Ingrese dirección de destino">
        <div class="destination-buttons">
            <button class="search-destination-btn btn-warning">
                <i class="fas fa-search"></i> Buscar
            </button>
            <button class="remove-destination-btn btn-accent">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    destinationsContainer.appendChild(newDestination);
    
    // Agregar eventos a los nuevos botones
    newDestination.querySelector('.search-destination-btn').addEventListener('click', function() {
        const input = this.parentElement.parentElement.querySelector('.destination-input');
        searchDestination(input);
    });
    
    newDestination.querySelector('.remove-destination-btn').addEventListener('click', function() {
        const destinationItem = this.parentElement.parentElement;
        const index = Array.from(destinationItem.parentElement.children).indexOf(destinationItem) - 1; // -1 porque el primer elemento es el label
        
        // Eliminar el marcador correspondiente si existe
        if (destinationMarkers[index]) {
            map.removeLayer(destinationMarkers[index]);
            destinationMarkers.splice(index, 1);
        }
        
        destinationItem.remove();
        updateDestinationsCount();
    });
    
    updateDestinationsCount();
}

function addDestinationFromCoords(lat, lon) {
    // Primero agregamos un nuevo campo de destino
    addDestination();
    
    // Luego buscamos la dirección para esas coordenadas
    const destinations = document.querySelectorAll('.destination-input');
    const lastDestination = destinations[destinations.length - 1];
    
    reverseGeocodeForDestination(lat, lon, lastDestination);
    
    // Finalmente agregamos el marcador
    addDestinationMarker(lat, lon, destinationMarkers.length);
}

function searchDestination(input) {
    const address = input.value;
    if (address.trim() === '') {
        alert('Por favor, ingrese una dirección de destino.');
        return;
    }
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                
                input.value = data[0].display_name;
                
                // Obtener el índice del destino
                const destinationItems = document.querySelectorAll('.destination-item');
                const index = Array.from(destinationItems).indexOf(input.parentElement);
                
                addDestinationMarker(lat, lon, index);
            } else {
                alert('No se encontró la dirección de destino.');
            }
        })
        .catch(error => {
            console.error('Error al buscar destino:', error);
            alert('Error al buscar la dirección de destino.');
        });
}

function addDestinationMarker(lat, lon, index) {
    // Si ya existe un marcador en esta posición, eliminarlo
    if (destinationMarkers[index]) {
        map.removeLayer(destinationMarkers[index]);
    }
    
    // Crear un icono personalizado para el destino
    const destinationIcon = L.divIcon({
        className: index === 0 && destinationMarkers.length === 0 ? 'destination-marker' : 'waypoint-marker',
        html: `<i class="fas fa-map-marker-alt"></i><span style="position: absolute; top: -5px; right: -5px; background: white; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; display: flex; align-items: center; justify-content: center;">${index + 1}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    
    const marker = L.marker([lat, lon], {icon: destinationIcon}).addTo(map)
        .bindPopup(`<b>Destino ${index + 1}</b>`);
    
    destinationMarkers[index] = marker;
    
    // Ajustar la vista del mapa para incluir todos los marcadores
    if (startMarker) {
        const group = new L.featureGroup([startMarker, ...destinationMarkers]);
        map.fitBounds(group.getBounds().pad(0.1));
    } else {
        const group = new L.featureGroup(destinationMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function reverseGeocodeForDestination(lat, lon, input) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
            input.value = data.display_name;
        });
}

function calculateRoute() {
    if (!startMarker) {
        alert('Por favor, establezca primero un punto de inicio.');
        return;
    }
    
    if (destinationMarkers.length === 0) {
        alert('Por favor, agregue al menos un destino.');
        return;
    }
    
    // Construir la cadena de waypoints para la API de OSRM
    let waypoints = `${startMarker.getLatLng().lng},${startMarker.getLatLng().lat}`;
    
    destinationMarkers.forEach(marker => {
        waypoints += `;${marker.getLatLng().lng},${marker.getLatLng().lat}`;
    });
    
    // Calcular la ruta
    fetch(`https://router.project-osrm.org/route/v1/${transportMode}/${waypoints}?overview=full&geometries=polyline&steps=true`)
        .then(response => response.json())
        .then(data => {
            if (data.routes.length > 0) {
                const route = data.routes[0];
                displayRoute(route);
                displayRouteInstructions(route.legs, route.distance, route.duration);
            } else {
                alert('No se pudo calcular la ruta.');
            }
        })
        .catch(error => {
            console.error('Error al calcular la ruta:', error);
            alert('Error al calcular la ruta.');
        });
}

function displayRoute(route) {
    // Eliminar ruta anterior si existe
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }
    
    // Decodificar la geometría de la ruta
    const routePoints = decodePolyline(route.geometry);
    
    // Definir color según el modo de transporte
    let color;
    switch(transportMode) {
        case 'walking': color = 'green'; break;
        case 'cycling': color = 'orange'; break;
        default: color = 'blue';
    }
    
    // Dibujar la ruta en el mapa
    routeLayer = L.polyline(routePoints, { 
        color: color, 
        weight: 5, 
        opacity: 0.7 
    }).addTo(map);
    
    // Ajustar la vista para mostrar toda la ruta
    map.fitBounds(routeLayer.getBounds());
    
    // Mostrar información de la ruta
    displayRouteInfo(route.distance, route.duration);
}

function displayRouteInfo(distance, duration) {
    const container = document.getElementById('route-info-container');
    const totalDistance = document.getElementById('total-distance');
    const totalDuration = document.getElementById('total-duration');
    
    // Convertir distancia a km y duración a minutos
    const distanceKm = (distance / 1000).toFixed(2);
    const durationMin = Math.round(duration / 60);
    
    totalDistance.textContent = `${distanceKm} km`;
    totalDuration.textContent = `${durationMin} min`;
    
    container.style.display = 'block';
}

function displayRouteInstructions(legs, totalDistance, totalDuration) {
    const container = document.getElementById('route-instructions-container');
    const instructionsEl = document.getElementById('route-instructions');
    
    container.style.display = 'block';
    instructionsEl.innerHTML = '';
    
    // Encabezado con información general
    const header = document.createElement('div');
    header.className = 'instruction-step';
    header.innerHTML = `
        <div class="step-icon"><i class="fas fa-flag-checkered"></i></div>
        <div class="step-text">Ruta completa</div>
        <div class="step-distance">${(totalDistance / 1000).toFixed(2)} km (${Math.round(totalDuration / 60)} min)</div>
    `;
    instructionsEl.appendChild(header);
    
    // Instrucciones para cada tramo de la ruta
    let stepCounter = 0;
    
    legs.forEach((leg, legIndex) => {
        // Encabezado del tramo
        const legHeader = document.createElement('div');
        legHeader.className = 'instruction-step';
        legHeader.style.background = 'rgba(52, 152, 219, 0.1)';
        legHeader.innerHTML = `
            <div class="step-icon"><i class="fas fa-route"></i></div>
            <div class="step-text"><strong>Tramo ${legIndex + 1}</strong></div>
            <div class="step-distance">${(leg.distance / 1000).toFixed(2)} km</div>
        `;
        instructionsEl.appendChild(legHeader);
        
        // Instrucciones paso a paso para este tramo
        leg.steps.forEach((step, stepIndex) => {
            // Saltar el primer paso de cada tramo (excepto el primero) porque es redundante
            if (legIndex > 0 && stepIndex === 0) return;
            
            const stepEl = document.createElement('div');
            stepEl.className = 'instruction-step';
            
            // Obtener icono según el tipo de maniobra
            let icon = 'fas fa-arrow-right';
            if (step.maneuver) {
                switch(step.maneuver.type) {
                    case 'depart': icon = 'fas fa-flag'; break;
                    case 'arrive': icon = 'fas fa-flag-checkered'; break;
                    case 'turn': 
                        if (step.maneuver.modifier) {
                            switch(step.maneuver.modifier) {
                                case 'left': icon = 'fas fa-arrow-turn-left'; break;
                                case 'right': icon = 'fas fa-arrow-turn-right'; break;
                                case 'sharp left': icon = 'fas fa-arrow-turn-down-left'; break;
                                case 'sharp right': icon = 'fas fa-arrow-turn-down-right'; break;
                                case 'slight left': icon = 'fas fa-arrow-turn-up-left'; break;
                                case 'slight right': icon = 'fas fa-arrow-turn-up-right'; break;
                            }
                        }
                        break;
                    case 'continue': icon = 'fas fa-arrow-right'; break;
                    case 'roundabout': icon = 'fas fa-rotate'; break;
                    case 'fork': icon = 'fas fa-code-fork'; break;
                    case 'merge': icon = 'fas fa-arrow-right-arrow-left'; break;
                }
            }
            
            stepEl.innerHTML = `
                <div class="step-icon"><i class="${icon}"></i></div>
                <div class="step-text">${step.maneuver.instruction || 'Continuar'}</div>
                <div class="step-distance">${(step.distance / 1000).toFixed(2)} km</div>
            `;
            instructionsEl.appendChild(stepEl);
            
            stepCounter++;
        });
    });
}

function clearRoute() {
    // Limpiar marcadores de destino
    destinationMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    destinationMarkers = [];
    
    // Limpiar ruta
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }
    
    // Limpiar campos de destino
    const destinationsContainer = document.querySelector('.destinations-container .input-group');
    const destinationItems = destinationsContainer.querySelectorAll('.destination-item');
    destinationItems.forEach(item => {
        item.remove();
    });
    
    // Ocultar contenedores de información
    document.getElementById('route-info-container').style.display = 'none';
    document.getElementById('route-instructions-container').style.display = 'none';
    
    // Restablecer contador de destinos
    updateDestinationsCount();
    
    // Agregar un destino vacío por defecto
    addDestination();
}

function updateDestinationsCount() {
    const count = document.querySelectorAll('.destination-item').length;
    document.getElementById('destinations-count').textContent = count;
}

// Las funciones restantes se mantienen igual que en la versión anterior
function convertAndShow() {
    const inputType = document.getElementById('input-type').value;

    if (inputType === 'address') {
        const address = document.getElementById('address').value;
        geocodeAddress(address);
    } else {
        let lat, lon;
        switch(inputType) {
            case 'dd':
                lat = parseFloat(document.getElementById('dd-lat').value);
                lon = parseFloat(document.getElementById('dd-lon').value);
                break;
            case 'dms':
                lat = dmsToDD(
                    parseFloat(document.getElementById('dms-lat-d').value),
                    parseFloat(document.getElementById('dms-lat-m').value),
                    parseFloat(document.getElementById('dms-lat-s').value),
                    document.getElementById('dms-lat-dir').value
                );
                lon = dmsToDD(
                    parseFloat(document.getElementById('dms-lon-d').value),
                    parseFloat(document.getElementById('dms-lon-m').value),
                    parseFloat(document.getElementById('dms-lon-s').value),
                    document.getElementById('dms-lon-dir').value
                );
                break;
            case 'utm':
                const utmResult = utmToLatLon(
                    parseInt(document.getElementById('utm-zone').value),
                    document.getElementById('utm-hemisphere').value,
                    parseFloat(document.getElementById('utm-easting').value),
                    parseFloat(document.getElementById('utm-northing').value)
                );
                lat = utmResult.latitude;
                lon = utmResult.longitude;
                break;
        }
        updateOutputs(lat, lon);
        updateMap(lat, lon);
        reverseGeocode(lat, lon);
    }
}

function geocodeAddress(address) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                updateOutputs(lat, lon);
                updateMap(lat, lon);
                document.getElementById('address-output').textContent = data[0].display_name;
            } else {
                alert('No se encontró la dirección.');
            }
        });
}

function reverseGeocode(lat, lon) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('address-output').textContent = data.display_name;
        });
}

function updateOutputs(lat, lon) {
    document.getElementById('dd-output').textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    
    // Convertir a DMS
    const dmsLat = ddToDms(lat, true);
    const dmsLon = ddToDms(lon, false);
    document.getElementById('dms-output').textContent = `${dmsLat}, ${dmsLon}`;
    
    // Convertir a UTM
    const utm = latLonToUtm(lat, lon);
    document.getElementById('utm-output').textContent = `${utm.zone}${utm.hemisphere} ${utm.easting.toFixed(0)}E ${utm.northing.toFixed(0)}N`;
}

function updateMap(lat, lon) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker([lat, lon]).addTo(map)
        .bindPopup(`<b>Ubicación</b><br>Lat: ${lat.toFixed(6)}<br>Lon: ${lon.toFixed(6)}`)
        .openPopup();
    map.setView([lat, lon], 13);
}

function decodePolyline(encoded) {
    let points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push([lat / 1E5, lng / 1E5]);
    }

    return points;
}

function dmsToDD(degrees, minutes, seconds, direction) {
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') {
        dd *= -1;
    }
    return dd;
}

function ddToDms(dd, isLat) {
    const absDd = Math.abs(dd);
    const degrees = Math.floor(absDd);
    const minutes = Math.floor((absDd - degrees) * 60);
    const seconds = ((absDd - degrees - minutes / 60) * 3600).toFixed(2);
    
    let direction;
    if (isLat) {
        direction = dd >= 0 ? 'N' : 'S';
    } else {
        direction = dd >= 0 ? 'E' : 'W';
    }
    
    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

function utmToLatLon(zone, hemisphere, easting, northing) {
    const utm = `+proj=utm +zone=${zone} +${hemisphere === 'S' ? 'south' : ''} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
    const wgs84 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
    const [lon, lat] = proj4(utm, wgs84, [easting, northing]);
    return { latitude: lat, longitude: lon };
}

function latLonToUtm(lat, lon) {
    // Implementación simplificada de conversión a UTM
    const zone = Math.floor((lon + 180) / 6) + 1;
    const hemisphere = lat >= 0 ? 'N' : 'S';
    
    // Estas son aproximaciones simplificadas
    const easting = ((lon + 180 - (zone - 1) * 6) * 111319.9).toFixed(0);
    const northing = (lat * 110574).toFixed(0);
    
    return {
        zone: zone,
        hemisphere: hemisphere,
        easting: parseFloat(easting),
        northing: parseFloat(northing)
    };
}

// Inicializar con un destino vacío
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        addDestination();
    }, 100);
});