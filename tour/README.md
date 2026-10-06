# AR Local v8.6

Portada + cámara de reconocimiento + administración + acceso individual para propietarios de establecimientos.

## Permisos

- Administrador: crea y administra negocios y asigna propietarios.
- Propietario: solo puede ver/editar los negocios que el administrador le haya asignado.
- Público: solo ve negocios activos en la experiencia AR.

Ejecuta `schema_v8_6.sql` en Supabase. Después convierte tu usuario actual en administrador con el UPDATE indicado al final del SQL. Los propietarios pueden registrarse en `/owner/register.html`; después el administrador les asigna su negocio desde `/admin/`.


## v8.9
La ficha reconocida permanece visible aunque el usuario mueva el móvil. Se muestra como tarjeta superpuesta a la cámara, con botones para cerrar o escanear otra imagen.
