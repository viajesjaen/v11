AR TURISMO v9.0

Novedades:
- Editor de texto enriquecido para Historia e información.
- El contenido se guarda en businesses.description como HTML sanitizado.
- Nuevos campos latitude, longitude y navigation_enabled.
- Brújula de orientación hacia el monumento usando ubicación y sensores del móvil.
- Botón para abrir una ruta externa en Google Maps.
- Se mantiene reconocimiento ORB, ficha persistente, multimedia y visor de imágenes.

IMPORTANTE: ejecutar schema_v9_0.sql en Supabase antes de utilizar las coordenadas y la navegación.
La brújula requiere HTTPS (GitHub Pages cumple) y puede solicitar permisos de ubicación y orientación según el navegador.


VERSIÓN 9.1
Flujo de navegación actualizado: lista inicial de monumentos ordenada por distancia, selección de destino, brújula previa al escaneo y activación de cámara al llegar.
