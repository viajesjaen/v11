AR TURISMO v8.9

Versión turística basada en AR Local v8.9.

- Reconocimiento automático de imágenes/elementos patrimoniales mediante OpenCV ORB.
- Ficha persistente superpuesta a la cámara.
- Contenido de cada lugar: historia/información, imágenes, audios y vídeos.
- Galería de imágenes ampliable a pantalla completa.
- Navegación entre imágenes y controles de zoom.
- Gestión desde administración y responsables de lugares.
- Mantiene la misma base de Supabase de AR Local v8.9: businesses + business_media + Storage.

IMPORTANTE:
- Conserva tu config.js actual.
- No es necesario ejecutar un SQL nuevo si ya estás usando el esquema v8.7/v8.8 de multimedia.
- Los campos actuales de businesses se reutilizan con nombres turísticos en la interfaz: category como tipo de recurso, description como historia/información, offer como dato destacado y sponsor como entidad colaboradora.
- La imagen de reconocimiento sigue siendo independiente de la galería.

Visor de imágenes:
- Tocar una imagen abre el visor.
- + / - amplían o reducen.
- 100% restaura el tamaño.
- Flechas cambian de imagen.
- Doble toque/clic alterna entre 100% y 200%.
- ESC cierra el visor.
