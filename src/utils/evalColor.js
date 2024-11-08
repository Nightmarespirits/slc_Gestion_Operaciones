export const evalColor = color => {
  switch (color.toLowerCase()) {
      case 'rojo':
          return 'red';
      case 'verde':
          return 'green'
      case 'azul':
          return 'blue'
      case 'amarillo':
          return 'yellow'
      case 'ninguno':
            return 'withe'
      default:
          return ''

  }
}