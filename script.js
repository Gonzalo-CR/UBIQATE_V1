        // Variables globales
        let map;
        let currentLocationMarker;
        let routeLayer;
        let waypoints = [];
        let transportMode = 'driving';

        // Inicialización
        document.addEventListener('DOMContentLoaded', (event) => {
            initializeTabs();
            initializeMap();
            initializeEventListeners();
        });

        function initializeTabs() {
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-tab');
                    
                    // Activar pestaña clickeada
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Mostrar contenido correspondiente
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    document.getElementById(`${tabId}-tab`).classList.add('active');
                });
            });
        }

        function initializeMap() {
            map = L.map('map').setView([-34.6037, -58.3816], 13); // Buenos Aires por defecto
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Evento de clic en el mapa
            map.on('click', function(e) {
                const lat = e.latlng.lat;
                const lon = e.latlng.lng;
                
                // Dependiendo de la pestaña activa, hacer diferentes acciones
                const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
                
                if (activeTab === 'location') {
                    // En la pestaña de ubicación, actualizar las coordenadas
                    updateCoordinateInputs(lat, lon);
                    updateOutputs(lat, lon);
                    reverseGeocode(lat, lon);
                    updateMapMarker(lat, lon);
                } else if (activeTab === 'routes') {
                    // En la pestaña de rutas, agregar un waypoint
                    addWaypointFromMap(lat, lon);
                }
            });
        }

        function initializeEventListeners() {
            // Conversor de coordenadas
            document.getElementById('input-type').addEventListener('change', changeInputType);
            document.getElementById('convert-btn').addEventListener('click', convertAndShow);
            document.getElementById('current-location-btn').addEventListener('click', getCurrentLocation);
            
            // Rutas
            document.getElementById('use-current-location').addEventListener('click', useCurrentLocationAsStart);
            document.getElementById('find-start-location').addEventListener('click', findStartLocation);
            document.getElementById('add-waypoint').addEventListener('click', addWaypoint);
            document.getElementById('calculate-route').addEventListener('click', calculateRoute);
            document.getElementById('clear-route').addEventListener('click', clearRoute);
            
            // Selectores de modo de transporte
            document.querySelectorAll('.transport-option').forEach(option => {
                option.addEventListener('click', function() {
                    document.querySelectorAll('.transport-option').forEach(opt => opt.classList.remove('active'));
                    this.classList.add('active');
                    transportMode = this.getAttribute('data-mode');
                });
            });
        }

        // ========== FUNCIONES DE LA PESTAÑA DE UBICACIÓN ==========

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
                        
                        // Actualizar las entradas y salidas
                        updateCoordinateInputs(lat, lon);
                        updateOutputs(lat, lon);
                        updateMapMarker(lat, lon);
                        reverseGeocode(lat, lon);
                        
                        // Mostrar indicador de ubicación actual
                        showLocationBadge('Ubicación actual obtenida correctamente');
                    },
                    error => {
                        alert('No se pudo obtener la ubicación actual: ' + error.message);
                    }
                );
            } else {
                alert('La geolocalización no es compatible con este navegador.');
            }
        }

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
                
                if (isNaN(lat) || isNaN(lon)) {
                    alert('Por favor, ingrese coordenadas válidas.');
                    return;
                }
                
                updateOutputs(lat, lon);
                updateMapMarker(lat, lon);
                reverseGeocode(lat, lon);
            }
        }

        function updateCoordinateInputs(lat, lon) {
            // Actualizar entrada de grados decimales
            document.getElementById('dd-lat').value = lat.toFixed(6);
            document.getElementById('dd-lon').value = lon.toFixed(6);
            
            // Actualizar entrada DMS
            const dmsLat = ddToDmsComponents(lat, true);
            const dmsLon = ddToDmsComponents(lon, false);
            
            document.getElementById('dms-lat-d').value = dmsLat.degrees;
            document.getElementById('dms-lat-m').value = dmsLat.minutes;
            document.getElementById('dms-lat-s').value = dmsLat.seconds.toFixed(2);
            document.getElementById('dms-lat-dir').value = dmsLat.direction;
            
            document.getElementById('dms-lon-d').value = dmsLon.degrees;
            document.getElementById('dms-lon-m').value = dmsLon.minutes;
            document.getElementById('dms-lon-s').value = dmsLon.seconds.toFixed(2);
            document.getElementById('dms-lon-dir').value = dmsLon.direction;
            
            // Actualizar entrada UTM
            const utm = latLonToUtm(lat, lon);
            document.getElementById('utm-zone').value = utm.zone;
            document.getElementById('utm-hemisphere').value = utm.hemisphere;
            document.getElementById('utm-easting').value = utm.easting.toFixed(2);
            document.getElementById('utm-northing').value = utm.northing.toFixed(2);
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

        function updateMapMarker(lat, lon) {
            // Eliminar marcador existente
            if (currentLocationMarker) {
                map.removeLayer(currentLocationMarker);
            }
            
            // Agregar nuevo marcador
            currentLocationMarker = L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b>Ubicación</b><br>Lat: ${lat.toFixed(6)}<br>Lon: ${lon.toFixed(6)}`)
                .openPopup();
            map.setView([lat, lon], 13);
        }

        function geocodeAddress(address) {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lon = parseFloat(data[0].lon);
                        
                        updateCoordinateInputs(lat, lon);
                        updateOutputs(lat, lon);
                        updateMapMarker(lat, lon);
                        document.getElementById('address-output').textContent = data[0].display_name;
                    } else {
                        alert('No se encontró la dirección.');
                    }
                })
                .catch(() => alert('Error al buscar la dirección.'));
        }

        function reverseGeocode(lat, lon) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                .then(response => response.json())
                .then(data => {
                    document.getElementById('address-output').textContent = data.display_name;
                })
                .catch(() => {
                    document.getElementById('address-output').textContent = 'No se pudo obtener la dirección';
                });
        }

        // ========== FUNCIONES DE LA PESTAÑA DE RUTAS ==========

        function useCurrentLocationAsStart() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        
                        // Hacer reverse geocoding para obtener la dirección
                        reverseGeocodeForRoutes(lat, lon, 'start-location');
                        
                        // Mostrar en el mapa
                        updateStartMarker(lat, lon);
                    },
                    error => {
                        alert('No se pudo obtener la ubicación actual: ' + error.message);
                    }
                );
            } else {
                alert('La geolocalización no es compatible con este navegador.');
            }
        }

        function findStartLocation() {
            const address = document.getElementById('start-location').value;
            if (!address) {
                alert('Por favor, ingrese una dirección.');
                return;
            }
            
            geocodeAddressForRoutes(address, 'start-location');
        }

        function geocodeAddressForRoutes(address, target) {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lon = parseFloat(data[0].lon);
                        
                        if (target === 'start-location') {
                            document.getElementById('start-location').value = data[0].display_name;
                            updateStartMarker(lat, lon);
                        } else {
                            // Para waypoints, se maneja de forma diferente
                            return { lat, lon, address: data[0].display_name };
                        }
                    } else {
                        alert('No se encontró la dirección.');
                    }
                })
                .catch(() => alert('Error al buscar la dirección.'));
        }

        function reverseGeocodeForRoutes(lat, lon, target) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                .then(response => response.json())
                .then(data => {
                    if (target === 'start-location') {
                        document.getElementById('start-location').value = data.display_name;
                    }
                })
                .catch(() => {
                    if (target === 'start-location') {
                        document.getElementById('start-location').value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
                    }
                });
        }

        function updateStartMarker(lat, lon) {
            // Eliminar marcador existente si hay uno
            if (window.startMarker) {
                map.removeLayer(window.startMarker);
            }
            
            // Agregar nuevo marcador
            window.startMarker = L.marker([lat, lon], {icon: createCustomIcon('start')}).addTo(map)
                .bindPopup(`<b>Punto de inicio</b><br>${document.getElementById('start-location').value}`)
                .openPopup();
                
            // Centrar el mapa en el punto de inicio
            map.setView([lat, lon], 13);
        }

        function addWaypoint() {
            const waypointsList = document.getElementById('waypoints-list');
            const waypointCount = waypointsList.children.length;
            
            const waypointItem = document.createElement('div');
            waypointItem.className = 'waypoint-item';
            waypointItem.innerHTML = `
                <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
                <input type="text" class="waypoint-input" placeholder="Ingrese dirección o coordenadas">
                <button class="find-waypoint-btn" title="Buscar ubicación"><i class="fas fa-search"></i></button>
                <button class="remove-waypoint" title="Eliminar"><i class="fas fa-times"></i></button>
            `;
            
            waypointsList.appendChild(waypointItem);
            
            // Agregar event listeners a los botones
            const findBtn = waypointItem.querySelector('.find-waypoint-btn');
            const removeBtn = waypointItem.querySelector('.remove-waypoint');
            const input = waypointItem.querySelector('.waypoint-input');
            
            findBtn.addEventListener('click', function() {
                if (input.value) {
                    geocodeAddressForRoutes(input.value, 'waypoint').then(result => {
                        if (result) {
                            input.value = result.address;
                            updateWaypointMarker(result.lat, result.lon, waypointCount);
                        }
                    });
                }
            });
            
            removeBtn.addEventListener('click', function() {
                waypointsList.removeChild(waypointItem);
                // También eliminar el marcador del mapa si existe
                if (window[`waypointMarker${waypointCount}`]) {
                    map.removeLayer(window[`waypointMarker${waypointCount}`]);
                }
            });
        }

        function addWaypointFromMap(lat, lon) {
            const waypointsList = document.getElementById('waypoints-list');
            const waypointCount = waypointsList.children.length;
            
            const waypointItem = document.createElement('div');
            waypointItem.className = 'waypoint-item';
            waypointItem.innerHTML = `
                <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
                <input type="text" class="waypoint-input" value="${lat.toFixed(6)}, ${lon.toFixed(6)}" readonly>
                <button class="find-waypoint-btn" title="Buscar ubicación"><i class="fas fa-search"></i></button>
                <button class="remove-waypoint" title="Eliminar"><i class="fas fa-times"></i></button>
            `;
            
            waypointsList.appendChild(waypointItem);
            updateWaypointMarker(lat, lon, waypointCount);
            
            // Agregar event listeners a los botones
            const removeBtn = waypointItem.querySelector('.remove-waypoint');
            
            removeBtn.addEventListener('click', function() {
                waypointsList.removeChild(waypointItem);
                // También eliminar el marcador del mapa si existe
                if (window[`waypointMarker${waypointCount}`]) {
                    map.removeLayer(window[`waypointMarker${waypointCount}`]);
                }
            });
        }

        function updateWaypointMarker(lat, lon, index) {
            // Eliminar marcador existente si hay uno
            if (window[`waypointMarker${index}`]) {
                map.removeLayer(window[`waypointMarker${index}`]);
            }
            
            // Agregar nuevo marcador
            window[`waypointMarker${index}`] = L.marker([lat, lon], {icon: createCustomIcon('waypoint')}).addTo(map)
                .bindPopup(`<b>Punto de ruta ${index + 1}</b><br>${document.querySelectorAll('.waypoint-input')[index].value}`)
                .openPopup();
        }

        function createCustomIcon(type) {
            let iconUrl, iconSize;
            
            if (type === 'start') {
                // Icono verde para el inicio
                return L.divIcon({
                    html: '<i class="fas fa-play-circle" style="color: green; font-size: 24px;"></i>',
                    className: 'custom-div-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
            } else if (type === 'waypoint') {
                // Icono azul para waypoints
                return L.divIcon({
                    html: '<i class="fas fa-map-marker-alt" style="color: blue; font-size: 24px;"></i>',
                    className: 'custom-div-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
            }
            
            // Por defecto, usar el icono estándar
            return L.Icon.Default();
        }

        function calculateRoute() {
            const startLocation = document.getElementById('start-location').value;
            if (!startLocation) {
                alert('Por favor, establezca una ubicación de inicio.');
                return;
            }
            
            const waypointInputs = document.querySelectorAll('.waypoint-input');
            if (waypointInputs.length === 0) {
                alert('Por favor, agregue al menos un destino.');
                return;
            }
            
            // Obtener coordenadas del punto de inicio
            geocodeAddressForRoutes(startLocation, 'start-location').then(startResult => {
                if (!startResult) return;
                
                const coordinates = [startResult];
                
                // Obtener coordenadas de los waypoints
                const waypointPromises = Array.from(waypointInputs).map(input => {
                    return geocodeAddressForRoutes(input.value, 'waypoint');
                });
                
                Promise.all(waypointPromises).then(waypointResults => {
                    // Filtrar resultados nulos
                    const validWaypoints = waypointResults.filter(result => result !== undefined);
                    
                    if (validWaypoints.length === 0) {
                        alert('No se pudieron encontrar coordenadas válidas para los destinos.');
                        return;
                    }
                    
                    // Combinar inicio y waypoints
                    const allCoordinates = coordinates.concat(validWaypoints);
                    
                    // Calcular ruta
                    getRoute(allCoordinates);
                });
            });
        }

        function getRoute(coordinates) {
            if (routeLayer) {
                map.removeLayer(routeLayer);
            }
            
            // Construir la cadena de coordenadas para la API de OSRM
            const coordsString = coordinates.map(coord => `${coord.lon},${coord.lat}`).join(';');
            
            fetch(`https://router.project-osrm.org/route/v1/${transportMode}/${coordsString}?overview=full&geometries=polyline&steps=true`)
                .then(response => response.json())
                .then(data => {
                    if (data.routes.length > 0) {
                        const route = data.routes[0];
                        const routePoints = decodePolyline(route.geometry);
                        
                        // Definir color según el modo de transporte
                        let color;
                        switch(transportMode) {
                            case 'walking': color = 'green'; break;
                            case 'cycling': color = 'orange'; break;
                            default: color = 'blue';
                        }
                        
                        routeLayer = L.polyline(routePoints, { color: color, weight: 5, opacity: 0.7 }).addTo(map);
                        
                        // Mostrar resumen de ruta
                        const distance = route.distance / 1000; // km
                        const duration = Math.round(route.duration / 60); // minutos
                        
                        document.getElementById('total-distance').textContent = `Distancia: ${distance.toFixed(2)} km`;
                        document.getElementById('total-duration').textContent = `Duración: ${duration} min`;
                        document.getElementById('route-summary').style.display = 'block';
                        
                        // Mostrar instrucciones de ruta
                        displayRouteInstructions(route.legs, distance, duration);
                        
                        // Ajustar el mapa para mostrar toda la ruta
                        map.fitBounds(routeLayer.getBounds());
                    } else {
                        alert('No se pudo calcular la ruta.');
                    }
                })
                .catch(() => alert('Error al calcular la ruta.'));
        }

        function displayRouteInstructions(legs, totalDistance, totalDuration) {
            const instructionsEl = document.getElementById('route-instructions');
            instructionsEl.innerHTML = '';
            
            // Encabezado con información general
            const header = document.createElement('div');
            header.className = 'instruction-step';
            header.innerHTML = `
                <div class="step-icon"><i class="fas fa-flag-checkered"></i></div>
                <div class="step-text">Ruta completa</div>
                <div class="step-distance">${totalDistance.toFixed(2)} km (${totalDuration} min)</div>
            `;
            instructionsEl.appendChild(header);
            
            // Instrucciones paso a paso para cada tramo
            legs.forEach((leg, legIndex) => {
                leg.steps.forEach((step, stepIndex) => {
                    // Omitir el primer paso de cada tramo (excepto el primero) porque es duplicado
                    if (legIndex > 0 && stepIndex === 0) return;
                    
                    const stepEl = document.createElement('div');
                    stepEl.className = 'instruction-step';
                    
                    // Obtener icono según el tipo de maniobra
                    let icon = 'fas fa-arrow-right';
                    if (step.maneuver) {
                        switch(step.maneuver.type) {
                            case 'depart': icon = 'fas fa-flag-checkered'; break;
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
                });
            });
        }

        function clearRoute() {
            // Limpiar waypoints
            document.getElementById('waypoints-list').innerHTML = '';
            waypoints = [];
            
            // Limpiar marcadores de waypoints
            for (let i = 0; i < 10; i++) {
                if (window[`waypointMarker${i}`]) {
                    map.removeLayer(window[`waypointMarker${i}`]);
                }
            }
            
            // Limpiar ruta del mapa
            if (routeLayer) {
                map.removeLayer(routeLayer);
                routeLayer = null;
            }
            
            // Limpiar instrucciones
            document.getElementById('route-instructions').innerHTML = 
                '<p style="text-align: center; color: #777;">Calcule una ruta para ver las instrucciones.</p>';
            document.getElementById('route-summary').style.display = 'none';
        }

        // ========== FUNCIONES DE UTILIDAD ==========

        function showLocationBadge(message) {
            // Podríamos implementar un sistema de notificaciones aquí
            console.log(message);
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

        function ddToDmsComponents(dd, isLat) {
            const absDd = Math.abs(dd);
            const degrees = Math.floor(absDd);
            const minutes = Math.floor((absDd - degrees) * 60);
            const seconds = (absDd - degrees - minutes / 60) * 3600;
            
            let direction;
            if (isLat) {
                direction = dd >= 0 ? 'N' : 'S';
            } else {
                direction = dd >= 0 ? 'E' : 'W';
            }
            
            return { degrees, minutes, seconds, direction };
        }

        function utmToLatLon(zone, hemisphere, easting, northing) {
            const utm = `+proj=utm +zone=${zone} +${hemisphere === 'S' ? 'south' : ''} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
            const wgs84 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
            const [lon, lat] = proj4(utm, wgs84, [easting, northing]);
            return { latitude: lat, longitude: lon };
        }

        function latLonToUtm(lat, lon) {
            // Implementación simplificada de conversión a UTM
            // En una aplicación real, se necesitaría una implementación más completa
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