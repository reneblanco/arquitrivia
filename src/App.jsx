import React, { useState, useEffect } from 'react';
import {
  Play, RotateCcw, Plus, Trash2, Check, X, AlertTriangle, Layers,
  ChevronRight, Settings, Save, ArrowLeft, Lightbulb, MonitorPlay,
  Trophy, ArrowUpRight, BookOpen, Info, Landmark, Mail,
  MessageSquareHeart, Star, Camera, Share2, Twitter, Facebook,
  Link, MessageCircle, Cloud, Search, Loader2
} from 'lucide-react';

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore, collection, addDoc, doc, setDoc, getDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp
} from "firebase/firestore";

// ==========================================
// CONFIGURACIÓN DE FIREBASE (desde variables de entorno)
// ==========================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// CLOUDINARY: subida de imágenes de comentarios
// ==========================================
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Convierte un data URL (base64) a Blob para poder subirlo
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

// Sube una imagen (Blob o data URL) a Cloudinary y devuelve la URL pública
async function uploadImageToCloudinary(imageData) {
  const blob = typeof imageData === 'string' ? dataURLtoBlob(imageData) : imageData;
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    throw new Error('Cloudinary upload failed: ' + response.status);
  }

  const data = await response.json();
  return data.secure_url;
}

// --- LIBRERÍA DE TABLEROS PRECARGADOS ---
const PRELOADED_BOARDS = [
  {
    id: "board-historia",
    title: "Historia y Fundamentos",
    description: "Grandes maestros, obras icónicas y estilos arquitectónicos.",
    color: "#ffe600",
    categories: [
      {
        name: "Arquitectos Famosos",
        questions: [
          { id: "c1q1", points: 100, q: "¿Qué arquitecto catalán diseñó la Sagrada Familia?", a: "Antoni Gaudí", answered: false },
          { id: "c1q2", points: 200, q: "¿Quién es el autor de la famosa frase 'Menos es más'?", a: "Ludwig Mies van der Rohe", answered: false },
          { id: "c1q3", points: 300, q: "¿Arquitecto suizo-francés que propuso los 'Cinco puntos de la nueva arquitectura'?", a: "Le Corbusier", answered: false },
          { id: "c1q4", points: 400, q: "¿Primera mujer en la historia en ganar el Premio Pritzker de Arquitectura?", a: "Zaha Hadid", answered: false },
          { id: "c1q5", points: 500, q: "¿Arquitecto renacentista que diseñó la inmensa cúpula de Santa María del Fiore en Florencia?", a: "Filippo Brunelleschi", answered: false },
        ]
      },
      {
        name: "Obras Maestras",
        questions: [
          { id: "c2q1", points: 100, q: "Templo griego dedicado a la diosa Atenea, situado en la Acrópolis de Atenas.", a: "El Partenón", answered: false },
          { id: "c2q2", points: 200, q: "Anfiteatro de la época del Imperio romano, construido en el siglo I en el centro de Roma.", a: "El Coliseo Romano", answered: false },
          { id: "c2q3", points: 300, q: "Casa icónica diseñada por Frank Lloyd Wright, construida parcialmente sobre la caída de un río.", a: "Casa de la Cascada (Fallingwater)", answered: false },
          { id: "c2q4", points: 400, q: "Museo en España mundialmente conocido por su diseño de titanio curvo, obra de Frank Gehry.", a: "Museo Guggenheim Bilbao", answered: false },
          { id: "c2q5", points: 500, q: "Edificio en Sídney, Australia, famoso por su techo en forma de conchas superpuestas, diseñado por Jørn Utzon.", a: "Ópera de Sídney", answered: false },
        ]
      },
      {
        name: "Estilos y Épocas",
        questions: [
          { id: "c3q1", points: 100, q: "Estilo caracterizado por el uso del arco apuntado, la bóveda de crucería y los vitrales.", a: "Gótico", answered: false },
          { id: "c3q2", points: 200, q: "Estilo que revivió los ideales clásicos de simetría y proporción de Grecia y Roma (s. XV y XVI).", a: "Renacentista", answered: false },
          { id: "c3q3", points: 300, q: "Escuela de arquitectura, diseño y arte fundada en 1919 por Walter Gropius en Alemania.", a: "La Bauhaus", answered: false },
          { id: "c3q4", points: 400, q: "Estilo ornamental de finales del s. XIX inspirado en la naturaleza.", a: "Art Nouveau / Modernismo", answered: false },
          { id: "c3q5", points: 500, q: "Corriente que muestra las estructuras y materiales 'en crudo' (hormigón), popular en los 50s-70s.", a: "Brutalismo", answered: false },
        ]
      },
      {
        name: "Arquitectura Mexicana",
        questions: [
          { id: "c4q1", points: 100, q: "Arquitecto mexicano ganador del Premio Pritzker, famoso por su maestría en el uso del color, la luz y el agua.", a: "Luis Barragán", answered: false },
          { id: "c4q2", points: 200, q: "Antigua ciudad prehispánica conocida por su Calzada de los Muertos y las Pirámides del Sol y la Luna.", a: "Teotihuacán", answered: false },
          { id: "c4q3", points: 300, q: "Arquitecto que diseñó el Museo Nacional de Antropología y la Nueva Basílica de Guadalupe en CDMX.", a: "Pedro Ramírez Vázquez", answered: false },
          { id: "c4q4", points: 400, q: "Edificio colonial en el centro de la CDMX, reconocible por su fachada cubierta de talavera poblana.", a: "La Casa de los Azulejos", answered: false },
          { id: "c4q5", points: 500, q: "Ciudad universitaria declarada Patrimonio de la Humanidad, cuyo plan maestro fue dirigido por Mario Pani.", a: "Campus Central CU (UNAM)", answered: false },
        ]
      }
    ]
  },
  {
    id: "board-estructuras",
    title: "Sistemas Estructurales",
    description: "Fuerzas, cargas, materiales y cómo evitar que el edificio se caiga.",
    color: "#ff3366",
    categories: [
      {
        name: "Tipos de Cargas",
        questions: [
          { id: "e1q1", points: 100, q: "Peso propio del edificio y todos los elementos fijos que no cambian de posición.", a: "Carga Muerta", answered: false },
          { id: "e1q2", points: 200, q: "Fuerza generada por el peso de las personas, muebles y elementos móviles.", a: "Carga Viva", answered: false },
          { id: "e1q3", points: 300, q: "Fuerza lateral impredecible causada por movimientos tectónicos.", a: "Carga Sísmica", answered: false },
          { id: "e1q4", points: 400, q: "Fuerza lateral que puede causar succión o empuje, especialmente en edificios altos.", a: "Carga de Viento", answered: false },
          { id: "e1q5", points: 500, q: "Carga repentina y de corta duración, como una explosión o el impacto de un vehículo.", a: "Carga de Impacto", answered: false },
        ]
      },
      {
        name: "Esfuerzos Físicos",
        questions: [
          { id: "e2q1", points: 100, q: "Esfuerzo que tiende a aplastar o acortar un material.", a: "Compresión", answered: false },
          { id: "e2q2", points: 200, q: "Esfuerzo que tiende a estirar o alargar un material.", a: "Tensión (o Tracción)", answered: false },
          { id: "e2q3", points: 300, q: "Combinación de tensión y compresión que ocurre cuando una viga se dobla.", a: "Flexión", answered: false },
          { id: "e2q4", points: 400, q: "Fuerza que tiende a cortar un material desplazando secciones adyacentes en direcciones opuestas.", a: "Cortante (Cizalladura)", answered: false },
          { id: "e2q5", points: 500, q: "Esfuerzo que se produce cuando se aplica un momento de giro sobre el eje longitudinal de un elemento.", a: "Torsión", answered: false },
        ]
      },
      {
        name: "Elementos Estructurales",
        questions: [
          { id: "e3q1", points: 100, q: "Elemento vertical que soporta principalmente esfuerzos de compresión.", a: "Columna", answered: false },
          { id: "e3q2", points: 200, q: "Elemento horizontal que soporta cargas transversales y trabaja a flexión.", a: "Viga", answered: false },
          { id: "e3q3", points: 300, q: "Parte de la estructura que transmite las cargas directamente al terreno.", a: "Cimentación (o Zapata)", answered: false },
          { id: "e3q4", points: 400, q: "Muro diseñado para resistir cargas horizontales paralelas a su plano (ej. sismos).", a: "Muro de Cortante (o Muro de Rigidez)", answered: false },
          { id: "e3q5", points: 500, q: "Estructura reticular formada por barras rectas interconectadas en nodos (triángulos).", a: "Armadura (o Cercha)", answered: false },
        ]
      },
      {
        name: "Materiales",
        questions: [
          { id: "e4q1", points: 100, q: "Material que es excelente para resistir compresión pero muy malo para resistir tensión.", a: "Concreto (u Hormigón)", answered: false },
          { id: "e4q2", points: 200, q: "Aleación de hierro y carbono, excelente tanto para tensión como para compresión.", a: "Acero", answered: false },
          { id: "e4q3", points: 300, q: "Material orgánico cuyas fibras resisten bien la tensión paralela al grano.", a: "Madera", answered: false },
          { id: "e4q4", points: 400, q: "Sistema compuesto donde el acero absorbe la tensión y el cemento la compresión.", a: "Concreto Armado (Hormigón Armado)", answered: false },
          { id: "e4q5", points: 500, q: "Concreto al que se le aplican esfuerzos de compresión internos antes de someterlo a cargas externas.", a: "Concreto Presforzado (Pretensado o Postensado)", answered: false },
        ]
      }
    ]
  },
  {
    id: "board-diseno",
    title: "Teoría del Diseño",
    description: "Composición, proporción, color y los principios básicos del espacio.",
    color: "#00d0ff",
    categories: [
      {
        name: "Principios Ordenadores",
        questions: [
          { id: "d1q1", points: 100, q: "Distribución equilibrada de elementos equivalentes a ambos lados de un eje.", a: "Simetría", answered: false },
          { id: "d1q2", points: 200, q: "Repetición regular y armónica de líneas, formas o colores.", a: "Ritmo", answered: false },
          { id: "d1q3", points: 300, q: "Articulación de la importancia de una forma por su tamaño, forma o ubicación relativa.", a: "Jerarquía", answered: false },
          { id: "d1q4", points: 400, q: "Línea definida por dos puntos en el espacio en torno a la cual se pueden organizar formas.", a: "Eje", answered: false },
          { id: "d1q5", points: 500, q: "Superficie, plano o volumen de referencia que vincula y organiza a los demás elementos.", a: "Pauta", answered: false },
        ]
      },
      {
        name: "Elementos Visuales",
        questions: [
          { id: "d2q1", points: 100, q: "Indica posición en el espacio. No tiene largo, ancho ni profundidad.", a: "El Punto", answered: false },
          { id: "d2q2", points: 200, q: "Prolongación de un punto; tiene longitud, dirección y posición.", a: "La Línea", answered: false },
          { id: "d2q3", points: 300, q: "Superficie de dos dimensiones (largo y ancho) con posición y dirección.", a: "El Plano", answered: false },
          { id: "d2q4", points: 400, q: "Forma de tres dimensiones (largo, ancho y profundidad).", a: "El Volumen", answered: false },
          { id: "d2q5", points: 500, q: "Cualidad visual y táctil de la superficie de un material.", a: "La Textura", answered: false },
        ]
      },
      {
        name: "Proporción y Escala",
        questions: [
          { id: "d3q1", points: 100, q: "Relación del tamaño de un edificio o espacio respecto al tamaño del cuerpo humano.", a: "Escala Humana", answered: false },
          { id: "d3q2", points: 200, q: "Proporción matemática famosa (1.618) utilizada desde la antigua Grecia hasta hoy.", a: "Proporción Áurea / Sección Áurea", answered: false },
          { id: "d3q3", points: 300, q: "Sistema de medidas basado en las proporciones humanas, creado por Le Corbusier.", a: "El Modulor", answered: false },
          { id: "d3q4", points: 400, q: "Sucesión matemática donde cada número es la suma de los dos anteriores (1, 1, 2, 3, 5, 8...).", a: "Sucesión de Fibonacci", answered: false },
          { id: "d3q5", points: 500, q: "Estudio de las medidas y proporciones del cuerpo humano.", a: "Antropometría", answered: false },
        ]
      },
      {
        name: "Color y Luz",
        questions: [
          { id: "d4q1", points: 100, q: "Los tres colores pigmento primarios tradicionales.", a: "Rojo, Azul y Amarillo", answered: false },
          { id: "d4q2", points: 200, q: "Iluminación que proviene de una abertura en el techo.", a: "Luz Cenital", answered: false },
          { id: "d4q3", points: 300, q: "Cualidad de los colores que nos hace percibirlos como 'cálidos' o 'fríos'.", a: "Temperatura del color", answered: false },
          { id: "d4q4", points: 400, q: "Colores que se encuentran opuestos en el círculo cromático (ej. Rojo y Verde).", a: "Colores Complementarios", answered: false },
          { id: "d4q5", points: 500, q: "Efecto donde un color parece cambiar dependiendo de los colores que lo rodean.", a: "Contraste Simultáneo", answered: false },
        ]
      }
    ]
  },
  {
    id: "board-urbanismo",
    title: "Urbanismo",
    description: "La ciudad, la calle, la movilidad y cómo organizamos nuestro hábitat.",
    color: "#00ff66",
    categories: [
      {
        name: "Trazas Urbanas",
        questions: [
          { id: "u1q1", points: 100, q: "Traza urbana donde las calles se cruzan en ángulos rectos, como un tablero de ajedrez.", a: "Retícula (Ortogonal o Hipodámica)", answered: false },
          { id: "u1q2", points: 200, q: "Traza que crece desde un centro hacia afuera, como las vías de una rueda de bicicleta.", a: "Radial o Concéntrica", answered: false },
          { id: "u1q3", points: 300, q: "Traza irregular típica de ciudades medievales, a menudo llamada 'plato roto'.", a: "Irregular u Orgánica", answered: false },
          { id: "u1q4", points: 400, q: "Ciudad planificada que se desarrolla a lo largo de un eje principal (río, carretera).", a: "Ciudad Lineal", answered: false },
          { id: "u1q5", points: 500, q: "Plano urbano impulsado por Georges-Eugène Haussmann que modernizó París en el siglo XIX.", a: "Plan Haussmann", answered: false },
        ]
      },
      {
        name: "Kevin Lynch",
        questions: [
          { id: "u2q1", points: 100, q: "Punto de referencia físico prominente, visible a la distancia (ej. una torre, montaña).", a: "Hito (Landmark)", answered: false },
          { id: "u2q2", points: 200, q: "Canales por donde el observador se mueve (calles, senderos, canales de tránsito).", a: "Sendas / Vías (Paths)", answered: false },
          { id: "u2q3", points: 300, q: "Puntos estratégicos o focos intensivos hacia los que uno viaja (cruces de calles, plazas).", a: "Nodos (Nodes)", answered: false },
          { id: "u2q4", points: 400, q: "Secciones de la ciudad de tamaño medio, reconocibles por un carácter común (barrios).", a: "Barrios / Distritos (Districts)", answered: false },
          { id: "u2q5", points: 500, q: "Límites lineales o rupturas en la continuidad (ríos, vías de tren, muros).", a: "Bordes (Edges)", answered: false },
        ]
      },
      {
        name: "Movilidad",
        questions: [
          { id: "u3q1", points: 100, q: "El usuario más vulnerable y el que debería tener máxima prioridad en la pirámide de movilidad.", a: "El Peatón", answered: false },
          { id: "u3q2", points: 200, q: "Carril exclusivo diseñado específicamente para el tránsito seguro de bicicletas.", a: "Ciclovía (o Carril Bici)", answered: false },
          { id: "u3q3", points: 300, q: "Fenómeno donde construir más carriles vehiculares resulta en un aumento proporcional del tráfico.", a: "Tránsito Inducido", answered: false },
          { id: "u3q4", points: 400, q: "Acrónimo de Transit-Oriented Development (Desarrollo Orientado al Transporte Público).", a: "TOD / DOT", answered: false },
          { id: "u3q5", points: 500, q: "Concepto de urbanismo que promueve que las necesidades diarias estén a 15 minutos caminando.", a: "La ciudad de los 15 minutos", answered: false },
        ]
      },
      {
        name: "Uso de Suelo",
        questions: [
          { id: "u4q1", points: 100, q: "División del territorio de una ciudad en áreas con usos específicos permitidos (residencial, comercial...).", a: "Zonificación", answered: false },
          { id: "u4q2", points: 200, q: "Acrónimo de 'Coeficiente de Uso de Suelo' (indica cuántos metros cuadrados se pueden construir).", a: "CUS", answered: false },
          { id: "u4q3", points: 300, q: "Acrónimo de 'Coeficiente de Ocupación del Suelo' (qué porcentaje del terreno puede tener huella construida).", a: "COS", answered: false },
          { id: "u4q4", points: 400, q: "Proceso por el cual un barrio se revaloriza, desplazando a sus habitantes originales por clases de mayor poder adquisitivo.", a: "Gentrificación", answered: false },
          { id: "u4q5", points: 500, q: "Restricción que define qué tanto un edificio debe separarse de la calle o de sus vecinos.", a: "Restricción Frontal / Remetimiento (Setback)", answered: false },
        ]
      }
    ]
  },
  {
    id: "board-sustentabilidad",
    title: "Sustentabilidad y Bioclimática",
    description: "Asoleamiento, eficiencia energética y arquitectura respetuosa con el medio ambiente.",
    color: "#ff8c00",
    categories: [
      {
        name: "Clima y Sol",
        questions: [
          { id: "s1q1", points: 100, q: "Estudio de las trayectorias del sol para optimizar la luz y el calor en un edificio.", a: "Asoleamiento", answered: false },
          { id: "s1q2", points: 200, q: "Orientación geográfica ideal en el hemisferio norte para captar calor en invierno sin sobrecalentarse en verano.", a: "Orientación Sur", answered: false },
          { id: "s1q3", points: 300, q: "Elemento arquitectónico que bloquea el sol de verano pero permite la entrada del sol bajo de invierno.", a: "Alero (o Parasol horizontal)", answered: false },
          { id: "s1q4", points: 400, q: "Fenómeno térmico donde la temperatura en el centro de la ciudad es mayor que en sus afueras.", a: "Isla de Calor Urbana", answered: false },
          { id: "s1q5", points: 500, q: "Fenómeno donde el calor del sol entra por el vidrio pero no puede escapar, calentando el interior.", a: "Efecto Invernadero", answered: false },
        ]
      },
      {
        name: "Estrategias Pasivas",
        questions: [
          { id: "s2q1", points: 100, q: "Aberturas en fachadas opuestas que permiten que el aire circule y enfríe el espacio de manera natural.", a: "Ventilación Cruzada", answered: false },
          { id: "s2q2", points: 200, q: "Capacidad de un material (como concreto o piedra) de absorber, almacenar y liberar calor lentamente.", a: "Masa Térmica / Inercia Térmica", answered: false },
          { id: "s2q3", points: 300, q: "Sistema pasivo de calefacción solar que usa un muro oscuro pintado detrás de un vidrio orientado al sol.", a: "Muro Trombe", answered: false },
          { id: "s2q4", points: 400, q: "Ventilación que aprovecha que el aire caliente es más ligero y sube, escapando por la parte alta del edificio.", a: "Efecto Chimenea / Ventilación Termosifónica", answered: false },
          { id: "s2q5", points: 500, q: "Enfriamiento del aire al hacerlo pasar por agua, agua pulverizada o vegetación húmeda.", a: "Enfriamiento Evaporativo", answered: false },
        ]
      },
      {
        name: "Materiales Eco",
        questions: [
          { id: "s3q1", points: 100, q: "Sistema constructivo que utiliza tierra húmeda apisonada en cimbras.", a: "Tapial (Tierra Compactada)", answered: false },
          { id: "s3q2", points: 200, q: "Material vegetal de rápido crecimiento, alta resistencia a la tensión y hueco en su interior.", a: "Bambú", answered: false },
          { id: "s3q3", points: 300, q: "Medida de la cantidad total de gases de efecto invernadero emitidos para producir un material.", a: "Huella de Carbono", answered: false },
          { id: "s3q4", points: 400, q: "Energía total consumida en la extracción, fabricación y transporte de un material hasta la obra.", a: "Energía Incorporada (Embodied Energy)", answered: false },
          { id: "s3q5", points: 500, q: "Metodología para evaluar los impactos ambientales de un producto de 'la cuna a la tumba'.", a: "Análisis de Ciclo de Vida (ACV / LCA)", answered: false },
        ]
      },
      {
        name: "Certificaciones",
        questions: [
          { id: "s4q1", points: 100, q: "Certificación originada en EE.UU. para edificios verdes (Leadership in Energy and Environmental Design).", a: "LEED", answered: false },
          { id: "s4q2", points: 200, q: "Certificación enfocada en la salud y el bienestar humano en los espacios interiores.", a: "WELL Building Standard", answered: false },
          { id: "s4q3", points: 300, q: "Estándar alemán que exige un consumo de energía ultrabajo y hermeticidad extrema.", a: "Passivhaus", answered: false },
          { id: "s4q4", points: 400, q: "Certificación más antigua del mundo (origen británico) para evaluación de sostenibilidad en edificios.", a: "BREEAM", answered: false },
          { id: "s4q5", points: 500, q: "Certificación del IFC centrada en reducciones del 20% en energía, agua y energía incorporada en materiales.", a: "EDGE", answered: false },
        ]
      }
    ]
  }
];

