AR TURISMO v11.1 · RUTAS GUIADAS

Basada en v11.0.

NOVEDAD PRINCIPAL
Las rutas pasan a ser recorridos obligatorios y secuenciales.

1. El usuario inicia una ruta.
2. Solo la primera parada queda activa.
3. Las siguientes aparecen bloqueadas.
4. Para completar una parada hay que llegar físicamente al lugar y reconocerlo con la cámara.
5. Al reconocerse, la parada queda marcada como completada y se desbloquea la siguiente.
6. El usuario no puede saltarse una parada desde la ruta.
7. El progreso se guarda en el navegador mediante localStorage para permitir continuar después.
8. Al completar todos los puntos aparece el estado de ruta completada.

BASE DE DATOS
No hay que ejecutar SQL adicional respecto a schema_v11_0.sql. Se incluye schema_v11_1.sql únicamente como referencia documental.

IMPORTANTE
El progreso anónimo es local al navegador/dispositivo. Si posteriormente se quiere asociar el progreso a una cuenta de usuario, podrá añadirse una tabla de progreso vinculada a auth.users.
