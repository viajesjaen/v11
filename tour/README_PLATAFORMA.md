# AR Platform · Arquitectura reutilizable

Esta versión separa la plataforma en tres capas para poder reutilizar el mismo motor en otras ciudades o con otros tipos de contenido.

## 1. Motor

Los archivos principales de funcionamiento son `app.js`, `styles.css`, `app.html` y los paneles de administración/propietarios. El motor contiene GPS, navegación, cámara, reconocimiento, fichas, multimedia, rutas guiadas, colaboradores y autenticación.

## 2. Configuración de conexión

`config.js` contiene únicamente la conexión de la instalación con Supabase:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

La Publishable Key está diseñada para aparecer en el frontend; la seguridad real debe estar en RLS/permisos de Supabase. Nunca colocar aquí una `service_role` key ni otros secretos.

## 3. Configuración del proyecto

`project-config.js` define la identidad y el tipo de contenido. Ejemplo actual:

```js
window.APP_PROJECT = {
  id: 'jaen',
  name: 'Descubre Jaén',
  city: 'Jaén',
  title: 'Descubre tu patrimonio',
  description: 'Explora Jaén, descubre sus lugares y déjate guiar hasta ellos.',
  logo: './logo-descubre-jaen.png',
  content: {
    singular: 'Monumento',
    plural: 'Monumentos',
    icon: '🏛️',
    shortDescription: 'Patrimonio y lugares históricos',
    listTitle: 'Descubre lugares históricos',
    cameraHint: 'Enfoca el monumento seleccionado…',
    historyTitle: 'Conoce el monumento'
  }
};
```

## Crear otra ciudad

1. Duplica esta instalación.
2. Copia el mismo motor.
3. Cambia `project-config.js` (por ejemplo, `id: 'ubeda'`, nombre, textos y logo).
4. Cambia `config.js` para apuntar al proyecto Supabase correspondiente.
5. Carga los nuevos contenidos en Supabase.

No es necesario modificar la lógica de GPS, navegación, cámara, reconocimiento o rutas.

## Crear otro tipo de experiencia

También se puede reutilizar el motor con otro vocabulario. Por ejemplo:

```js
content: {
  singular: 'Muestra',
  plural: 'Muestras',
  icon: '🖼️',
  shortDescription: 'Piezas y elementos de la exposición',
  listTitle: 'Descubre las muestras',
  cameraHint: 'Enfoca la muestra seleccionada…',
  historyTitle: 'Conoce la muestra'
}
```

El sistema seguirá utilizando internamente la estructura de datos actual (`businesses`) para mantener compatibilidad con la instalación existente. Esa capa interna podrá renombrarse/refactorizarse más adelante si se decide convertir la base de datos en un modelo completamente multi-proyecto.

## Siguiente fase recomendada

Una vez comprobada esta separación, el siguiente paso es proteger el motor: minificación + ofuscación conservadora de JavaScript, manteniendo `project-config.js` y `config.js` como archivos de configuración.
