AR LOCAL v8.7 — Galería, audios y vídeos

Esta versión parte de v8.6 y añade un editor multimedia para propietarios.

NOVEDADES
- Cada propietario puede gestionar fotografías, audios y vídeos de sus establecimientos asignados.
- Galería pública de fotografías.
- Reproductor de audio.
- Reproductor de vídeo.
- Título y descripción opcionales para cada contenido.
- Eliminación de contenidos desde el panel del propietario.
- Los contenidos se relacionan con el establecimiento y se muestran automáticamente en la ficha pública.
- Tres buckets Supabase separados: media-images, media-audio y media-video.
- Límite de 50 MB por archivo en esta primera versión.

SUPABASE
1. Mantén tu configuración actual.
2. Ejecuta schema_v8_7.sql en Supabase > SQL Editor después de haber ejecutado schema_v8_5.sql.
3. No borres la tabla businesses ni los datos existentes.
4. Los buckets multimedia se crean desde SQL.

NOTA SOBRE VÍDEOS/AUDIOS GRANDES
Esta versión usa la subida estándar de supabase-js por simplicidad. Supabase recomienda subidas reanudables (TUS) para archivos de más de 6 MB por mayor fiabilidad. Para esta fase se limita cada archivo a 50 MB; si vas a trabajar con vídeos promocionales grandes, la siguiente mejora recomendable es incorporar subida TUS con barra de progreso.
