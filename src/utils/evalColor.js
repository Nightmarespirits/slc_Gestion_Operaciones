export const evalColor = color => {
  switch (color.toLowerCase()) {
      case 'rojo':
          return 'red';
      case 'verde':
          return 'green'
      case 'azul':
          return 'indigo'
      case 'amarillo':
          return 'yellow'
      case 'celeste':
            return 'cyan-accent-2'
      case 'blanco':
        return 'white'
      case 'naranja':
        return 'orange-darken-2 '
      case 'purple-darken-1':
        return 'purple'
      case 'rosado':
        return 'pink-lighten-4  '
      case 'ninguno':
            return 'grey-lighten-3'
      default:
          return 'grey-lighten-3'
//'Ninguno','Rojo', 'Verde', 'Azul', 'Amarillo', 'Celeste', 'Blanco', 'Naranja', 'Morado', 'Rosado'
  }
}