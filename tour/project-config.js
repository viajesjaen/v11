/*
 * AR Platform · Configuración del proyecto
 *
 * Este archivo define la identidad y el tipo de contenido de cada instalación.
 * El motor de la plataforma no debe modificarse al crear una nueva ciudad/proyecto.
 */
window.APP_PROJECT = {
  id: 'jaen',
  name: 'Descubre Jaén',
  city: 'Jaén',
  title: 'Descubre tu patrimonio',
  eyebrow: 'AR TURISMO',
  description: 'Explora Jaén, descubre sus lugares y déjate guiar hasta ellos. Todo desde tu móvil y sin instalar ninguna aplicación.',
  logo: './logo-descubre-jaen.png',

  // Cambia estos valores para reutilizar el mismo motor con otro tipo de contenido.
  content: {
    singular: 'Monumento',
    plural: 'Monumentos',
    icon: '🏛️',
    shortDescription: 'Patrimonio y lugares históricos',
    listTitle: 'Descubre lugares históricos',
    cameraHint: 'Enfoca el monumento seleccionado…',
    historyTitle: 'Conoce el monumento'
  },

  collaborators: {
    title: 'Empresas colaboradoras',
    shortDescription: 'Establecimientos y entidades asociadas'
  },

  routes: {
    title: 'Rutas',
    shortDescription: 'Recorridos turísticos guiados'
  }
};
