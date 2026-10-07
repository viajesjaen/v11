AR TURISMO v9.2
================

Corrección del flujo de destinos y geolocalización.

CAMBIOS PRINCIPALES
-------------------
1. Los monumentos activos se cargan inmediatamente, sin depender del GPS.
2. La lista siempre se muestra aunque el usuario deniegue la ubicación.
3. Al entrar se solicita la ubicación, pero un fallo de GPS no bloquea la aplicación.
4. El botón «Actualizar ubicación» vuelve a solicitar la posición.
5. Se usa getCurrentPosition para la primera posición y watchPosition para mantenerla actualizada.
6. Cuando llega una nueva posición se recalculan las distancias y se reordena la lista.
7. Se muestran mensajes claros de permiso denegado, GPS no disponible o timeout.
8. La navegación conserva la brújula y la actualización de distancia del flujo v9.1.
9. Se mantiene la ficha AR, multimedia, galería ampliable y editor de historia enriquecida.

BASE DE DATOS
-------------
No se necesita SQL nuevo respecto a schema_v9_0.sql.

CONFIGURACIÓN
-------------
Se conserva config.js del proyecto actual. No sustituirlo por una plantilla si ya contiene las credenciales de Supabase.

FLUJO
-----
Monumentos -> ubicación -> ordenar por cercanía -> elegir destino -> brújula -> llegar -> cámara -> reconocimiento -> ficha.

IMPORTANTE
----------
La geolocalización del navegador requiere HTTPS (GitHub Pages lo proporciona) y permiso del usuario.
