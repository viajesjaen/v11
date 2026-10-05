AR LOCAL v8.8 — Gestor multimedia completo

Incluye: gestor de imágenes, audios y vídeos dentro del panel de administrador y del panel de propietarios; subir, previsualizar, editar título/descripción, publicar/ocultar, ordenar y eliminar.

La ficha pública ya muestra la galería, vídeos y audios activos. Los archivos se almacenan en Supabase Storage y sus metadatos en public.business_media.

Requisitos: haber ejecutado schema_v8_7.sql en Supabase. No es necesario crear otra tabla para v8.8.

Importante: conserva tu config.js actual. Sustituye los archivos de la web por esta versión. Para archivos multimedia, la versión mantiene un límite de 50 MB por archivo. Supabase recomienda cargas reanudables para archivos superiores a 6 MB por mayor fiabilidad.
