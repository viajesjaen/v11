AR TURISMO v14.6 - VARIAS IMÁGENES DE REFERENCIA AR

Esta versión permite asociar varias imágenes de referencia a cada monumento/lugar para el reconocimiento por cámara.

1. Ejecuta en Supabase SQL Editor:
   schema_v14_6_referencias_ar.sql

2. En Administración > Lugares y monumentos > Editar:
   - Aparece "Imágenes de referencia AR".
   - Añade varias fotografías (frontal, lateral, detalle, etc.).
   - Puedes ordenarlas, editarlas, ocultarlas/activarlas y eliminarlas.

3. La imagen de referencia antigua del campo "Imagen de referencia para reconocimiento" sigue funcionando como referencia principal, por compatibilidad.

4. El reconocimiento AR compara la cámara contra todas las referencias activas del monumento seleccionado. No se utiliza IA visual.

5. Las imágenes de referencia AR están separadas de la galería pública del monumento.
