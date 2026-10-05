AR LOCAL v8.2 — GitHub Pages + Supabase

Esta versión corrige el reconocimiento de la v8:
- Los objetivos se cargan desde Supabase Storage.
- Los descriptores ORB se calculan UNA SOLA VEZ al cargar cada imagen.
- La cámara se analiza a menor resolución para mejorar rendimiento.
- Se aplica verificación geométrica mediante homografía/RANSAC.
- El diagnóstico muestra cuántos negocios e imágenes se han preparado y las coincidencias obtenidas.

Mantén tu config.js actual con:
window.APP_CONFIG = {
  SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'TU_PUBLISHABLE_KEY'
};

No uses nunca una Secret key/service_role en el navegador.

IMPORTANTE:
1. Sustituye los archivos de tu repositorio por los de esta carpeta.
2. Conserva tu config.js con tus credenciales reales de Supabase.
3. La cámara necesita HTTPS; GitHub Pages cumple esto.
4. El bucket 'targets' debe ser público para que la web pueda descargar las imágenes objetivo.
5. La tabla businesses debe permitir SELECT de negocios activos para anon.
6. Después de publicar, abre la web y pulsa Activar cámara.
7. El diagnóstico debajo de la cámara indicará si se cargaron los objetivos.

Prueba recomendada:
- Sube una fotografía nítida del cartel como imagen objetivo.
- Enfoca el mismo cartel físico a una distancia que permita verlo casi completo.
- Evita reflejos, desenfoque y movimiento al hacer la primera prueba.

Si el diagnóstico dice 'Cámara OK · 1 objetivo(s) listo(s)', Supabase y la carga de imagen funcionan. Si además aparecen coincidencias, el problema ya no está en Supabase sino en las características de la imagen/escena.


Corrección v8.2: ORB se instancia con el constructor de OpenCV.js y añade compatibilidad con ORB_create si el build lo expone.
