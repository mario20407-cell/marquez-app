// lib/catalogo.js — v3.2
// Solo contiene colores y helpers visuales.
// Los productos viven en Supabase y se leen con useCatalogo().

export const CAT_COLORS = {
  'Salados':     { bg: '#E6F1FB', text: '#0C447C' },
  'Pan dulce':   { bg: '#FAEEDA', text: '#633806' },
  'Pasteles':    { bg: '#FBEAF0', text: '#72243E' },
  'Donas':       { bg: '#FCEBEB', text: '#791F1F' },
  'Tortas':      { bg: '#EAF3DE', text: '#27500A' },
  'Rines':       { bg: '#E1F5EE', text: '#085041' },
  'Hojaldre':    { bg: '#F1EFE8', text: '#444441' },
  'Postres':     { bg: '#EEEDFE', text: '#3C3489' },
  'Cheesecakes': { bg: '#FAECE7', text: '#712B13' },
  'Cupcakes':    { bg: '#FBEAF0', text: '#72243E' },
  'Galletas':    { bg: '#EAF3DE', text: '#27500A' },
}

// Construye la ruta pública de la imagen, o null si no hay foto
export const getImagenUrl = (producto) =>
  producto?.img ? `/images/productos/${producto.img}` : null

// La matemática de márgenes/costeo vive en lib/costeo.js
export { calcPrecioMinimo as calcMargenMinimo, validarMargen } from './costeo'
