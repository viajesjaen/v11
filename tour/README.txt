AR LOCAL v8 — GitHub Pages + Supabase

1) Crea un proyecto en Supabase.
2) En SQL Editor ejecuta schema.sql.
3) En Supabase > Authentication > Users crea el usuario administrador con email y contraseña.
4) Copia la URL del proyecto y la Publishable Key desde Settings > API Keys.
5) Edita config.js y sustituye TU-PROYECTO y TU_PUBLISHABLE_KEY.
6) Sube TODO el contenido de esta carpeta a GitHub.
7) Activa GitHub Pages para el repositorio. GitHub Pages publica HTML/CSS/JS y no ejecuta PHP.
8) Abre /admin/ para iniciar sesión.
9) Crea un negocio y sube la fotografía que deberá reconocer la cámara.
10) Abre la página principal y activa la cámara.

NOTA: la v8 es una prueba funcional. El reconocimiento usa OpenCV/ORB para prototipado. Para producción WebAR conviene sustituirlo por un motor de image-target tracking más robusto.

SEGURIDAD: la clave que va en config.js debe ser la Publishable Key, nunca una Secret/service_role key. La seguridad de la base de datos depende de RLS.

AR TURISMO v10.4
----------------
Nueva estructura opcional de colaboradores y patrocinadores.

IMPORTANTE: ejecutar schema_v10_4.sql en Supabase antes de usar el panel de colaboradores.
Los campos sponsor_name y sponsor_url de businesses se mantienen para compatibilidad con datos anteriores.

La v10.4 permite crear colaboradores independientes, asociarlos a uno o varios lugares y definir su rol: patrocinador principal, colaborador o establecimiento recomendado.
