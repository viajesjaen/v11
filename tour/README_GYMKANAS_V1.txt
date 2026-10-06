GYMKANAS v1 · Descubre Jaén
============================

Esta versión parte de la última versión funcional de Gymkanas.
Rutas, Monumentos y Empresas colaboradoras se mantienen independientes.

Novedades
---------
- Se reutiliza el sistema de autenticación existente de Supabase.
- Se añade el rol de jugador (player) sin eliminar admin/owner.
- El jugador puede iniciar sesión o crear una cuenta desde Gymkanas.
- El progreso y la puntuación pueden guardarse en Supabase.
- Se crea el modelo de Gymkanas y pruebas con tipos: quiz, qr, camera y geolocation.
- La Gymkana de prueba "Jaén de leyenda" queda preparada, inicialmente no publicada.
- La versión conserva un fallback local para poder comprobar la interfaz aunque todavía no se haya aplicado el SQL.

IMPORTANTE: activar la base de datos
-------------------------------------
1. Abre Supabase > SQL Editor.
2. Ejecuta el archivo schema_gymkanas_v1.sql incluido en esta carpeta.
3. Si quieres publicar la gymkana de prueba, ejecuta al final:
   update public.gymkanas set active=true where name='Jaén de leyenda';
4. Recarga la web.

Sobre los usuarios
------------------
El sistema existente ya usa Supabase Auth y public.profiles para admin/owner.
La migración añade el rol player y hace que las cuentas creadas desde la web pública
con metadata role=player se creen como jugadores. Los administradores y propietarios
existentes conservan su funcionamiento.

Siguiente fase
--------------
- Panel de administración para crear/editar Gymkanas y sus pruebas.
- Desbloqueo real por QR.
- Desbloqueo por reconocimiento de imagen/cámara usando los targets existentes.
- Desbloqueo por geolocalización y radio configurable.
- Registro de pruebas y reglas de puntuación.
