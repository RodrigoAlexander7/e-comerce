/**
 * Division politica del Peru usada por los selectores de direccion.
 *
 * Cobertura: los 25 departamentos con sus provincias, y el detalle de
 * distritos de las provincias urbanas que concentran la practica totalidad de
 * los envios de comercio electronico del pais.
 *
 * Para una provincia sin lista de distritos, el formulario sustituye el
 * selector por un campo de texto libre en lugar de bloquear la compra. Cuando
 * se cargue el UBIGEO oficial completo del INEI, basta con ampliar este
 * archivo: es el unico punto del sistema que conoce estos nombres.
 */

export interface ProvinceData {
  readonly name: string;
  readonly districts: readonly string[];
}

export interface DepartmentData {
  readonly name: string;
  readonly provinces: readonly ProvinceData[];
}

/** Provincia sin detalle de distritos todavia. */
const p = (name: string): ProvinceData => ({ name, districts: [] });

const LIMA_METROPOLITANA = [
  'Ancon', 'Ate', 'Barranco', 'Brena', 'Carabayllo', 'Cercado de Lima', 'Chaclacayo',
  'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesus Maria',
  'La Molina', 'La Victoria', 'Lince', 'Los Olivos', 'Lurigancho-Chosica', 'Lurin',
  'Magdalena del Mar', 'Miraflores', 'Pachacamac', 'Pucusana', 'Pueblo Libre',
  'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rimac', 'San Bartolo', 'San Borja',
  'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis',
  'San Martin de Porres', 'San Miguel', 'Santa Anita', 'Santa Maria del Mar', 'Santa Rosa',
  'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa Maria del Triunfo',
];