function App() {
  const [gameState, setGameState] = useState('landing'); // landing, setup, editor, playing, postgame, about
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [user, setUser] = useState(null);

  // Tablero
  const [selectedBoardId, setSelectedBoardId] = useState(PRELOADED_BOARDS[0].id);
  const [categories, setCategories] = useState(PRELOADED_BOARDS[0].categories);
  const [customCategories, setCustomCategories] = useState(JSON.parse(JSON.stringify(PRELOADED_BOARDS[0].categories)));

  const [activeQuestion, setActiveQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showQuickPlayModal, setShowQuickPlayModal] = useState(false);
  const [showFreshBoardConfirm, setShowFreshBoardConfirm] = useState(false);
  const [codeJustCopied, setCodeJustCopied] = useState(false);

  // Quick play & Timer
  const [quickPlayNames, setQuickPlayNames] = useState(["", ""]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Editor y Cloud
  const [editingCategories, setEditingCategories] = useState([]);
  const [activeEditCatIndex, setActiveEditCatIndex] = useState(0);
  const [boardCode, setBoardCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchCloudCode, setSearchCloudCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [cloudError, setCloudError] = useState("");

  // Comentarios / Guestbook
  const [comments, setComments] = useState([]);
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentRole, setNewCommentRole] = useState("Profesor");
  const [newCommentSchool, setNewCommentSchool] = useState("");
  const [newCommentRating, setNewCommentRating] = useState(5);
  const [newCommentImage, setNewCommentImage] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Compartir
  const [copiedLink, setCopiedLink] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(35);

  // Texto Rotatorio
  const SUBJECTS = ["Arquitectura.", "Urbanismo.", "Diseño.", "Estructuras.", "Historia."];
  const [subjectIndex, setSubjectIndex] = useState(0);

  // --- FIREBASE AUTHENTICATION (Ghost Login) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Error signing in anonymously:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // --- FIREBASE: ESCUCHAR COMENTARIOS Y CONTADOR ---
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "comments"),
      where("approved", "==", true),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const unsubscribeComments = onSnapshot(q, (querySnapshot) => {
      const fetchedComments = [];
      querySnapshot.forEach((docSnap) => {
        fetchedComments.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (fetchedComments.length === 0) {
        setComments([
          { id: 1, name: "Profe Roberto", role: "Profesor", school: "UNAM", text: "¡Por fin mis alumnos dejan de ver el celular! Excelente herramienta para el repaso antes del parcial.", date: "27 Abr 2026", rating: 5, color: "#ffe600", image: null },
          { id: 2, name: "Ana P.", role: "Estudiante", school: "ITESM", text: "Hicimos un torneo de urbanismo y casi nos agarramos a golpes (de forma amistosa jajaja). Me encantó.", date: "22 Abr 2026", rating: 5, color: "#00d0ff", image: null },
          { id: 3, name: "Arq. González", role: "Arquitecto", school: "UANL", text: "El editor de tableros es facilísimo de usar. Ya pasé todo mi temario de estructuras aquí.", date: "28 Abr 2026", rating: 4, color: "#00ff66", image: null }
        ]);
      } else {
        setComments(fetchedComments);
      }
    }, (error) => console.error("Error fetching comments:", error));

    const statsDoc = doc(db, "stats", "global");
    const unsubscribeStats = onSnapshot(statsDoc, (docSnap) => {
      if (docSnap.exists() && docSnap.data().gamesPlayed) {
        setGamesPlayed(docSnap.data().gamesPlayed);
      } else {
        setDoc(doc(db, "stats", "global"), { gamesPlayed: 35 }, { merge: true });
      }
    }, (error) => console.error("Error fetching stats:", error));

    return () => {
      unsubscribeComments();
      unsubscribeStats();
    };
  }, [user]);

  useEffect(() => {
    if (gameState === 'landing') {
      const interval = setInterval(() => {
        setSubjectIndex((prev) => (prev + 1) % SUBJECTS.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // --- UX: scroll al inicio cuando cambia la vista ---
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [gameState]);

  // --- ACCESIBILIDAD: Escape cierra cualquier modal abierto ---
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (activeQuestion) {
        setActiveQuestion(null);
        setShowAnswer(false);
        setIsTimerRunning(false);
      } else if (showQuickPlayModal) {
        setShowQuickPlayModal(false);
      } else if (showCommentModal) {
        setShowCommentModal(false);
      } else if (showRulesModal) {
        setShowRulesModal(false);
      } else if (showResetConfirm) {
        setShowResetConfirm(false);
      } else if (showFreshBoardConfirm) {
        setShowFreshBoardConfirm(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeQuestion, showQuickPlayModal, showCommentModal, showRulesModal, showResetConfirm, showFreshBoardConfirm]);

  // --- LOCAL STORAGE LOGIC ---
  useEffect(() => {
    const savedData = localStorage.getItem('arquitrivia-save');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.gameState && parsed.gameState !== 'landing') setGameState(parsed.gameState);
        if (parsed.teams) setTeams(parsed.teams);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.customCategories) setCustomCategories(parsed.customCategories);
        if (parsed.selectedBoardId) setSelectedBoardId(parsed.selectedBoardId);
        if (parsed.boardCode) setBoardCode(parsed.boardCode);
      } catch (e) {
        console.error("Error cargando partida guardada", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('arquitrivia-save', JSON.stringify({
      gameState, teams, categories, customCategories, selectedBoardId, boardCode
    }));
  }, [gameState, teams, categories, customCategories, selectedBoardId, boardCode]);

  // Lógica del Timer
  useEffect(() => {
    let timer;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  // Funciones de juego
  const handleAddTeam = (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    if (teams.length >= 4) {
      alert("Máximo 4 equipos por partida. Si tu grupo es grande, divídelo en 4 equipos grandes — la dinámica funciona mejor así.");
      return;
    }
    setTeams([...teams, { id: Date.now(), name: newTeamName.trim(), score: 0 }]);
    setNewTeamName("");
  };

  const handleRemoveTeam = (id) => {
    if (teams.length <= 1) return;
    setTeams(teams.filter(t => t.id !== id));
  };

  const handleStartGame = async () => {
    if (teams.length === 0) return;

    if (selectedBoardId === 'custom') {
      setCategories(JSON.parse(JSON.stringify(customCategories)));
    } else {
      const board = PRELOADED_BOARDS.find(b => b.id === selectedBoardId);
      if (board) setCategories(JSON.parse(JSON.stringify(board.categories)));
    }
    setGameState('playing');

    if (user) {
      try {
        const statsRef = doc(db, "stats", "global");
        const statsSnap = await getDoc(statsRef);
        let currentCount = 35;
        if (statsSnap.exists() && statsSnap.data().gamesPlayed) {
          currentCount = statsSnap.data().gamesPlayed;
        }
        await setDoc(statsRef, { gamesPlayed: currentCount + 1 }, { merge: true });
      } catch (e) {
        console.error("Error updating game count:", e);
      }
    }
  };

  const handleUpdateQuickPlayName = (index, value) => {
    const newNames = [...quickPlayNames];
    newNames[index] = value;
    setQuickPlayNames(newNames);
  };

  const handleSelectQuickPlayBoard = async (boardIndex) => {
    let activeTeams = quickPlayNames.map(n => n.trim()).filter(n => n !== "");
    if (activeTeams.length === 0) activeTeams = ["Jugador 1", "Jugador 2"];
    const newTeams = activeTeams.map((name, idx) => ({
      id: Date.now() + idx, name: name, score: 0
    }));
    setTeams(newTeams);
    setCategories(JSON.parse(JSON.stringify(PRELOADED_BOARDS[boardIndex].categories)));
    setShowQuickPlayModal(false);
    setGameState('playing');

    if (user) {
      try {
        const statsRef = doc(db, "stats", "global");
        const statsSnap = await getDoc(statsRef);
        let currentCount = 35;
        if (statsSnap.exists() && statsSnap.data().gamesPlayed) {
          currentCount = statsSnap.data().gamesPlayed;
        }
        await setDoc(statsRef, { gamesPlayed: currentCount + 1 }, { merge: true });
      } catch (e) {}
    }
  };

  const handleFinishGameInitiate = () => {
    setShowResetConfirm(false);
    setGameState('postgame');
    setIsTimerRunning(false);
  };

  const handleOpenQuestion = (catIndex, qIndex) => {
    if (categories[catIndex].questions[qIndex].answered) return;
    setActiveQuestion({ catIndex, qIndex, ...categories[catIndex].questions[qIndex] });
    setShowAnswer(false);
    setTimeLeft(20);
    setIsTimerRunning(true);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setIsTimerRunning(false);
  };

  const handleAwardPoints = (teamId, pointsToAdd) => {
    setTeams(teams.map(t => t.id === teamId ? { ...t, score: t.score + pointsToAdd } : t));
    markQuestionAnswered();
  };

  const markQuestionAnswered = () => {
    const newCategories = [...categories];
    newCategories[activeQuestion.catIndex].questions[activeQuestion.qIndex].answered = true;
    setCategories(newCategories);
    setActiveQuestion(null);
    setShowAnswer(false);
  };

  // --- FIREBASE: GUARDAR TABLERO ---
  const handleEnterEditor = () => {
    setEditingCategories(JSON.parse(JSON.stringify(customCategories)));
    setActiveEditCatIndex(0);
    setGameState('editor');
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ARQ-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSaveEditor = async () => {
    if (!user) return;
    setIsSaving(true);

    const newCustomCategories = JSON.parse(JSON.stringify(editingCategories));
    const codeToSave = boardCode || generateRandomCode();

    try {
      await setDoc(doc(db, "boards", codeToSave), {
        code: codeToSave,
        categories: newCustomCategories,
        updatedAt: serverTimestamp(),
        creatorUid: user.uid
      });
      setBoardCode(codeToSave);
      setCustomCategories(newCustomCategories);
      setSelectedBoardId('custom');
      setGameState('editorSaved');
    } catch (error) {
      console.error("Error guardando tablero en la nube:", error);
      alert("Hubo un error al guardar en la nube. Revisa tu conexión.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- FIREBASE: BUSCAR TABLERO ---
  const handleSearchCloudBoard = async (e) => {
    e.preventDefault();
    if (!searchCloudCode.trim() || !user) return;

    setIsSearching(true);
    setCloudError("");
    try {
      const cleanCode = searchCloudCode.trim().toUpperCase();
      const docRef = doc(db, "boards", cleanCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const boardData = docSnap.data();
        setCustomCategories(boardData.categories);
        setBoardCode(boardData.code);
        setSelectedBoardId('custom');
        setSearchCloudCode("");
      } else {
        setCloudError("Código no encontrado. Verifica y vuelve a intentar.");
      }
    } catch (error) {
      console.error("Error buscando tablero:", error);
      setCloudError("Error de conexión al buscar el tablero.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartFreshBoard = () => {
    setShowFreshBoardConfirm(true);
  };

  const handleConfirmFreshBoard = () => {
    const blankTimestamp = Date.now();
    const blankCategory = {
      name: "Categoría 1",
      questions: [
        { id: blankTimestamp + "1", points: 100, q: "", a: "", answered: false },
        { id: blankTimestamp + "2", points: 200, q: "", a: "", answered: false },
        { id: blankTimestamp + "3", points: 300, q: "", a: "", answered: false },
        { id: blankTimestamp + "4", points: 400, q: "", a: "", answered: false },
        { id: blankTimestamp + "5", points: 500, q: "", a: "", answered: false },
      ]
    };
    setEditingCategories([blankCategory]);
    setActiveEditCatIndex(0);
    setBoardCode("");
    setShowFreshBoardConfirm(false);
  };

  const handleCopyBoardCode = () => {
    navigator.clipboard.writeText(boardCode);
    setCodeJustCopied(true);
    setTimeout(() => setCodeJustCopied(false), 2500);
  };

  const handlePlaySavedBoard = () => {
    setCategories(JSON.parse(JSON.stringify(customCategories)));
    setGameState('playing');
  };

  const handleAddCategory = () => {
    if (editingCategories.length >= 6) return;
    const newCat = {
      name: `Categoría ${editingCategories.length + 1}`,
      questions: [
        { id: Date.now() + "1", points: 100, q: "", a: "", answered: false },
        { id: Date.now() + "2", points: 200, q: "", a: "", answered: false },
        { id: Date.now() + "3", points: 300, q: "", a: "", answered: false },
        { id: Date.now() + "4", points: 400, q: "", a: "", answered: false },
        { id: Date.now() + "5", points: 500, q: "", a: "", answered: false },
      ]
    };
    setEditingCategories([...editingCategories, newCat]);
    setActiveEditCatIndex(editingCategories.length);
  };

  const handleRemoveCategory = () => {
    if (editingCategories.length <= 1) return;
    const updated = editingCategories.filter((_, idx) => idx !== activeEditCatIndex);
    setEditingCategories(updated);
    setActiveEditCatIndex(Math.max(0, activeEditCatIndex - 1));
  };

  const handleUpdateCategoryName = (name) => {
    const updated = [...editingCategories];
    updated[activeEditCatIndex].name = name;
    setEditingCategories(updated);
  };

  const handleUpdateQuestion = (qIndex, field, value) => {
    const updated = [...editingCategories];
    updated[activeEditCatIndex].questions[qIndex][field] = value;
    setEditingCategories(updated);
  };

  // --- FIREBASE: GUARDAR COMENTARIO ---
  // Comprime imágenes en el navegador antes de subirlas a Firestore.
  // Máx 1200px en el lado mayor + JPEG calidad 0.8.
  // Si aun así pesa demasiado, baja la calidad a 0.6.
  // Con esto las imágenes quedan típicamente entre 100-300 KB,
  // muy por debajo del límite de 1 MB por documento de Firestore.
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Solo se aceptan archivos de imagen.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen original es muy grande. Máximo 10 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 1200;
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height >= width && height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let compressed = canvas.toDataURL('image/jpeg', 0.8);
        const approxBytes = compressed.length * 0.75;
        if (approxBytes > 700 * 1024) {
          compressed = canvas.toDataURL('image/jpeg', 0.6);
        }

        setNewCommentImage(compressed);
      };
      img.onerror = () => {
        alert("No se pudo procesar la imagen. Prueba con otro archivo.");
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      alert("Error leyendo el archivo.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newCommentName.trim() || !newCommentText.trim() || !user) return;

    setIsSubmittingComment(true);
    const colors = ["#ffe600", "#00d0ff", "#00ff66", "#ff3366", "#ff8c00"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const dateObj = new Date();
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

    try {
      // Si hay imagen, súbela a Cloudinary primero y guarda solo la URL
      let imageUrl = null;
      if (newCommentImage) {
        imageUrl = await uploadImageToCloudinary(newCommentImage);
      }

      const commentData = {
        name: newCommentName,
        role: newCommentRole,
        school: newCommentSchool,
        rating: newCommentRating,
        text: newCommentText,
        date: formattedDate,
        color: randomColor,
        image: imageUrl,
        approved: false,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, "comments"), commentData);

      setNewCommentName("");
      setNewCommentText("");
      setNewCommentSchool("");
      setNewCommentRole("Profesor");
      setNewCommentRating(5);
      setNewCommentImage(null);

      alert("¡Gracias por tu comentario! Está pendiente de revisión y aparecerá publicado en breve.");

      if (gameState === 'postgame') {
        handleFinalizeCleanupToHome();
      } else if (showCommentModal) {
        setShowCommentModal(false);
      }
    } catch (error) {
      console.error("Error guardando comentario:", error);
      alert("Hubo un error al publicar el comentario. Si subiste una foto, revisa tu conexión e intenta de nuevo.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://arquitrivia.com");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleFinalizeCleanupToHome = () => {
    setGameState('landing');
    setTeams([]);
    setActiveQuestion(null);
    setShowAnswer(false);
  };

  // --- COMPONENTES COMPARTIDOS ---
  const Logo = ({ className = "", textColor = "text-black" }) => (
    <div className={`flex items-center gap-2 font-black tracking-tighter ${className} shrink-0`}>
      <Landmark className={textColor} strokeWidth={2.5} size={28} />
      <span className={textColor}>arquitrivia</span>
    </div>
  );

  const Footer = () => (
    <footer className="border-t-4 border-black bg-white text-black py-12 shrink-0 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <Logo className="text-3xl" textColor="text-black" />
        <button
          onClick={() => setGameState('about')}
          className="font-black uppercase tracking-widest text-sm text-black bg-[#faf9f6] border-4 border-black px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
        >
          Hablemos →
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 border-t-2 border-black/20 pt-6 mt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-black/60">
        <span>© {new Date().getFullYear()} arquitrivia. Todos los derechos reservados.</span>
        <div className="flex flex-wrap gap-4 items-center">
          <button onClick={() => setGameState('privacy')} className="hover:text-black transition-colors underline">Privacidad</button>
          <button onClick={() => setGameState('terms')} className="hover:text-black transition-colors underline">Términos</button>
          <span>Made with ❤️ in 🇲🇽 by <a href="https://reneblanco.com" target="_blank" rel="noopener noreferrer" className="text-black hover:text-[#ffe600] transition-colors underline font-black">reneblanco</a></span>
        </div>
      </div>
    </footer>
  );

  // --- VISTA: LANDING PAGE ---
  if (gameState === 'landing') {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-black font-sans selection:bg-[#ffe600] selection:text-black relative flex flex-col">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{
          backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, white, transparent 60%)',
          WebkitMaskImage: 'linear-gradient(to bottom, white, transparent 60%)'
        }}></div>

        <header className="relative z-50 border-b-4 border-black bg-white sticky top-0 shrink-0">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Logo className="text-2xl" />
            <nav className="hidden md:flex gap-8 font-bold text-sm tracking-wide uppercase">
              <a href="#como-jugar" className="hover:text-[#ff3366] transition-colors">Cómo Jugar</a>
              <a href="#reglas" className="hover:text-[#00d0ff] transition-colors">Reglas</a>
              <a href="#comentarios" className="hover:text-[#00ff66] transition-colors">Comunidad</a>
            </nav>
            <button
              onClick={() => setGameState('setup')}
              className="bg-black text-white font-bold px-6 py-3 border-2 border-black hover:bg-[#ffe600] hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
            >
              Iniciar Partida
            </button>
          </div>
        </header>

        <main className="relative z-10 flex-1">
          <section className="max-w-7xl mx-auto px-6 py-20 md:py-28 flex flex-col items-center text-center">

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-10 uppercase max-w-5xl">
              Haz inolvidable tu clase de <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-500 inline-block transition-opacity duration-300" style={{ WebkitTextStroke: '2px black' }}>
                {SUBJECTS[subjectIndex]}
              </span>
            </h1>

            <div className="bg-[#ff3366] border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl mb-14 -rotate-1 transform transition-transform hover:rotate-0 duration-300">
              <p className="text-lg md:text-2xl font-bold text-white leading-relaxed">
                El grupo entero discutiendo, levantando la mano, contando puntos como si fuera la final de algo. arquitrivia es el formato que convierte el repaso del temario en eso, en una hora de clase. Tú pones el temario; lo demás ya está armado.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-2xl mb-10">
              <button
                onClick={() => setShowQuickPlayModal(true)}
                className="flex-1 bg-[#ffe600] text-black font-black text-lg md:text-xl px-8 py-6 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] flex items-center justify-center gap-3 uppercase tracking-wide"
              >
                Partida Rápida <Play size={24} strokeWidth={3} fill="currentColor" />
              </button>
              <button
                onClick={() => setGameState('setup')}
                className="flex-1 bg-white text-black font-black text-lg md:text-xl px-8 py-6 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] flex items-center justify-center gap-3 uppercase tracking-wide"
              >
                Partida Personalizada <Settings size={24} strokeWidth={3} />
              </button>
            </div>

            <div className="inline-flex items-center gap-3 bg-white border-4 border-black px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-3 h-3 bg-[#00ff66] rounded-full animate-pulse"></div>
              <span className="font-black uppercase tracking-widest text-xs md:text-sm text-gray-600">
                Ya se han jugado <span className="text-black text-lg mx-1">{gamesPlayed}</span> partidas
              </span>
            </div>
          </section>

          <section id="como-jugar" className="border-t-4 border-black bg-white">
            <div className="max-w-7xl mx-auto px-6 py-24">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-16 uppercase text-center bg-[#faf9f6] inline-block border-4 border-black px-8 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -rotate-1 mx-auto block w-fit">¿Cómo funciona?</h2>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-[#faf9f6] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-start hover:-translate-y-2 transition-transform">
                  <div className="bg-[#ffe600] border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Lightbulb size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase">1. Personaliza</h3>
                  <p className="font-medium text-gray-600 leading-relaxed">Tu temario ya lo tienes en la cabeza. Vacíalo en el editor en diez minutos — categorías, preguntas, respuestas, listo. O parte de uno de nuestros cinco tableros precargados de Historia, Estructuras, Diseño, Urbanismo o Sustentabilidad.</p>
                </div>
                <div className="bg-[#faf9f6] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-start md:translate-y-8 hover:-translate-y-2 transition-transform">
                  <div className="bg-[#00d0ff] border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <MonitorPlay size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase">2. Proyecta</h3>
                  <p className="font-medium text-gray-600 leading-relaxed">Divide al grupo en equipos (filas, mesas, como prefieras). Conecta tu laptop al cañón. Eso es todo. La interfaz está diseñada para verse perfecta proyectada — letras grandes, contraste alto, cero distracciones.</p>
                </div>
                <div className="bg-[#faf9f6] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-start hover:-translate-y-2 transition-transform">
                  <div className="bg-[#00ff66] border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Trophy size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase">3. Compite</h3>
                  <p className="font-medium text-gray-600 leading-relaxed">Cada equipo elige casilla. Veinte segundos para responder. Aciertan, suman. Fallan, restan. Tú revelas la respuesta y asignas puntos con un clic. Una hora vuela.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="reglas" className="border-t-4 border-black bg-[#faf9f6] py-24">
            <div className="max-w-5xl mx-auto px-6">
              <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Info size={200} />
                </div>

                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase relative z-10">Las 3 Reglas de Oro</h2>
                <p className="text-xl font-bold text-gray-600 mb-12 relative z-10">Conoce el reglamento oficial de arquitrivia antes de competir.</p>

                <div className="space-y-8 relative z-10">
                  <div className="flex gap-6 items-start">
                    <div className="bg-[#00ff66] border-4 border-black w-12 h-12 shrink-0 flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">1</div>
                    <div>
                      <h3 className="text-2xl font-black uppercase mb-2">Acierta o castiga</h3>
                      <p className="font-medium text-gray-700 leading-relaxed text-lg">
                        Suma quien acierta. <strong className="text-[#ff3366]">Resta</strong> quien intenta y falla. Quien se queda callado, ni gana ni pierde. Sí, esto cambia todo el cálculo de cuándo conviene levantar la mano.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="bg-[#00d0ff] border-4 border-black w-12 h-12 shrink-0 flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">2</div>
                    <div>
                      <h3 className="text-2xl font-black uppercase mb-2">El reloj no perdona</h3>
                      <p className="font-medium text-gray-700 leading-relaxed text-lg">
                        <strong>Veinte segundos</strong> por pregunta para debatir, dudar, gritar la respuesta. Si llega a cero sin respuesta, el equipo pierde el turno — pero no pierde puntos.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="bg-[#ffe600] border-4 border-black w-12 h-12 shrink-0 flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">3</div>
                    <div>
                      <h3 className="text-2xl font-black uppercase mb-2">Pregunta quemada</h3>
                      <p className="font-medium text-gray-700 leading-relaxed text-lg">
                        Casilla abierta es casilla jugada. Da igual si fue acierto, error o silencio: una vez revelada la respuesta, queda <strong>sellada</strong> por el resto de la partida.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="comentarios" className="border-t-4 border-black bg-[#ff3366] overflow-hidden relative z-10">
            <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase mb-4" style={{ textShadow: '4px 4px 0px #000' }}>
                  Comunidad arquitrivia
                </h2>
                <p className="text-xl font-bold text-black bg-white inline-block px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
                  Ya está corriendo en universidades de México. Esto dicen quienes lo han usado.
                </p>
              </div>

              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {comments.map((comment, i) => (
                  <div
                    key={comment.id}
                    className="break-inside-avoid bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-2 flex flex-col"
                    style={{
                      transform: `rotate(${i % 2 === 0 ? '1deg' : '-1deg'})`
                    }}
                  >
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= (comment.rating || 5) ? "#000" : "transparent"} className="text-black" />)}
                    </div>
                    {comment.image && (
                      <div className="mb-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white p-2 transform -rotate-1">
                        <img src={comment.image} alt="Evidencia de clase" className="w-full h-32 md:h-48 object-cover border-2 border-black" />
                      </div>
                    )}
                    <p className="font-bold text-lg mb-6 leading-snug flex-grow">"{comment.text}"</p>
                    <div className="border-t-4 border-black pt-4 mt-auto">
                      <div className="font-black uppercase tracking-widest text-sm mb-1">{comment.name}</div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
                          <span className="bg-[#ffe600] border-2 border-black px-2 py-1 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{comment.role || "Profesor"}</span>
                          {comment.school && <span className="bg-white border-2 border-black px-2 py-1 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{comment.school}</span>}
                        </div>
                        <span className="text-[10px] font-bold text-black/60 uppercase mt-2">{comment.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 text-center">
                <button
                  onClick={() => setShowCommentModal(true)}
                  className="bg-white text-black font-black text-xl px-8 py-5 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] inline-flex items-center justify-center gap-3 uppercase tracking-wide"
                >
                  <MessageSquareHeart size={28} /> ¿Ya jugaste? ¿Qué te pareció? Cuéntanos aquí
                </button>
                <p className="mt-4 font-bold text-white text-lg">Tus comentarios nos ayudan muchísimo a mejorar y mantener viva la plataforma.</p>
              </div>
            </div>
          </section>

          <section id="faq" className="border-t-4 border-black bg-[#faf9f6] relative py-24 z-10">
            <div className="max-w-4xl mx-auto px-6 relative z-10">
              <div className="text-center mb-12">
                <div className="inline-block bg-[#00ff66] border-4 border-black px-4 py-2 font-black text-sm uppercase tracking-widest mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1">
                  Preguntas Frecuentes
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase">Lo que más nos preguntan</h2>
              </div>

              <div className="space-y-4">
                {[
                  {
                    q: "¿Es realmente gratis?",
                    a: "Sí. arquitrivia es 100% gratis. Sin tarjeta, sin trial, sin ‘plan premium oculto’. Si en el futuro lanzamos algo de pago, será una versión Pro opcional para escuelas — el uso individual de profes y alumnos seguirá siendo gratis."
                  },
                  {
                    q: "¿Necesito registrarme o crear cuenta?",
                    a: "No. Abres arquitrivia.com y ya. Puedes jugar Partida Rápida en 30 segundos sin registro. Si creas un tablero personalizado, te damos un código tipo ARQ-X7B2 que puedes usar para cargarlo en cualquier computadora más adelante."
                  },
                  {
                    q: "¿Para qué materias de arquitectura sirve?",
                    a: "Tenemos cinco tableros precargados — Historia, Estructuras, Diseño, Urbanismo y Sustentabilidad — cubriendo el grueso del temario de cualquier carrera de arquitectura. Y si das una materia más específica (Restauración, Paisaje, BIM, Composición, etc.), puedes crear tu propio tablero en 10 minutos en el editor."
                  },
                  {
                    q: "¿Cómo lo proyecto en clase?",
                    a: "Conecta tu laptop al cañón o televisión del salón como cualquier presentación. arquitrivia está diseñado para verse perfecto proyectado — letras grandes, contraste alto, casillas legibles desde el fondo del salón."
                  },
                  {
                    q: "¿Funciona en clase virtual o híbrida?",
                    a: "Sí. Comparte tu pantalla en Zoom, Google Meet o Teams como harías con cualquier presentación. Los alumnos ven el tablero en sus pantallas y los equipos coordinan respuestas por chat o por voz."
                  },
                  {
                    q: "¿Cuántos equipos pueden jugar al mismo tiempo?",
                    a: "Técnicamente no hay límite. En la práctica, con 4-6 equipos la dinámica funciona mejor. Si tienes un grupo grande (40+ alumnos), divide en equipos por filas o por mesas."
                  },
                  {
                    q: "¿Puedo guardar mis tableros para reusarlos el siguiente semestre?",
                    a: "Sí. Cuando guardas un tablero en la nube, te asignamos un código único que puedes anotar y reutilizar en cualquier momento. Solo lo introduces en la pantalla de inicio y se carga listo para jugar."
                  },
                  {
                    q: "¿Quién hizo esto y por qué?",
                    a: "arquitrivia es un proyecto hecho por estudiantes de arquitectura para profes y compañeros de la carrera. Nació después de ver que una dinámica de trivia en una clase de Historia transformó por completo el engagement del grupo. La hicimos gratis para que cualquier profe pueda hacer lo mismo sin tener que organizar el juego desde cero."
                  }
                ].map((item, idx) => (
                  <details key={idx} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group">
                    <summary className="font-black text-lg md:text-xl uppercase tracking-tight cursor-pointer flex items-center justify-between gap-4 list-none">
                      <span>{item.q}</span>
                      <ChevronRight size={24} strokeWidth={3} className="shrink-0 group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="font-medium text-gray-700 leading-relaxed mt-4 pt-4 border-t-2 border-black/10">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section id="compartir" className="border-t-4 border-black bg-white relative py-24 z-10">
            <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">

              <div className="bg-white border-4 border-black p-8 md:p-16 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Share2 size={200} />
                </div>

                <div className="relative z-10">
                  <div className="inline-block bg-[#00d0ff] border-4 border-black px-6 py-2 font-black text-sm uppercase tracking-widest mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2">
                    Únete a nuestra misión
                  </div>

                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">
                    ¿Te ha funcionado? Pásalo.
                  </h2>

                  <p className="text-xl md:text-2xl font-bold text-black/80 mb-12 max-w-3xl mx-auto leading-relaxed">
                    arquitrivia es gratis y va a seguir siendo gratis. La única manera de que llegue a más facultades es que la gente que ya la usa la recomiende. Si te funcionó en clase, mándale el link a otro profe — o a un alumno organizando un repaso para parcial.
                  </p>

                  <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                    <button
                      onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Descubre arquitrivia: trivia para clases de arquitectura, hecha por estudiantes. Cinco tableros listos o crea el tuyo en 10 min. Cero costo, cero registro. https://arquitrivia.com')}`, '_blank')}
                      className="bg-[#faf9f6] text-[#25D366] hover:bg-[#25D366] hover:text-white border-4 border-black font-black text-lg px-6 py-4 flex items-center gap-3 uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                    >
                      <MessageCircle size={24} strokeWidth={3} /> WhatsApp
                    </button>
                    <button
                      onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Encontré arquitrivia: trivia para clases de arquitectura, gratis, sin registro. Cinco tableros listos o creas el tuyo.')}&url=${encodeURIComponent('https://arquitrivia.com')}`, '_blank')}
                      className="bg-[#faf9f6] text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white border-4 border-black font-black text-lg px-6 py-4 flex items-center gap-3 uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                    >
                      <Twitter size={24} strokeWidth={3} /> X (Twitter)
                    </button>
                    <button
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://arquitrivia.com')}`, '_blank')}
                      className="bg-[#faf9f6] text-[#4267B2] hover:bg-[#4267B2] hover:text-white border-4 border-black font-black text-lg px-6 py-4 flex items-center gap-3 uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                    >
                      <Facebook size={24} strokeWidth={3} /> Facebook
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className={`${copiedLink ? 'bg-[#00ff66] text-black' : 'bg-[#faf9f6] text-black hover:bg-black hover:text-white'} border-4 border-black font-black text-lg px-6 py-4 flex items-center gap-3 uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]`}
                    >
                      <Link size={24} strokeWidth={3} /> {copiedLink ? '¡Enlace Copiado!' : 'Copiar Link'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="historia" className="border-t-4 border-black bg-[#ffe600] relative z-10">
            <div className="max-w-4xl mx-auto px-6 py-24 text-center">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-8 uppercase">Nacido por necesidad</h2>
              <p className="text-xl md:text-2xl font-bold leading-relaxed mb-8">
                "Esta herramienta fue creada porque tener que ver otra presentación de PowerPoint a las 7 AM sobre columnas dóricas era humanamente insostenible."
              </p>
              <div className="font-bold uppercase tracking-widest text-sm bg-white border-2 border-black inline-block px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">— Hecho por estudiantes, para estudiantes.</div>
            </div>
          </section>
        </main>
        <Footer />

        {showCommentModal && (
          <div className="fixed inset-0 bg-[#faf9f6]/95 z-[100] flex items-start justify-center p-4 pt-12 md:pt-20 backdrop-blur-md overflow-y-auto">
            <div className="relative z-10 w-full max-w-4xl bg-[#ff3366] border-4 border-black p-6 md:p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] mb-24 shrink-0">
              <button
                onClick={() => setShowCommentModal(false)}
                aria-label="Cerrar modal de comentarios"
                className="absolute top-4 right-4 bg-white border-4 border-black p-2 hover:bg-[#ffe600] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#00d0ff]"
              >
                <X size={24} strokeWidth={4} />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white" style={{ textShadow: '3px 3px 0px #000' }}>Deja tu firma</h2>
                <p className="text-white font-bold text-lg">Nos ayuda muchísimo a mejorar la plataforma.</p>
              </div>

              <form onSubmit={handleSubmitComment} className="bg-white border-4 border-black p-6 md:p-8 relative z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-left">
                <div className="space-y-6">
                  <div>
                    <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Tu Nombre o Apodo</label>
                    <input type="text" value={newCommentName} onChange={(e) => setNewCommentName(e.target.value)} placeholder="Ej: Profe Roberto, Ana..." required className="w-full bg-[#faf9f6] border-4 border-black px-4 py-3 font-bold focus:outline-none focus:bg-[#ffe600]/20 transition-colors shadow-inner" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Tu Rol</label>
                      <div className="relative">
                        <select value={newCommentRole} onChange={(e) => setNewCommentRole(e.target.value)} className="w-full bg-[#faf9f6] border-4 border-black px-4 py-3 font-bold focus:outline-none focus:ring-4 focus:ring-[#ffe600] appearance-none transition-colors shadow-inner uppercase text-sm cursor-pointer">
                          <option value="Profesor">Profesor / Docente</option>
                          <option value="Estudiante">Estudiante / Alumno</option>
                          <option value="Arquitecto">Arquitecto Profesional</option>
                          <option value="Otro">Otro</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight size={20} className="rotate-90" /></div>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Universidad / Institución (Opcional)</label>
                      <input type="text" value={newCommentSchool} onChange={(e) => setNewCommentSchool(e.target.value)} placeholder="Ej: UNAM, Tec..." className="w-full bg-[#faf9f6] border-4 border-black px-4 py-3 font-bold focus:outline-none focus:bg-[#ffe600]/20 transition-colors shadow-inner" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Calificación</label>
                    <div className="flex gap-2 bg-[#faf9f6] border-4 border-black p-3 w-fit shadow-inner">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button type="button" key={star} onClick={() => setNewCommentRating(star)} className="hover:scale-110 transition-transform">
                          <Star size={32} fill={newCommentRating >= star ? "#000" : "transparent"} className="text-black" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Comentarios sobre tu experiencia</label>
                    <textarea value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} rows="3" required placeholder="Cuéntanos cómo fue la dinámica con tu grupo..." className="w-full bg-[#faf9f6] border-4 border-black px-4 py-3 font-medium focus:outline-none focus:bg-[#ffe600]/20 transition-colors shadow-inner resize-none" />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Evidencia de clase (Opcional 📸)</label>
                    <div className="relative overflow-hidden bg-[#faf9f6] border-4 border-black border-dashed p-6 text-center hover:bg-[#ffe600]/20 transition-colors cursor-pointer group">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <Camera size={32} className="text-gray-400 group-hover:text-black transition-colors" />
                        <span className="font-bold uppercase text-sm text-gray-500 group-hover:text-black transition-colors">
                          {newCommentImage ? "¡Foto cargada! Haz clic para cambiarla" : "Haz clic aquí para subir una foto"}
                        </span>
                      </div>
                    </div>
                    {newCommentImage && (
                      <div className="mt-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-32 h-32 relative transform -rotate-2 bg-white p-2">
                        <img src={newCommentImage} alt="Preview" className="w-full h-full object-cover border-2 border-black" />
                        <button type="button" onClick={() => setNewCommentImage(null)} aria-label="Eliminar foto cargada" className="absolute -top-3 -right-3 bg-[#ff3366] text-white border-2 border-black p-1 hover:scale-110 transition-transform z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black" title="Eliminar foto">
                          <X size={16} strokeWidth={4} />
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="w-full bg-black text-white hover:bg-[#ffe600] hover:text-black font-black text-xl py-5 border-4 border-black transition-all flex justify-center items-center gap-3 uppercase tracking-wide shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] mt-4 disabled:bg-gray-400"
                  >
                    {isSubmittingComment ? <Loader2 className="animate-spin" /> : <MessageSquareHeart size={24} />}
                    {isSubmittingComment ? "Publicando..." : "Pegar en la Pizarra"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showQuickPlayModal && (
          <div className="fixed inset-0 bg-[#faf9f6]/95 z-[100] flex items-start justify-center p-4 pt-8 md:pt-12 backdrop-blur-md overflow-y-auto">
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20" style={{
              backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}></div>
            <div className="relative z-10 w-full max-w-4xl bg-white border-4 border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-16 shrink-0">
              <button
                onClick={() => setShowQuickPlayModal(false)}
                aria-label="Cerrar modal"
                className="absolute top-3 right-3 bg-white border-4 border-black p-1.5 hover:bg-[#ffe600] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#00d0ff]"
              >
                <X size={20} strokeWidth={3} />
              </button>

              <div className="mb-6 max-w-2xl">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4">Partida Rápida (1 vs 1)</h2>

                <label className="block text-left font-bold uppercase text-xs mb-3 text-gray-500">¿Quiénes van a jugar? (Si estás solo, llena uno)</label>

                <div className="flex flex-col md:flex-row gap-3 mb-5">
                  <input
                    type="text"
                    value={quickPlayNames[0]}
                    onChange={(e) => handleUpdateQuickPlayName(0, e.target.value)}
                    placeholder="Jugador 1 (Ej: René)"
                    className="flex-1 bg-[#faf9f6] border-4 border-black px-4 py-2.5 font-bold text-base focus:outline-none focus:bg-[#ffe600]/20 transition-colors shadow-inner"
                  />
                  <input
                    type="text"
                    value={quickPlayNames[1]}
                    onChange={(e) => handleUpdateQuickPlayName(1, e.target.value)}
                    placeholder="Jugador 2 (Opcional)"
                    className="flex-1 bg-[#faf9f6] border-4 border-black px-4 py-2.5 font-bold text-base focus:outline-none focus:bg-[#00d0ff]/20 transition-colors shadow-inner"
                  />
                </div>
                <p className="text-gray-600 font-bold text-sm">Selecciona un tema para iniciar la batalla al instante:</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRELOADED_BOARDS.map((board, idx) => (
                  <button
                    key={board.id}
                    onClick={() => handleSelectQuickPlayBoard(idx)}
                    className="text-left bg-[#faf9f6] border-4 border-black p-4 group transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] active:bg-gray-100 flex flex-col h-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#ff3366]"
                  >
                    <div className="w-10 h-10 border-2 border-black mb-3 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:-rotate-6 transition-transform duration-300" style={{ backgroundColor: board.color }}>
                      <BookOpen size={20} strokeWidth={2.5} className={board.color === '#00d0ff' || board.color === '#00ff66' || board.color === '#ffe600' ? 'text-black' : 'text-white'} />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight mb-1 leading-tight group-hover:text-black">{board.title}</h3>
                    <p className="text-gray-600 font-medium text-xs leading-relaxed flex-grow">{board.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-black/50 group-hover:text-black">
                      Jugar ahora <ChevronRight size={14} strokeWidth={3} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VISTA: SETUP / LOGIN ---
  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-black flex flex-col relative overflow-x-hidden font-sans">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 fixed" style={{
          backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        <header className="relative z-10 border-b-4 border-black bg-white px-6 py-4 flex justify-between items-center mb-8 sticky top-0 shrink-0">
          <button onClick={() => setGameState('landing')} className="flex items-center gap-2 font-bold uppercase hover:underline">
            <ArrowLeft size={20} /> Inicio
          </button>
          <Logo className="text-xl" />
        </header>

        <main className="relative z-10 max-w-6xl w-full mx-auto px-4 flex-1 pb-12 flex flex-col gap-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <h2 className="text-3xl font-black uppercase mb-2">Paso 1: Participantes</h2>
              <p className="text-gray-600 font-medium mb-8">Ingresa los nombres de los equipos que van a jugar en esta sesión.</p>

              <div className="flex-1 flex flex-col">
                {teams.length === 0 && (
                  <div className="bg-[#faf9f6] border-2 border-black border-dashed p-6 text-center text-gray-400 font-bold uppercase text-sm mb-6 flex-1 flex items-center justify-center">
                    Nadie se ha registrado aún
                  </div>
                )}
                <ul className="space-y-3 mb-6 overflow-y-auto max-h-60">
                  {teams.map((t, index) => (
                    <li key={t.id} className="flex justify-between items-center bg-[#faf9f6] border-2 border-black p-3 group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="font-bold flex items-center gap-3">
                        <span className="bg-black text-white w-6 h-6 flex items-center justify-center text-xs rounded-full">{index + 1}</span>
                        {t.name}
                      </span>
                      <button onClick={() => handleRemoveTeam(t.id)} aria-label={`Eliminar equipo ${t.name}`} className="text-gray-400 hover:text-[#ff3366] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff3366]">
                        <Trash2 size={20} />
                      </button>
                    </li>
                  ))}
                </ul>
                {teams.length < 4 ? (
                  <form onSubmit={handleAddTeam} className="flex gap-2 mt-auto">
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Ej: Fila 1, Los Arquitectos..."
                      className="flex-1 px-4 py-3 bg-[#faf9f6] border-2 border-black font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#ffe600] placeholder:text-gray-400 placeholder:font-medium transition-colors"
                    />
                    <button type="submit" className="bg-black text-white hover:bg-[#ffe600] hover:text-black border-2 border-black px-5 flex items-center justify-center transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                      <Plus size={24} /> Agregar
                    </button>
                  </form>
                ) : (
                  <div className="bg-[#ffe600] border-2 border-black p-3 text-xs font-bold uppercase tracking-widest text-center mt-auto">
                    Máximo de 4 equipos alcanzado
                  </div>
                )}
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3 text-center">Recomendado: 2 a 4 equipos. Si tu grupo es grande, divídelo en pocos equipos grandes.</p>
              </div>
            </div>

            <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <h2 className="text-3xl font-black uppercase mb-2">Paso 2: Tablero</h2>
              <p className="text-gray-600 font-medium mb-6">Selecciona qué tablero proyectarás a tu clase.</p>

              <div className="mb-8 flex-1">
                <label className="block font-bold uppercase tracking-widest text-xs mb-3 text-gray-500">Tablero Seleccionado</label>
                <div className="relative">
                  <select
                    value={selectedBoardId}
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                    className="w-full bg-[#faf9f6] border-4 border-black px-4 py-4 font-black uppercase tracking-wide focus:outline-none focus:ring-4 focus:ring-[#ffe600] cursor-pointer appearance-none shadow-inner"
                  >
                    <option value="custom">✨ {boardCode ? `Tablero Cloud: ${boardCode}` : 'Mi Tablero Personalizado'}</option>
                    <optgroup label="Librería arquitrivia">
                      {PRELOADED_BOARDS.map(board => (
                        <option key={board.id} value={board.id}>{board.title}</option>
                      ))}
                    </optgroup>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronRight size={24} className="rotate-90" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                disabled={teams.length === 0}
                className={`w-full font-black text-xl py-6 border-4 border-black transition-all flex justify-center items-center gap-3 uppercase tracking-wide mt-auto ${
                  teams.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]'
                    : 'bg-[#00ff66] hover:bg-black text-black hover:text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[8px] hover:translate-y-[8px]'
                }`}
              >
                Comenzar Juego <Play size={28} fill="currentColor" />
              </button>
              {teams.length === 0 && (
                <p className="text-center text-xs font-bold text-[#ff3366] mt-4 uppercase tracking-widest">* Añade al menos 1 equipo para jugar</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mt-4">
            {/* Card izquierda: Cargar desde la nube */}
            <div className="bg-[#00d0ff] border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-white border-4 border-black p-3 shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -rotate-3">
                  <Cloud size={28} className="text-[#00d0ff]" />
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase leading-tight">¿Ya tienes código?</h3>
              </div>
              <p className="text-black/80 font-bold text-sm mb-5">Si alguien te compartió un código de tablero, introdúcelo aquí para cargarlo y jugar al instante.</p>
              <form onSubmit={handleSearchCloudBoard} className="flex flex-col sm:flex-row gap-2 mt-auto">
                <input
                  type="text"
                  value={searchCloudCode}
                  onChange={(e) => setSearchCloudCode(e.target.value.toUpperCase())}
                  placeholder="EJ: ARQ-X7B2"
                  className="flex-1 bg-white border-4 border-black px-4 py-3 font-black text-center tracking-widest uppercase focus:outline-none focus:ring-4 focus:ring-[#ffe600] shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchCloudCode.trim()}
                  className="bg-black text-white px-5 py-3 border-4 border-black font-black uppercase text-sm hover:bg-[#ffe600] hover:text-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  Cargar
                </button>
              </form>
              {cloudError && <p className="text-black bg-white border-2 border-black font-bold text-xs text-center mt-3 p-2">{cloudError}</p>}
            </div>

            {/* Card derecha: Crear tablero */}
            <div className="bg-[#ffe600] border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col group relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                <Settings size={180} />
              </div>
              <div className="relative z-10 flex items-center gap-4 mb-4">
                <div className="bg-white border-4 border-black p-3 shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -rotate-3">
                  <Settings size={28} className="text-black" />
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase leading-tight">¿Y si fuera tu temario?</h3>
              </div>
              <p className="relative z-10 text-black/80 font-bold text-sm mb-5">Mete las preguntas y respuestas de TU materia. Editor visual, 10 minutos, una partida hecha a tu medida.</p>
              <button
                onClick={handleEnterEditor}
                className="relative z-10 mt-auto w-full bg-black text-white hover:bg-white hover:text-black font-black text-base md:text-lg py-4 px-6 border-4 border-black transition-all flex justify-center items-center gap-2 uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
              >
                <Settings size={20} /> Haz un tablero para tu materia
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- VISTA: ABOUT / LEAD GEN ---
  if (gameState === 'about') {
    return (
      <div className="min-h-screen bg-[#ffe600] text-black font-sans selection:bg-black selection:text-white relative flex flex-col overflow-x-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10" style={{
          backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        <header className="relative z-10 border-b-4 border-black bg-white px-6 py-4 flex justify-between items-center sticky top-0 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
          <button onClick={() => setGameState('landing')} className="flex items-center gap-2 font-bold uppercase hover:underline">
            <ArrowLeft size={20} /> Volver al inicio
          </button>
          <Logo className="text-xl" />
        </header>

        <main className="relative z-10 max-w-4xl mx-auto px-6 py-20 md:py-32 flex-1">
          <div className="bg-white border-4 border-black p-8 md:p-16 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <div className="inline-block bg-[#00d0ff] border-2 border-black px-4 py-2 font-bold text-xs uppercase tracking-widest mb-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Desarrollo a la medida
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-8 uppercase">
              ¿Quieres desarrollar algo así para tu escuela o corporativo?
            </h1>

            <div className="text-lg md:text-xl font-medium text-gray-700 space-y-6 mb-12 leading-relaxed">
              <p>
                <strong>arquitrivia</strong> nació como una solución específica, pero el motor detrás de esto puede adaptarse a <strong>cualquier tema, universidad, o programa de capacitación corporativa.</strong>
              </p>
              <p>
                Si quieres una plataforma gamificada, rápida, sin burocracia, y con un diseño de clase mundial (nada de plantillas aburridas), estás en el lugar correcto. Let's talk.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://reneblanco.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white hover:bg-[#ff3366] font-black text-xl px-10 py-5 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] flex items-center justify-center gap-3 uppercase tracking-wide"
              >
                Visitar Portafolio <ArrowUpRight size={24} strokeWidth={3} />
              </a>
              <a
                href="mailto:hola@arquitrivia.com"
                className="bg-[#faf9f6] text-black hover:bg-[#00ff66] font-black text-xl px-10 py-5 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] flex items-center justify-center gap-3 uppercase tracking-wide"
              >
                <Mail size={24} strokeWidth={3} /> Email Me
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- VISTA: PRIVACIDAD ---
  if (gameState === 'privacy') {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-black font-sans relative flex flex-col">
        <header className="relative z-50 border-b-4 border-black bg-white px-6 py-4 flex justify-between items-center sticky top-0 shrink-0">
          <button onClick={() => setGameState('landing')} className="flex items-center gap-2 font-bold uppercase hover:underline text-sm">
            <ArrowLeft size={18} /> Volver al inicio
          </button>
          <Logo className="text-base" />
        </header>

        <main className="relative z-10 max-w-2xl mx-auto px-6 py-10 md:py-16 flex-1">
          <div className="bg-white border-4 border-black p-6 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="inline-block bg-[#00d0ff] border-4 border-black px-3 py-1.5 font-black text-[11px] uppercase tracking-widest mb-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -rotate-2">
              Política de Privacidad
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2 uppercase">Cómo manejamos tus datos</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">Última actualización: mayo de 2026</p>

            <div className="space-y-6 text-gray-800 font-medium leading-relaxed text-sm md:text-base">
              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Resumen rápido</h2>
                <p>arquitrivia es una herramienta gratuita para jugar trivia en clase. No vendemos tus datos, no enviamos publicidad, no usamos tracking de terceros más allá del estrictamente necesario para que la plataforma funcione. Si quieres detalle, sigue leyendo.</p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Qué datos recolectamos</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Identificador anónimo de sesión.</strong> Cuando entras a arquitrivia, Firebase te asigna un ID anónimo aleatorio. No tiene tu nombre, tu correo ni nada identificable. Solo sirve para que puedas guardar tableros y postear comentarios.</li>
                  <li><strong>Tableros que creas.</strong> Si guardas un tablero en la nube, almacenamos su contenido (categorías, preguntas, respuestas) junto con el código que generamos para él.</li>
                  <li><strong>Comentarios y testimonios.</strong> Si dejas un comentario, guardamos el nombre que escribes, tu rol, institución (si la diste), texto y la imagen opcional que subiste.</li>
                  <li><strong>Estadísticas anónimas de uso.</strong> Contamos cuántas partidas se han jugado en total. No rastreamos quién las juega.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Qué NO recolectamos</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Tu correo electrónico</li>
                  <li>Tu nombre real (a menos que lo escribas tú al postear comentario)</li>
                  <li>Tu ubicación</li>
                  <li>Información de pago (no cobramos)</li>
                  <li>Tu actividad fuera de arquitrivia.com</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Servicios de terceros que usamos</h2>
                <p>arquitrivia corre sobre estas plataformas, que tienen sus propias políticas de privacidad:</p>
                <ul className="list-disc list-inside space-y-2 mt-3">
                  <li><strong>Firebase (Google):</strong> autenticación anónima y base de datos de tableros y comentarios.</li>
                  <li><strong>Netlify:</strong> hosting del sitio.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Cookies</h2>
                <p>arquitrivia no usa cookies de marketing ni de tracking de terceros. Sí usamos almacenamiento local del navegador (localStorage) para guardar tu progreso de partida actual — eso vive solo en tu dispositivo y no nos llega a nosotros.</p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Tus derechos</h2>
                <p>Si quieres que borremos un comentario que dejaste o un tablero que creaste, escríbenos a <a href="mailto:hola@arquitrivia.com" className="text-black underline hover:text-[#ff3366]">hola@arquitrivia.com</a> con suficiente detalle para identificarlo (nombre que usaste, fecha aproximada, código del tablero). Lo borramos sin pedir más explicaciones.</p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Contacto</h2>
                <p>arquitrivia es operada por un equipo de estudiantes de arquitectura. Para cualquier duda sobre privacidad, escribe a <a href="mailto:hola@arquitrivia.com" className="text-black underline hover:text-[#ff3366]">hola@arquitrivia.com</a>.</p>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- VISTA: TÉRMINOS ---
  if (gameState === 'terms') {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-black font-sans relative flex flex-col">
        <header className="relative z-50 border-b-4 border-black bg-white px-6 py-4 flex justify-between items-center sticky top-0 shrink-0">
          <button onClick={() => setGameState('landing')} className="flex items-center gap-2 font-bold uppercase hover:underline text-sm">
            <ArrowLeft size={18} /> Volver al inicio
          </button>
          <Logo className="text-base" />
        </header>

        <main className="relative z-10 max-w-2xl mx-auto px-6 py-10 md:py-16 flex-1">
          <div className="bg-white border-4 border-black p-6 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="inline-block bg-[#ffe600] border-4 border-black px-3 py-1.5 font-black text-[11px] uppercase tracking-widest mb-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -rotate-2">
              Términos de Uso
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2 uppercase">Las reglas de la casa</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">Última actualización: mayo de 2026</p>

            <div className="space-y-6 text-gray-800 font-medium leading-relaxed text-sm md:text-base">
              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Qué es arquitrivia</h2>
                <p>arquitrivia.com es una plataforma web gratuita para que profesores y alumnos jueguen trivia en clase. No requiere registro ni pago. Al usarla, aceptas estos términos.</p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Uso aceptable</h2>
                <p>Puedes usar arquitrivia para fines educativos, profesionales o personales. Lo que <strong>no</strong> puedes hacer:</p>
                <ul className="list-disc list-inside space-y-2 mt-3">
                  <li>Subir contenido que viole derechos de terceros (texto copiado de libros sin autorización, imágenes con copyright, etc.).</li>
                  <li>Subir contenido ofensivo, ilegal, sexualmente explícito, violento o discriminatorio.</li>
                  <li>Usar la plataforma para spam, fraude, suplantación de identidad o actividades comerciales no autorizadas.</li>
                  <li>Intentar romper, hackear o sobrecargar el sistema.</li>
                  <li>Usar bots automatizados para crear tableros, comentarios o partidas masivamente.</li>
                </ul>
                <p className="mt-3">Nos reservamos el derecho de eliminar contenido o bloquear acceso a usuarios que violen estas reglas.</p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Tu contenido</h2>
                <p>Los tableros, preguntas y comentarios que creas son tuyos. Tú mantienes los derechos sobre ellos. Pero al subirlos a arquitrivia, nos das permiso de almacenarlos, mostrarlos y permitir que otros usuarios accedan a ellos (solo si los compartes públicamente o por código). No los vamos a vender ni a usar fuera de la plataforma.</p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Disponibilidad y errores</h2>
                <p>arquitrivia se ofrece "tal cual está". Hacemos nuestro mejor esfuerzo por mantenerla funcionando, pero no garantizamos disponibilidad 24/7 ni que esté libre de errores. Si pierdes un tablero por una falla técnica, lo lamentamos pero no nos hacemos responsables.</p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Marcas y propiedad intelectual</h2>
                <p>"arquitrivia" y el diseño visual de la plataforma son nuestros. No los uses para crear productos derivados sin permiso. El código fuente puede abrirse o mantenerse privado según decisión del equipo.</p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Cambios a estos términos</h2>
                <p>Podemos actualizar estos términos con el tiempo. Si lo hacemos, cambiamos la fecha al inicio del documento. Si sigues usando arquitrivia después del cambio, asumimos que aceptas la nueva versión.</p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-black uppercase mb-2">Contacto</h2>
                <p>Para cualquier duda sobre estos términos, escribe a <a href="mailto:hola@arquitrivia.com" className="text-black underline hover:text-[#ff3366]">hola@arquitrivia.com</a>.</p>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- VISTA: EDITOR DE TABLEROS (NUBE) ---
  if (gameState === 'editor') {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-black flex flex-col font-sans relative overflow-x-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 fixed" style={{
          backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        <header className="relative z-50 border-b-4 border-black bg-white px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 shadow-sm shrink-0 gap-2">
          <button onClick={() => setGameState('setup')} className="flex items-center gap-2 font-bold uppercase hover:underline text-xs md:text-sm shrink-0">
            <ArrowLeft size={18} /> <span className="hidden sm:inline">Cancelar y Volver</span>
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleStartFreshBoard}
              className="flex items-center gap-1 md:gap-2 bg-white border-2 border-black text-black px-3 md:px-4 py-2 font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-[#ff3366] hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
              title="Empezar un tablero nuevo desde cero"
            >
              <RotateCcw size={14} /> <span className="hidden md:inline">Empezar de cero</span><span className="md:hidden">Nuevo</span>
            </button>
            <button
              onClick={handleSaveEditor}
              disabled={isSaving}
              className="flex items-center gap-1 md:gap-2 bg-[#ffe600] border-2 border-black text-black px-3 md:px-5 py-2 font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-black hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />}
              {isSaving ? "Guardando..." : "Guardar en la Nube"}
            </button>
          </div>
        </header>

        <main className="relative z-10 flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto pb-20">
          <div className="bg-[#faf9f6] border-4 border-black p-6 mb-8 flex flex-col md:flex-row gap-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] items-center">
            <div className="bg-[#00d0ff] border-4 border-black p-4 shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Info size={32} />
            </div>
            <div>
              <h3 className="font-black text-xl uppercase mb-2">Instrucciones del Editor</h3>
              <ul className="text-gray-700 font-medium space-y-1 text-sm list-disc list-inside">
                <li>Puedes tener <strong>entre 1 y 6 categorías</strong> (columnas) en tu tablero. Añade o elimina usando los botones de abajo.</li>
                <li>Las preguntas de <strong>100 puntos</strong> deben ser las más fáciles.</li>
                <li>Las preguntas de <strong>500 puntos</strong> deben ser las más difíciles.</li>
                <li>Al hacer clic en "Guardar en la Nube" se generará un código para que puedas abrir este tablero en cualquier computadora.</li>
              </ul>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div>
              <h3 className="font-black text-xl mb-1 uppercase flex items-center gap-2">
                Código Cloud
                {!boardCode && <span className="bg-[#ff3366] text-white border-2 border-black text-[10px] px-2 py-0.5 uppercase tracking-widest font-bold">No guardado</span>}
                {boardCode && <span className="bg-[#00ff66] text-black border-2 border-black text-[10px] px-2 py-0.5 uppercase tracking-widest font-bold">Activo</span>}
              </h3>
              <p className="text-gray-600 font-medium text-sm">
                {boardCode
                  ? "Anota este código. Podrás usarlo en la pantalla de inicio para cargar este tablero."
                  : "Guarda el tablero para generar un código único."}
              </p>
            </div>
            <input
              type="text"
              value={boardCode || "----"}
              disabled
              className={`bg-gray-100 border-4 border-black text-black px-4 py-3 font-mono text-xl font-black text-center tracking-widest w-full md:w-48 uppercase cursor-not-allowed ${!boardCode ? 'opacity-50' : ''}`}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-6 items-center">
            {editingCategories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveEditCatIndex(idx)}
                className={`px-4 md:px-6 py-3 border-4 border-black font-black uppercase tracking-widest transition-all text-center text-sm ${
                  activeEditCatIndex === idx
                    ? 'bg-black text-white shadow-[6px_6px_0px_0px_rgba(255,230,0,1)] -translate-y-1'
                    : 'bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'
                }`}
              >
                {cat.name || `Cat ${idx + 1}`}
              </button>
            ))}

            {editingCategories.length < 6 && (
              <button
                onClick={handleAddCategory}
                className="ml-2 px-4 py-3 bg-[#00ff66] border-4 border-black font-black uppercase tracking-widest text-sm flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
                title="Añadir nueva categoría"
              >
                <Plus size={18} strokeWidth={3} /> Añadir Columna
              </button>
            )}
          </div>

          {editingCategories[activeEditCatIndex] && (
            <div className="bg-white border-4 border-black p-4 md:p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative">
              <div className="mb-8 border-b-4 border-black pb-8 flex flex-col md:flex-row gap-4 justify-between md:items-end">
                <div className="flex-1">
                  <label className="block font-black uppercase tracking-widest text-sm mb-3 text-gray-500">Título de esta Categoría</label>
                  <input
                    type="text"
                    value={editingCategories[activeEditCatIndex].name}
                    onChange={(e) => handleUpdateCategoryName(e.target.value)}
                    placeholder="Ej: Estructuras Metálicas"
                    className="w-full bg-[#faf9f6] border-4 border-black px-5 py-4 text-2xl font-black uppercase tracking-tighter focus:outline-none focus:bg-[#ffe600]/20 transition-colors shadow-inner"
                  />
                </div>

                {editingCategories.length > 1 && (
                  <button
                    onClick={handleRemoveCategory}
                    className="bg-white text-[#ff3366] border-4 border-[#ff3366] hover:bg-[#ff3366] hover:text-white px-6 py-4 font-bold uppercase tracking-widest text-sm flex items-center gap-2 transition-colors shadow-[6px_6px_0px_0px_rgba(255,51,102,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]"
                  >
                    <Trash2 size={20} strokeWidth={3} /> Eliminar Categoría
                  </button>
                )}
              </div>

              <div className="space-y-8">
                {editingCategories[activeEditCatIndex].questions.map((q, qIndex) => (
                  <div key={q.id} className="bg-[#faf9f6] border-4 border-black p-4 md:p-6 flex flex-col md:flex-row gap-6 group hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                    <div className="shrink-0 flex items-center justify-center md:items-start">
                      <div className="bg-black text-[#ffe600] font-black text-2xl px-6 py-3 border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,230,0,1)]">
                        {q.points}
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block font-bold uppercase tracking-widest text-[10px] mb-2 text-gray-500 group-hover:text-black transition-colors">La Pregunta</label>
                        <textarea
                          value={q.q}
                          onChange={(e) => handleUpdateQuestion(qIndex, 'q', e.target.value)}
                          rows="2"
                          placeholder="Escribe la pregunta aquí..."
                          className="w-full bg-white border-4 border-black px-4 py-3 text-base font-medium focus:outline-none focus:bg-[#ffe600]/10 resize-none transition-colors shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block font-bold uppercase tracking-widest text-[10px] mb-2 text-gray-500 group-hover:text-black transition-colors">La Respuesta</label>
                        <textarea
                          value={q.a}
                          onChange={(e) => handleUpdateQuestion(qIndex, 'a', e.target.value)}
                          rows="2"
                          placeholder="Escribe la respuesta correcta..."
                          className="w-full bg-white border-4 border-black font-bold px-4 py-3 text-base focus:outline-none focus:bg-[#00ff66]/10 resize-none transition-colors shadow-inner text-black"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
        <Footer />

        {showFreshBoardConfirm && (
          <div className="fixed inset-0 bg-[#faf9f6]/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white border-4 border-black p-8 max-w-md w-full text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-5 inline-block bg-[#ff3366] text-white border-4 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <RotateCcw size={36} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">¿Empezar un tablero nuevo?</h2>
              <p className="text-gray-600 font-medium mb-3 text-sm leading-relaxed">
                Esto borrará lo que tienes ahora en el editor y empezarás un tablero en blanco.
              </p>
              {boardCode && (
                <p className="text-gray-700 font-bold mb-6 text-xs bg-[#faf9f6] border-2 border-black p-3">
                  No te preocupes: tu tablero anterior <span className="font-mono uppercase">{boardCode}</span> sigue guardado en la nube. Puedes recuperarlo con su código desde la pantalla de inicio.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFreshBoardConfirm(false)}
                  className="flex-1 bg-[#faf9f6] border-4 border-black hover:bg-white font-black py-3 uppercase tracking-wider text-sm transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[3px] hover:translate-x-[3px]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmFreshBoard}
                  className="flex-1 bg-black text-white border-4 border-black hover:bg-[#ff3366] hover:text-white font-black py-3 uppercase tracking-wider text-sm transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[3px] hover:translate-x-[3px]"
                >
                  Sí, empezar de cero
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VISTA: POST-GUARDADO ---
  if (gameState === 'editorSaved') {
    return (
      <div className="min-h-screen bg-[#00ff66] text-black font-sans relative flex flex-col overflow-x-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10" style={{
          backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        <header className="relative z-50 border-b-4 border-black bg-white px-6 py-4 flex justify-between items-center sticky top-0 shrink-0">
          <button onClick={() => setGameState('setup')} className="flex items-center gap-2 font-bold uppercase hover:underline text-sm">
            <ArrowLeft size={18} /> Volver a configurar partida
          </button>
          <Logo className="text-base" />
        </header>

        <main className="relative z-10 max-w-3xl mx-auto px-6 py-12 md:py-16 flex-1 w-full">
          <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="inline-block bg-black text-[#00ff66] border-4 border-black px-4 py-2 font-black text-xs uppercase tracking-widest mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2">
              ✓ Tablero guardado en la nube
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-3 uppercase">¡Listo, tu tablero está vivo!</h1>
            <p className="text-base md:text-lg font-bold text-gray-700 mb-8 leading-relaxed">
              Anota este código. Con él podrás abrir este tablero desde cualquier computadora — solo introdúcelo en la sección "¿Ya tienes código?" cuando vuelvas a entrar a arquitrivia.com.
            </p>

            <div className="mb-8">
              <label className="block font-black uppercase tracking-widest text-xs text-gray-500 mb-3">Tu código:</label>
              <div className="bg-[#ffe600] border-4 border-black px-6 py-6 md:py-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4">
                <span className="font-mono font-black text-3xl md:text-5xl tracking-widest uppercase break-all">{boardCode}</span>
                <button
                  onClick={handleCopyBoardCode}
                  aria-label="Copiar código al portapapeles"
                  className={`shrink-0 ${codeJustCopied ? 'bg-[#00ff66] text-black' : 'bg-black text-white hover:bg-white hover:text-black'} border-4 border-black px-4 py-2 md:px-5 md:py-3 font-black uppercase tracking-widest text-xs md:text-sm transition-colors flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#ff3366]`}
                >
                  {codeJustCopied ? <><Check size={16} /> ¡Copiado!</> : <><Link size={16} /> Copiar</>}
                </button>
              </div>
            </div>

            <div className="border-t-4 border-black pt-8">
              <h2 className="font-black uppercase tracking-widest text-xs text-gray-500 mb-4">¿Y ahora?</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePlaySavedBoard}
                  disabled={teams.length === 0}
                  className={`flex-1 font-black text-base md:text-lg py-4 px-6 border-4 border-black transition-all flex justify-center items-center gap-2 uppercase tracking-wide ${
                    teams.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                      : 'bg-[#00ff66] hover:bg-black text-black hover:text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]'
                  }`}
                >
                  <Play size={20} fill="currentColor" /> Jugar este tablero ahora
                </button>
                <button
                  onClick={() => setGameState('setup')}
                  className="flex-1 bg-white text-black hover:bg-[#faf9f6] font-black text-base md:text-lg py-4 px-6 border-4 border-black transition-all flex justify-center items-center gap-2 uppercase tracking-wide shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]"
                >
                  <ArrowLeft size={20} /> Volver a configurar
                </button>
              </div>
              {teams.length === 0 && (
                <p className="text-center text-xs font-bold text-[#ff3366] mt-3 uppercase tracking-widest">* Necesitas al menos un equipo para empezar a jugar — vuelve a configurar partida</p>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- VISTA: POST-PARTIDA (LEAD GEN / FEEDBACK) ---
  if (gameState === 'postgame') {
    return (
      <div className="min-h-screen bg-[#00d0ff] text-black font-sans selection:bg-black selection:text-white relative flex flex-col overflow-x-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10" style={{
          backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        <header className="relative z-10 border-b-4 border-black bg-white px-6 py-4 flex justify-between items-center sticky top-0 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
          <button onClick={handleFinalizeCleanupToHome} className="flex items-center gap-2 font-bold uppercase hover:underline">
            <ArrowLeft size={20} /> Salir al inicio
          </button>
          <Logo className="text-xl" />
        </header>

        <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20 flex-1 w-full">
          <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">

            <div className="absolute top-10 right-10 opacity-10 pointer-events-none">
              <MessageSquareHeart size={200} />
            </div>
            <div className="inline-block bg-[#ffe600] border-4 border-black px-4 py-2 font-black text-sm uppercase tracking-widest mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2">
              Sesión Finalizada
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-4 uppercase relative z-10">
              Hiciste de esta clase algo inolvidable.
            </h1>

            <p className="text-lg md:text-xl font-bold text-gray-700 mb-10 relative z-10">
              arquitrivia es una herramienta 100% gratuita. Ayúdanos a expandir nuestra comunidad educativa dejando una breve reseña sobre cómo funcionó la dinámica con tus alumnos.
            </p>

            <form onSubmit={handleSubmitComment} className="bg-[#faf9f6] border-4 border-black p-6 md:p-8 relative z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black uppercase tracking-widest mb-6 border-b-4 border-black pb-4">Evalúa tu experiencia:</h3>

              <div className="space-y-6">
                <div>
                  <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Tu Nombre o Apodo</label>
                  <input
                    type="text"
                    value={newCommentName}
                    onChange={(e) => setNewCommentName(e.target.value)}
                    placeholder="Ej: Profe Roberto, Ana, Los Constructores..."
                    required
                    className="w-full bg-white border-4 border-black px-4 py-3 font-bold focus:outline-none focus:bg-[#ffe600]/20 transition-colors shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Tu Rol</label>
                    <div className="relative">
                      <select
                        value={newCommentRole}
                        onChange={(e) => setNewCommentRole(e.target.value)}
                        className="w-full bg-white border-4 border-black px-4 py-3 font-bold focus:outline-none focus:ring-4 focus:ring-[#ffe600] appearance-none transition-colors shadow-inner uppercase text-sm cursor-pointer"
                      >
                        <option value="Profesor">Profesor / Docente</option>
                        <option value="Estudiante">Estudiante / Alumno</option>
                        <option value="Arquitecto">Arquitecto Profesional</option>
                        <option value="Otro">Otro</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight size={20} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Universidad / Institución (Opcional)</label>
                    <input
                      type="text"
                      value={newCommentSchool}
                      onChange={(e) => setNewCommentSchool(e.target.value)}
                      placeholder="Ej: UNAM, Tec de Monterrey, UANL..."
                      className="w-full bg-white border-4 border-black px-4 py-3 font-bold focus:outline-none focus:bg-[#ffe600]/20 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Calificación</label>
                  <div className="flex gap-2 bg-white border-4 border-black p-3 w-fit shadow-inner">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewCommentRating(star)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star size={32} fill={newCommentRating >= star ? "#000" : "transparent"} className="text-black" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Comentarios sobre la plataforma</label>
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    rows="3"
                    required
                    placeholder="Cuéntanos cómo fue la dinámica con tu grupo..."
                    className="w-full bg-white border-4 border-black px-4 py-3 font-medium focus:outline-none focus:bg-[#ffe600]/20 transition-colors shadow-inner resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-xs text-gray-500 mb-2">Evidencia de clase (Opcional 📸)</label>
                  <div className="relative overflow-hidden bg-white border-4 border-black border-dashed p-6 text-center hover:bg-[#ffe600]/20 transition-colors cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <Camera size={32} className="text-gray-400 group-hover:text-black transition-colors" />
                      <span className="font-bold uppercase text-sm text-gray-500 group-hover:text-black transition-colors">
                        {newCommentImage ? "¡Foto cargada! Haz clic para cambiarla" : "Haz clic aquí para subir una foto increíble de tu grupo (Max 2MB)"}
                      </span>
                    </div>
                  </div>
                  {newCommentImage && (
                    <div className="mt-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-32 h-32 relative transform -rotate-2 bg-white p-2">
                      <img src={newCommentImage} alt="Preview" className="w-full h-full object-cover border-2 border-black" />
                      <button
                        type="button"
                        onClick={() => setNewCommentImage(null)}
                        aria-label="Eliminar foto cargada"
                        className="absolute -top-3 -right-3 bg-[#ff3366] text-white border-2 border-black p-1 hover:scale-110 transition-transform z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
                        title="Eliminar foto"
                      >
                        <X size={16} strokeWidth={4} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="w-full bg-black text-white hover:bg-[#ffe600] hover:text-black font-black text-xl py-5 border-4 border-black transition-all flex justify-center items-center gap-3 uppercase tracking-wide shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] mt-4 disabled:bg-gray-400"
                >
                  {isSubmittingComment ? <Loader2 className="animate-spin" /> : <MessageSquareHeart size={24} />}
                  {isSubmittingComment ? "Publicando..." : "Publicar evaluación y finalizar"}
                </button>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- VISTA: TABLERO DE JUEGO EN VIVO ---
  return (
    <div className="h-screen bg-[#faf9f6] text-black flex flex-col font-sans select-none relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 fixed" style={{
        backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <header className="relative z-10 border-b-4 border-black bg-white px-4 md:px-6 py-3 flex justify-between items-center shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar flex-1 items-center justify-start md:justify-center pr-4">
          {teams.map(t => (
            <div key={t.id} className="flex flex-col items-center bg-white px-4 md:px-6 py-2 border-4 border-black min-w-[120px] md:min-w-[140px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest truncate w-full text-center mb-1">{t.name}</span>
              <span className="text-2xl md:text-3xl font-black">{t.score}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-4 ml-4 md:ml-8 shrink-0">
          <button
            onClick={() => setShowRulesModal(true)}
            className="px-4 py-2 md:px-5 md:py-3 border-4 border-black hover:bg-[#00d0ff] hover:text-black transition-all group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] bg-white flex items-center gap-2 font-black uppercase tracking-widest text-xs md:text-sm"
            title="Ver Reglas"
          >
            <Info size={18} className="group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Reglas</span>
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            aria-label="Terminar partida"
            className="px-4 py-2 md:px-5 md:py-3 border-4 border-black hover:bg-[#ff3366] hover:text-white transition-all group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] bg-white flex items-center gap-2 font-black uppercase tracking-widest text-xs md:text-sm focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#ff3366]"
            title="Terminar Partida"
          >
            <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-500" />
            <span className="hidden sm:inline">Terminar</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 p-3 md:p-6 max-w-[1600px] w-full mx-auto overflow-hidden">
        <div
          className="grid gap-2 md:gap-3 h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))`,
            gridTemplateRows: 'auto repeat(5, minmax(0, 1fr))'
          }}
        >
          {categories.map((cat, i) => (
            <div key={`header-${i}`} className="flex items-center justify-center text-center p-2 bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              <h3 className="font-black text-xs md:text-sm lg:text-base uppercase tracking-widest leading-tight">
                {cat.name || `Cat ${i + 1}`}
              </h3>
            </div>
          ))}

          {[0, 1, 2, 3, 4].map(rowIndex => (
            <React.Fragment key={`row-${rowIndex}`}>
              {categories.map((cat, colIndex) => {
                const q = cat.questions[rowIndex];
                return (
                  <div
                    key={q.id}
                    onClick={() => handleOpenQuestion(colIndex, rowIndex)}
                    className={`
                      relative flex items-center justify-center p-2 transition-all duration-200 border-4 border-black min-h-0
                      ${q.answered
                        ? 'bg-[#faf9f6] text-gray-300 cursor-default shadow-inner'
                        : 'bg-white cursor-pointer hover:bg-[#ffe600] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px]'}
                    `}
                  >
                    {!q.answered ? (
                      <span className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter">
                        {q.points}
                      </span>
                    ) : (
                      <div className="w-10 h-2 bg-gray-300"></div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </main>

      {activeQuestion && (
        <div className="fixed inset-0 bg-[#faf9f6]/95 backdrop-blur-md z-50 flex flex-col overflow-y-auto">
          <div className="fixed inset-0 z-0 pointer-events-none opacity-20" style={{
            backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
          <div className="min-h-full flex items-start justify-center p-4 pt-12 md:p-12 md:pt-20 text-center relative z-10 pb-24">
            <div className="animate-in fade-in zoom-in-95 duration-200 max-w-5xl w-full py-12 bg-white border-4 border-black p-6 md:p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] shrink-0">

              <div className="inline-flex items-center gap-3 px-6 py-2 border-4 border-black bg-[#ffe600] mb-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-black font-black text-sm uppercase tracking-widest">
                  {categories[activeQuestion.catIndex].name || "Categoría"} — {activeQuestion.points} PTS
                </h2>
              </div>

              {!showAnswer && (
                <div className="absolute top-6 right-6 md:top-12 md:right-12 z-20">
                  <div className={`border-4 border-black p-3 md:p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-w-[100px] md:min-w-[120px] transition-colors duration-300 ${timeLeft <= 5 ? 'bg-[#ff3366] text-white animate-pulse' : 'bg-white text-black'}`}>
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest mb-1">Tiempo</span>
                    <span className="text-4xl md:text-6xl font-black tabular-nums leading-none tracking-tighter">{timeLeft}</span>
                  </div>
                </div>
              )}

              <h1 className="text-black font-black text-4xl md:text-6xl lg:text-7xl leading-tight mb-16 tracking-tighter uppercase break-words">
                {activeQuestion.q}
              </h1>

              {!showAnswer ? (
                <>
                  {timeLeft === 0 && (
                    <div className="text-[#ff3366] font-black text-3xl uppercase tracking-widest mb-8 animate-bounce">
                      ¡TIEMPO AGOTADO!
                    </div>
                  )}
                  <button
                    onClick={handleShowAnswer}
                    className="bg-black hover:bg-[#ffe600] hover:text-black text-white border-4 border-black font-black text-xl px-12 py-6 transition-all duration-200 uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[8px] hover:translate-y-[8px]"
                  >
                    Revelar Respuesta
                  </button>
                </>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-300">
                  <div className="mb-16 border-t-4 border-black pt-10">
                    <span className="block text-gray-500 font-bold text-sm uppercase tracking-widest mb-4">Respuesta Oficial</span>
                    <span className="text-black font-black text-5xl md:text-7xl tracking-tighter leading-none uppercase bg-[#ffe600] px-4 py-2 inline-block border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] break-words max-w-full">{activeQuestion.a}</span>
                  </div>

                  <div className="bg-[#faf9f6] border-4 border-black p-8 max-w-5xl mx-auto shadow-inner">
                    <h3 className="text-black font-black mb-6 uppercase tracking-widest text-lg">Asignar Puntos</h3>
                    <div className="flex flex-wrap justify-center gap-6">
                      {teams.map(t => (
                        <div key={t.id} className="flex flex-col bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden min-w-[200px]">
                          <div className="bg-black text-white text-center font-black py-3 px-6 text-sm uppercase tracking-widest border-b-4 border-black">
                            {t.name}
                          </div>
                          <div className="flex items-stretch h-full">
                            <button
                              onClick={() => handleAwardPoints(t.id, activeQuestion.points)}
                              className="flex-1 hover:bg-[#00ff66] text-black px-4 py-5 flex flex-col items-center justify-center gap-1 transition-colors border-r-4 border-black group"
                              title="Respuesta Correcta"
                            >
                              <Check size={32} strokeWidth={4} className="group-hover:scale-110 transition-transform" />
                              <span className="font-black text-2xl">+{activeQuestion.points}</span>
                            </button>
                            <button
                              onClick={() => handleAwardPoints(t.id, -activeQuestion.points)}
                              className="flex-1 hover:bg-[#ff3366] hover:text-white text-black px-4 py-5 flex flex-col items-center justify-center gap-1 transition-colors group"
                              title="Respuesta Incorrecta"
                            >
                              <X size={32} strokeWidth={4} className="group-hover:scale-110 transition-transform" />
                              <span className="font-black text-2xl">-{activeQuestion.points}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={markQuestionAnswered}
                      className="mt-10 px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-200 border-4 border-transparent hover:border-black transition-all"
                    >
                      Cerrar sin asignar puntos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRulesModal && (
        <div className="fixed inset-0 bg-[#faf9f6]/95 z-[100] flex items-start justify-center p-4 pt-12 md:pt-20 backdrop-blur-md overflow-y-auto">
          <div className="relative z-10 w-full max-w-4xl bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] mb-24 shrink-0">
            <button
              onClick={() => setShowRulesModal(false)}
              aria-label="Cerrar modal de reglas"
              className="absolute top-4 right-4 bg-white border-4 border-black p-2 hover:bg-[#ffe600] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#00d0ff]"
            >
              <X size={24} strokeWidth={4} />
            </button>

            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-10 uppercase flex items-center gap-4">
              <Info size={40} className="text-[#00d0ff]" /> Reglas del Juego
            </h2>

            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="bg-[#00ff66] border-4 border-black w-12 h-12 shrink-0 flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">1</div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase mb-2">Acierta o Castiga</h3>
                  <p className="font-bold text-gray-700 leading-relaxed text-sm md:text-lg">
                    Dar la respuesta correcta suma los puntos. Responder mal <strong className="text-[#ff3366]">resta los puntos</strong> de tu marcador. Si no saben, mejor no respondan.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="bg-[#00d0ff] border-4 border-black w-12 h-12 shrink-0 flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">2</div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase mb-2">El Reloj Implacable</h3>
                  <p className="font-bold text-gray-700 leading-relaxed text-sm md:text-lg">
                    Tienen <strong>20 segundos</strong> para dar su respuesta definitiva. Si el reloj llega a cero, el tiempo se agota y nadie gana ni pierde.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="bg-[#ffe600] border-4 border-black w-12 h-12 shrink-0 flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">3</div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase mb-2">Pregunta Quemada</h3>
                  <p className="font-bold text-gray-700 leading-relaxed text-sm md:text-lg">
                    Una vez que el maestro revela la respuesta oficial, la casilla queda <strong>deshabilitada</strong> por el resto de la partida para todos.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="mt-12 w-full bg-black text-white hover:bg-[#00d0ff] hover:text-black font-black text-xl py-5 border-4 border-black transition-all uppercase tracking-wide shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[8px] hover:translate-y-[8px]"
            >
              ¡Entendido, a jugar!
            </button>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-[#faf9f6]/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-black p-10 max-w-md w-full text-center shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-6 inline-block bg-[#ff3366] text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <AlertTriangle size={48} strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">¿Terminar la Partida?</h2>
            <p className="text-gray-600 font-bold mb-10">
              Cerraremos el tablero y declararemos a los ganadores definitivos.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 bg-[#faf9f6] border-4 border-black hover:bg-white font-black py-4 uppercase tracking-wider transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[4px] hover:translate-x-[4px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinishGameInitiate}
                className="flex-1 bg-black text-white border-4 border-black hover:bg-[#ff3366] hover:text-white font-black py-4 uppercase tracking-wider transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[4px] hover:translate-x-[4px]"
              >
                Sí, Terminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
