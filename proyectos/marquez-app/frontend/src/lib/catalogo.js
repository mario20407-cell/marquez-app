// Catálogo completo de Marquéz Panadería & Repostería — 49 productos
export const PRODUCTOS = [
  { n: 'Pico de queso',               p: 20,   pr: 'unidad',    cat: 'Salados' },
  { n: 'Maleta de carne',             p: 35,   pr: 'unidad',    cat: 'Salados' },
  { n: 'Maleta de pollo',             p: 30,   pr: 'unidad',    cat: 'Salados' },
  { n: 'Pastel de piña',              p: 25,   pr: 'unidad',    cat: 'Pasteles' },
  { n: 'Pastel de pollo',             p: 35,   pr: 'unidad',    cat: 'Pasteles' },
  { n: 'Prisionero',                  p: 25,   pr: 'unidad',    cat: 'Pan dulce' },
  { n: 'Empanada de queso',           p: 20,   pr: 'unidad',    cat: 'Salados' },
  { n: 'Churro de queso',             p: 20,   pr: 'unidad',    cat: 'Salados' },
  { n: 'Quesadilla',                  p: 30,   pr: 'unidad',    cat: 'Pan dulce' },
  { n: 'Dona azucarada',              p: 20,   pr: 'unidad',    cat: 'Donas' },
  { n: 'Dona de chocolate',           p: 35,   pr: 'unidad',    cat: 'Donas' },
  { n: 'Dona glaseada',               p: 35,   pr: 'unidad',    cat: 'Donas' },
  { n: 'Trenza frita',                p: 20,   pr: 'unidad',    cat: 'Pan dulce' },
  { n: 'Repollito',                   p: 20,   pr: 'unidad',    cat: 'Pan dulce' },
  { n: 'Repodona',                    p: 35,   pr: 'unidad',    cat: 'Pan dulce' },
  { n: 'Berlinesa',                   p: 35,   pr: 'unidad',    cat: 'Pan dulce' },
  { n: 'Torta de naranja',            p: 35,   pr: 'unidad',    cat: 'Tortas' },
  { n: 'Torta de vainilla',           p: 30,   pr: 'unidad',    cat: 'Tortas' },
  { n: 'Torta de chocolate',          p: 40,   pr: 'unidad',    cat: 'Tortas' },
  { n: 'Rin de vainilla',             p: 150,  pr: 'unidad',    cat: 'Rines' },
  { n: 'Rin de naranja',              p: 160,  pr: 'unidad',    cat: 'Rines' },
  { n: 'Rin de chocolate',            p: 190,  pr: 'unidad',    cat: 'Rines' },
  { n: 'Pañuelo de piña',             p: 30,   pr: 'unidad',    cat: 'Hojaldre' },
  { n: 'Pañuelo dulce de leche',      p: 35,   pr: 'unidad',    cat: 'Hojaldre' },
  { n: 'Bolovan',                     p: 50,   pr: 'unidad',    cat: 'Hojaldre' },
  { n: 'Croissant',                   p: 50,   pr: 'unidad',    cat: 'Hojaldre' },
  { n: 'Flor de hojaldre',            p: 40,   pr: 'unidad',    cat: 'Hojaldre' },
  { n: 'Mil hojas',                   p: 120,  pr: 'unidad',    cat: 'Hojaldre' },
  { n: 'Palmeritas',                  p: 60,   pr: 'unidad',    cat: 'Hojaldre' },
  { n: 'Volteado de piña 2oz',        p: 75,   pr: '2 onz',     cat: 'Postres' },
  { n: 'Volteado de piña 4oz',        p: 170,  pr: '4 onz',     cat: 'Postres' },
  { n: 'Volteado de piña 1/2lb',      p: 320,  pr: '1/2 libra', cat: 'Postres' },
  { n: 'Cheesecake maracuyá porción', p: 120,  pr: 'porción',   cat: 'Cheesecakes' },
  { n: 'Cheesecake maracuyá libra',   p: 1250, pr: 'libra',     cat: 'Cheesecakes' },
  { n: 'Cheesecake fresa porción',    p: 140,  pr: 'porción',   cat: 'Cheesecakes' },
  { n: 'Cheesecake fresa libra',      p: 1300, pr: 'libra',     cat: 'Cheesecakes' },
  { n: 'Cheesecake Oreo libra',       p: 1250, pr: 'libra',     cat: 'Cheesecakes' },
  { n: 'Cheesecake Oreo porción',     p: 120,  pr: 'porción',   cat: 'Cheesecakes' },
  { n: 'Rol de canela',               p: 35,   pr: 'unidad',    cat: 'Pan dulce' },
  { n: 'Chemi',                       p: 25,   pr: 'unidad',    cat: 'Pan dulce' },
  { n: 'Cupcake de vainilla',         p: 25,   pr: 'unidad',    cat: 'Cupcakes' },
  { n: 'Cupcake de chocolate',        p: 30,   pr: 'unidad',    cat: 'Cupcakes' },
  { n: 'Galleta de avena',            p: 20,   pr: 'unidad',    cat: 'Galletas' },
  { n: 'Galleta de mantequilla',      p: 20,   pr: 'unidad',    cat: 'Galletas' },
  { n: 'Galleta margarita',           p: 20,   pr: 'unidad',    cat: 'Galletas' },
  { n: 'Galleta de coco',             p: 35,   pr: 'unidad',    cat: 'Galletas' },
  { n: 'Galleta chocochips',          p: 40,   pr: 'unidad',    cat: 'Galletas' },
  { n: 'Pan pizza',                   p: 40,   pr: 'unidad',    cat: 'Salados' },
  { n: 'Choripán',                    p: 30,   pr: 'unidad',    cat: 'Salados' },
]

export const CATEGORIAS = [...new Set(PRODUCTOS.map(p => p.cat))].sort()

export const getProducto = (nombre) => PRODUCTOS.find(p => p.n === nombre)

export const getPorCategoria = (cat) =>
  cat === 'Todos' ? PRODUCTOS : PRODUCTOS.filter(p => p.cat === cat)

export const calcMargenMinimo = (costoUnitario) =>
  costoUnitario > 0 ? costoUnitario / 0.4 : 0

export const validarMargen = (pventa, costoUnitario) => {
  if (!pventa || !costoUnitario) return null
  const margen = ((pventa - costoUnitario) / pventa) * 100
  return { margen, aprobado: margen >= 60 }
}

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
