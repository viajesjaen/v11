AR Turismo v9.7

- Carga principal de businesses mediante REST directo de Supabase.
- La lista no depende de geolocalización.
- Solicita ubicación explícitamente al terminar de cargar la lista.
- Mantiene watchPosition para actualizar la ubicación mientras el usuario se desplaza.
- Si el permiso de ubicación se deniega, la lista sigue funcionando.
- Navegación por brújula antes del escaneo.
- Reconocimiento AR del monumento seleccionado.
- Multimedia e historia enriquecida.

IMPORTANTE: publicar en HTTPS (GitHub Pages). La solicitud de ubicación la realiza el navegador mediante getCurrentPosition y después watchPosition.