export const PERU_DEPARTMENTS: readonly DepartmentData[] = [
  {
    name: 'Amazonas',
    provinces: [p('Chachapoyas'), p('Bagua'), p('Bongara'), p('Condorcanqui'), p('Luya'), p('Rodriguez de Mendoza'), p('Utcubamba')],
  },
  {
    name: 'Ancash',
    provinces: [
      p('Huaraz'), p('Aija'), p('Antonio Raymondi'), p('Asuncion'), p('Bolognesi'), p('Carhuaz'),
      p('Carlos Fermin Fitzcarrald'), p('Casma'), p('Corongo'), p('Huari'), p('Huarmey'),
      p('Huaylas'), p('Mariscal Luzuriaga'), p('Ocros'), p('Pallasca'), p('Pomabamba'),
      p('Recuay'), p('Sihuas'), p('Yungay'),
      {
        name: 'Santa',
        districts: ['Chimbote', 'Nuevo Chimbote', 'Coishco', 'Santa', 'Samanco', 'Nepena', 'Macate', 'Caceres del Peru', 'Guadalupito'],
      },
    ],
  },
  {
    name: 'Apurimac',
    provinces: [p('Abancay'), p('Andahuaylas'), p('Antabamba'), p('Aymaraes'), p('Cotabambas'), p('Chincheros'), p('Grau')],
  },
  {
    name: 'Arequipa',
    provinces: [
      {
        name: 'Arequipa',
        districts: [
          'Cercado', 'Alto Selva Alegre', 'Cayma', 'Cerro Colorado', 'Characato', 'Jacobo Hunter',
          'Jose Luis Bustamante y Rivero', 'La Joya', 'Mariano Melgar', 'Miraflores', 'Mollebaya',
          'Paucarpata', 'Sabandia', 'Sachaca', 'Socabaya', 'Tiabaya', 'Uchumayo', 'Yanahuara',
          'Yura', 'Quequena',
        ],
      },
      p('Camana'), p('Caraveli'), p('Castilla'), p('Caylloma'), p('Condesuyos'),
      { name: 'Islay', districts: ['Mollendo', 'Cocachacra', 'Dean Valdivia', 'Islay', 'Mejia', 'Punta de Bombon'] },
      p('La Union'),
    ],
  },
  {
    name: 'Ayacucho',
    provinces: [
      { name: 'Huamanga', districts: ['Ayacucho', 'Carmen Alto', 'Jesus Nazareno', 'San Juan Bautista', 'Andres Avelino Caceres Dorregaray', 'Socos', 'Tambillo'] },
      p('Cangallo'), p('Huanca Sancos'), p('Huanta'), p('La Mar'), p('Lucanas'), p('Parinacochas'),
      p('Paucar del Sara Sara'), p('Sucre'), p('Victor Fajardo'), p('Vilcas Huaman'),
    ],
  },
  {
    name: 'Cajamarca',
    provinces: [
      { name: 'Cajamarca', districts: ['Cajamarca', 'Banos del Inca', 'Jesus', 'Llacanora', 'Los Banos del Inca', 'Namora', 'San Juan'] },
      p('Cajabamba'), p('Celendin'), p('Chota'), p('Contumaza'), p('Cutervo'), p('Hualgayoc'),
      p('Jaen'), p('San Ignacio'), p('San Marcos'), p('San Miguel'), p('San Pablo'), p('Santa Cruz'),
    ],
  },
  {
    name: 'Callao',
    provinces: [
      {
        name: 'Callao',
        districts: ['Callao', 'Bellavista', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Mi Peru', 'Ventanilla'],
      },
    ],
  },
  {
    name: 'Cusco',
    provinces: [
      { name: 'Cusco', districts: ['Cusco', 'San Jeronimo', 'San Sebastian', 'Santiago', 'Wanchaq', 'Ccorca', 'Poroy', 'Saylla'] },
      p('Acomayo'), p('Anta'), p('Calca'), p('Canas'), p('Canchis'), p('Chumbivilcas'),
      p('Espinar'), p('La Convencion'), p('Paruro'), p('Paucartambo'), p('Quispicanchi'), p('Urubamba'),
    ],
  },
  {
    name: 'Huancavelica',
    provinces: [p('Huancavelica'), p('Acobamba'), p('Angaraes'), p('Castrovirreyna'), p('Churcampa'), p('Huaytara'), p('Tayacaja')],
  },
  {
    name: 'Huanuco',
    provinces: [
      { name: 'Huanuco', districts: ['Huanuco', 'Amarilis', 'Pillco Marca', 'Chinchao', 'Churubamba', 'Santa Maria del Valle', 'Yarumayo'] },
      p('Ambo'), p('Dos de Mayo'), p('Huacaybamba'), p('Huamalies'), p('Leoncio Prado'),
      p('Marañon'), p('Pachitea'), p('Puerto Inca'), p('Lauricocha'), p('Yarowilca'),
    ],
  },
  {
    name: 'Ica',
    provinces: [
      { name: 'Ica', districts: ['Ica', 'La Tinguina', 'Los Aquijes', 'Parcona', 'Pueblo Nuevo', 'Salas', 'San Jose de los Molinos', 'Santiago', 'Subtanjalla'] },
      { name: 'Chincha', districts: ['Chincha Alta', 'Chincha Baja', 'El Carmen', 'Grocio Prado', 'Pueblo Nuevo', 'Sunampe', 'Tambo de Mora'] },
      p('Nazca'), p('Palpa'),
      { name: 'Pisco', districts: ['Pisco', 'San Andres', 'San Clemente', 'Tupac Amaru Inca', 'Independencia', 'Paracas', 'Humay'] },
    ],
  },
  {
    name: 'Junin',
    provinces: [
      { name: 'Huancayo', districts: ['Huancayo', 'El Tambo', 'Chilca', 'Pilcomayo', 'San Agustin', 'Sicaya', 'Huancan', 'Hualhuas'] },
      p('Concepcion'), p('Chanchamayo'), p('Jauja'), p('Junin'), p('Satipo'), p('Tarma'),
      p('Yauli'), p('Chupaca'),
    ],
  },
  {
    name: 'La Libertad',
    provinces: [
      {
        name: 'Trujillo',
        districts: ['Trujillo', 'El Porvenir', 'Florencia de Mora', 'Huanchaco', 'La Esperanza', 'Laredo', 'Moche', 'Poroto', 'Salaverry', 'Simbal', 'Victor Larco Herrera'],
      },
      p('Ascope'), p('Bolivar'), p('Chepen'), p('Julcan'), p('Otuzco'), p('Pacasmayo'),
      p('Pataz'), p('Sanchez Carrion'), p('Santiago de Chuco'), p('Gran Chimu'), p('Viru'),
    ],
  },
  {
    name: 'Lambayeque',
    provinces: [
      { name: 'Chiclayo', districts: ['Chiclayo', 'Jose Leonardo Ortiz', 'La Victoria', 'Pimentel', 'Monsefu', 'Pomalca', 'Reque', 'Santa Rosa', 'Eten', 'Tuman'] },
      p('Ferrenafe'),
      { name: 'Lambayeque', districts: ['Lambayeque', 'Motupe', 'Olmos', 'Tucume', 'Illimo', 'Jayanca', 'San Jose'] },
    ],
  },
  {
    name: 'Lima',
    provinces: [
      { name: 'Lima', districts: LIMA_METROPOLITANA },
      { name: 'Barranca', districts: ['Barranca', 'Paramonga', 'Pativilca', 'Supe', 'Supe Puerto'] },
      p('Cajatambo'),
      { name: 'Canete', districts: ['San Vicente de Canete', 'Imperial', 'Mala', 'Nuevo Imperial', 'San Luis', 'Asia', 'Cerro Azul', 'Quilmana'] },
      p('Canta'), p('Huaral'), p('Huarochiri'), p('Huaura'), p('Oyon'), p('Yauyos'),
    ],
  },
  {
    name: 'Loreto',
    provinces: [
      { name: 'Maynas', districts: ['Iquitos', 'Belen', 'Punchana', 'San Juan Bautista', 'Indiana', 'Mazan', 'Napo'] },
      p('Alto Amazonas'), p('Loreto'), p('Mariscal Ramon Castilla'), p('Requena'), p('Ucayali'),
      p('Datem del Maranon'), p('Putumayo'),
    ],
  },
  {
    name: 'Madre de Dios',
    provinces: [p('Tambopata'), p('Manu'), p('Tahuamanu')],
  },
  {
    name: 'Moquegua',
    provinces: [
      { name: 'Mariscal Nieto', districts: ['Moquegua', 'Samegua', 'Torata', 'Carumas', 'Cuchumbaya', 'San Cristobal'] },
      { name: 'Ilo', districts: ['Ilo', 'El Algarrobal', 'Pacocha'] },
      p('General Sanchez Cerro'),
    ],
  },
  {
    name: 'Pasco',
    provinces: [p('Pasco'), p('Daniel Alcides Carrion'), p('Oxapampa')],
  },
  {
    name: 'Piura',
    provinces: [
      { name: 'Piura', districts: ['Piura', 'Castilla', 'Catacaos', 'Veintiseis de Octubre', 'La Arena', 'La Union', 'Tambo Grande', 'Cura Mori'] },
      p('Ayabaca'), p('Huancabamba'), p('Morropon'), p('Paita'),
      { name: 'Sullana', districts: ['Sullana', 'Bellavista', 'Marcavelica', 'Querecotillo', 'Salitral', 'Miguel Checa'] },
      p('Talara'), p('Sechura'),
    ],
  },
  {
    name: 'Puno',
    provinces: [
      { name: 'Puno', districts: ['Puno', 'Acora', 'Chucuito', 'Coata', 'Paucarcolla', 'Platería', 'Vilque'] },
      { name: 'San Roman', districts: ['Juliaca', 'Cabana', 'Cabanillas', 'Caracoto', 'San Miguel'] },
      p('Azangaro'), p('Carabaya'), p('Chucuito'), p('El Collao'), p('Huancane'), p('Lampa'),
      p('Melgar'), p('Moho'), p('Sandia'), p('Yunguyo'),
    ],
  },
  {
    name: 'San Martin',
    provinces: [
      { name: 'San Martin', districts: ['Tarapoto', 'Morales', 'La Banda de Shilcayo', 'Cacatachi', 'Juan Guerra', 'Sauce'] },
      p('Bellavista'), p('El Dorado'), p('Huallaga'), p('Lamas'), p('Mariscal Caceres'),
      p('Moyobamba'), p('Picota'), p('Rioja'), p('Tocache'),
    ],
  },
  {
    name: 'Tacna',
    provinces: [
      { name: 'Tacna', districts: ['Tacna', 'Alto de la Alianza', 'Ciudad Nueva', 'Coronel Gregorio Albarracin Lanchipa', 'Pocollay', 'Calana', 'Sama'] },
      p('Candarave'), p('Jorge Basadre'), p('Tarata'),
    ],
  },
  {
    name: 'Tumbes',
    provinces: [
      { name: 'Tumbes', districts: ['Tumbes', 'Corrales', 'La Cruz', 'Pampas de Hospital', 'San Jacinto', 'San Juan de la Virgen'] },
      p('Contralmirante Villar'), p('Zarumilla'),
    ],
  },
  {
    name: 'Ucayali',
    provinces: [
      { name: 'Coronel Portillo', districts: ['Pucallpa', 'Callería', 'Yarinacocha', 'Manantay', 'Campoverde', 'Nueva Requena', 'Iparia'] },
      p('Atalaya'), p('Padre Abad'), p('Purus'),
    ],
  },
];
