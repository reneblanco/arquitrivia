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
          { id: "e3q1", points: 100, q: "Elemento vertical que soporta mainly esfuerzos de compresión.", a: "Columna", answered: false },
          { id: "e3q2", points: 200, q: "Elemento horizontal que soporta cargas transversales y trabaja a flexión.", a: "Viga", answered: false },
          { id: "e3q3", points: 300, q: "Parte de la estructura que transmite las cargas directamente al terreno.", a: "Cimentación (o Zapata)", answered: false },
          { id: "e3q4", points: 400, q: "Muro diseñado para resistir cargas horizontales paralelas a su plano (ej. sismos).", a: "Muro de Cortante / Muro de Carga", answered: false },
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
          { id: "e4q5", points: 500, q: "Concreto al que se le aplican esfuerzos de compresión internos antes de someterlo a cargas externas.", a: "Concreto Presforzado / Postensado", answered: false },
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
          { id: "u2q5", points: 500, q: "Límites lineales o rupturas en la continuity (ríos, vías de tren, muros).", a: "Bordes (Edges)", answered: false },
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
          { id: "s2q1", points: 100, q: "Aberturas en fachadas opuestas que permiten que el aire circule y enfríe el espacio naturally.", a: "Ventilación Cruzada", answered: false },
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
      setGameState('setup');
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

    const commentData = {
      name: newCommentName,
      role: newCommentRole,
      school: newCommentSchool,
      rating: newCommentRating,
      text: newCommentText,
      date: formattedDate,
      color: randomColor,
      image: newCommentImage,
      approved: false,
      timestamp: serverTimestamp()
    };

    try {
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
      alert("Hubo un error al publicar el comentario.");
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
          Custom App / Contacto
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 border-t-2 border-black/20 pt-6 mt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-black/60">
        <span>© {new Date().getFullYear()} arquitrivia. Todos los derechos reservados.</span>
        <span>Made with ❤️ in 🇲🇽 by <a href="https://reneblanco.com" target="_blank" rel="noopener noreferrer" className="text-black hover:text-[#ffe600] transition-colors underline font-black">reneblanco</a></span>
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

        <header className="relative z-10 border-b-4 border-black bg-white/90 backdrop-blur-sm sticky top-0 shrink-0">
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
                arquitrivia es la herramienta web diseñada para potenciar tu enseñanza. Convierte el repaso del temario en una competencia emocionante y mantén a todo tu grupo participando activamente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-2xl mb-10">
              <button
                onClick={() => setGameState('setup')}
                className="flex-1 bg-[#ffe600] text-black font-black text-lg md:text-xl px-8 py-6 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] flex items-center justify-center gap-3 uppercase tracking-wide"
              >
                Crea tu Tablero <Settings size={24} strokeWidth={3} />
              </button>
              <button
                onClick={() => setShowQuickPlayModal(true)}
                className="flex-1 bg-white text-black font-black text-lg md:text-xl px-8 py-6 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] flex items-center justify-center gap-3 uppercase tracking-wide"
              >
                Partida Rápida <Play size={24} strokeWidth={3} fill="currentColor" />
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
                  <p className="font-medium text-gray-600 leading-relaxed">Crea tus propias categorías y preguntas a la medida del temario de tu clase en nuestro potente editor visual.</p>
                </div>
                <div className="bg-[#faf9f6] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-start md:translate-y-8 hover:-translate-y-2 transition-transform">
                  <div className="bg-[#00d0ff] border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <MonitorPlay size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase">2. Proyecta</h3>
                  <p className="font-medium text-gray-600 leading-relaxed">Registra a los equipos participantes y proyecta la pantalla completa en el salón de clases. La interfaz está diseñada para verse increíble.</p>
                </div>
                <div className="bg-[#faf9f6] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-start hover:-translate-y-2 transition-transform">
                  <div className="bg-[#00ff66] border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Trophy size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase">3. Compite</h3>
                  <p className="font-medium text-gray-600 leading-relaxed">Los equipos eligen casillas por su valor en puntos. Revela la respuesta y asigna (o resta) puntos fácilmente desde el control maestro.</p>
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
                      <h3 className="text-2xl font-black uppercase mb-2">Acierta o Castiga (El Riesgo)</h3>
                      <p className="font-medium text-gray-700 leading-relaxed text-lg">
                        Si tu equipo da la respuesta correcta, ¡suman los puntos! Pero cuidado: si se equivocan intentando adivinar, <strong className="text-[#ff3366]">esos puntos se restan</strong> de su marcador. Si no están seguros, es mejor pasar en silencio. (El silencio no suma, pero tampoco resta).
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="bg-[#00d0ff] border-4 border-black w-12 h-12 shrink-0 flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">2</div>
                    <div>
                      <h3 className="text-2xl font-black uppercase mb-2">El Reloj Implacable</h3>
                      <p className="font-medium text-gray-700 leading-relaxed text-lg">
                        Tienen <strong>20 segundos</strong> en el reloj una vez que se abre la pregunta para debatir y gritar su respuesta definitiva. Si el reloj llega a cero sin una respuesta, se pierde la oportunidad de sumar (y nadie es penalizado).
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="bg-[#ffe600] border-4 border-black w-12 h-12 shrink-0 flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">3</div>
                    <div>
                      <h3 className="text-2xl font-black uppercase mb-2">Pregunta Quemada</h3>
                      <p className="font-medium text-gray-700 leading-relaxed text-lg">
                        Casilla abierta, casilla jugada. No importa si la acertaron, la fallaron o dejaron que se agotara el tiempo; una vez que el maestro revela la respuesta oficial, la casilla queda <strong>deshabilitada</strong> por el resto de la partida.
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
                  Descubre cómo estamos transformando la dinámica en el aula.
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
                    Impulsa la educación interactiva
                  </h2>

                  <p className="text-xl md:text-2xl font-bold text-black/80 mb-12 max-w-3xl mx-auto leading-relaxed">
                    Si esta herramienta ha aportado valor a tus sesiones, <strong>compártela con tu red docente</strong> y colegas académicos. arquitrivia es 100% gratuita, y tu recomendación nos permite seguir desarrollando tecnología educativa de primer nivel.
                  </p>

                  <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                    <button
                      onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Descubre arquitrivia: la herramienta 100% gratuita para gamificar tus clases de arquitectura. Cero fricción, cero costo. Pruébalo en tu clase 🚀🏛️ https://arquitrivia.com')}`, '_blank')}
                      className="bg-[#faf9f6] text-[#25D366] hover:bg-[#25D366] hover:text-white border-4 border-black font-black text-lg px-6 py-4 flex items-center gap-3 uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                    >
                      <MessageCircle size={24} strokeWidth={3} /> WhatsApp
                    </button>
                    <button
                      onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Descubre arquitrivia: la herramienta 100% gratuita para gamificar tus clases de arquitectura. Cero fricción, cero costo. Pruébalo en tu clase 🚀🏛️')}&url=${encodeURIComponent('https://arquitrivia.com')}`, '_blank')}
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
                className="absolute top-4 right-4 bg-white border-4 border-black p-2 hover:bg-[#ffe600] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20"
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
                        <button type="button" onClick={() => setNewCommentImage(null)} className="absolute -top-3 -right-3 bg-[#ff3366] text-white border-2 border-black p-1 hover:scale-110 transition-transform z-20" title="Eliminar foto">
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
          <div className="fixed inset-0 bg-[#faf9f6]/95 z-[100] flex items-start justify-center p-4 pt-12 md:pt-20 backdrop-blur-md overflow-y-auto">
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20" style={{
              backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}></div>
            <div className="relative z-10 w-full max-w-5xl bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] mb-24 shrink-0">
              <button
                onClick={() => setShowQuickPlayModal(false)}
                className="absolute top-4 right-4 bg-white border-4 border-black p-2 hover:bg-[#ffe600] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20"
              >
                <X size={24} strokeWidth={3} />
              </button>

              <div className="mb-10 max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">Partida Rápida (1 vs 1)</h2>

                <label className="block text-left font-bold uppercase text-sm mb-4 text-gray-500">¿Quiénes van a jugar? (Si estás solo, llena uno)</label>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <input
                    type="text"
                    value={quickPlayNames[0]}
                    onChange={(e) => handleUpdateQuickPlayName(0, e.target.value)}
                    placeholder="Jugador 1 (Ej: René)"
                    className="flex-1 bg-[#faf9f6] border-4 border-black px-6 py-4 font-bold text-xl focus:outline-none focus:bg-[#ffe600]/20 transition-colors shadow-inner"
                  />
                  <input
                    type="text"
                    value={quickPlayNames[1]}
                    onChange={(e) => handleUpdateQuickPlayName(1, e.target.value)}
                    placeholder="Jugador 2 (Opcional)"
                    className="flex-1 bg-[#faf9f6] border-4 border-black px-6 py-4 font-bold text-xl focus:outline-none focus:bg-[#00d0ff]/20 transition-colors shadow-inner"
                  />
                </div>
                <p className="text-gray-600 font-bold text-lg mb-4">Selecciona un tema para iniciar la batalla al instante:</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PRELOADED_BOARDS.map((board, idx) => (
                  <button
                    key={board.id}
                    onClick={() => handleSelectQuickPlayBoard(idx)}
                    className="text-left bg-[#faf9f6] border-4 border-black p-6 group transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] active:bg-gray-100 flex flex-col h-full"
                  >
                    <div className="w-12 h-12 border-2 border-black mb-4 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:-rotate-6 transition-transform duration-300" style={{ backgroundColor: board.color }}>
                      <BookOpen size={24} strokeWidth={2.5} className={board.color === '#00d0ff' || board.color === '#00ff66' || board.color === '#ffe600' ? 'text-black' : 'text-white'} />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-2 leading-tight group-hover:text-black">{board.title}</h3>
                    <p className="text-gray-600 font-medium text-sm leading-relaxed flex-grow">{board.description}</p>
                    <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/50 group-hover:text-black">
                      Jugar ahora <ChevronRight size={16} strokeWidth={3} />
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

          <div className="bg-[#00d0ff] border-4 border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="bg-white border-4 border-black p-4 shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-3">
                <Cloud size={40} className="text-[#00d0ff]" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-black uppercase mb-1">Cargar desde la Nube</h2>
                <p className="text-black/80 font-bold text-sm">¿Tienes un código de tablero? Introdúcelo aquí para descargarlo.</p>
              </div>
              <form onSubmit={handleSearchCloudBoard} className="w-full md:w-auto flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={searchCloudCode}
                  onChange={(e) => setSearchCloudCode(e.target.value.toUpperCase())}
                  placeholder="EJ: ARQ-X7B2"
                  className="bg-white border-4 border-black px-4 py-3 font-black text-center tracking-widest uppercase focus:outline-none focus:ring-4 focus:ring-[#ffe600] w-full md:w-48 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchCloudCode.trim()}
                  className="bg-black text-white px-6 py-3 border-4 border-black font-black uppercase text-sm hover:bg-[#ffe600] hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  Buscar
                </button>
              </form>
            </div>
            {cloudError && <p className="text-black bg-white border-2 border-black font-bold text-sm text-center mt-4 p-2">{cloudError}</p>}
          </div>

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
                      <button onClick={() => handleRemoveTeam(t.id)} className="text-gray-400 hover:text-[#ff3366] transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </li>
                  ))}
                </ul>
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

          <div className="bg-[#ffe600] border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-8 mt-4">
            <div className="absolute -right-20 -bottom-20 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
              <Settings size={300} />
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="inline-block bg-white border-2 border-black px-3 py-1 font-bold text-xs uppercase tracking-widest mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                La herramienta principal
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase mb-4 tracking-tighter">¡Crea tu propio Tablero!</h2>
              <p className="text-black/80 font-bold text-lg leading-relaxed">
                Juega con tus propias preguntas, tus datos y adaptado a tu materia específica. Usa nuestro editor visual y ten lista una partida única en 5 minutos.
              </p>
            </div>

            <div className="relative z-10 shrink-0 w-full md:w-auto">
              <button
                onClick={handleEnterEditor}
                className="w-full bg-black text-white hover:bg-white hover:text-black font-black text-xl py-6 px-10 border-4 border-black transition-all flex justify-center items-center gap-3 uppercase tracking-wide shadow-[8px_8px_0px_0px_rgba(0,0,0,0.4)] hover:shadow-none hover:translate-x-[8px] hover:translate-y-[8px]"
              >
                <Settings size={28} /> Abrir Editor
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
                href="mailto:hello@reneblanco.com"
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

  // --- VISTA: EDITOR DE TABLEROS (NUBE) ---
  if (gameState === 'editor') {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-black flex flex-col font-sans relative overflow-x-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 fixed" style={{
          backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        <header className="relative z-10 border-b-4 border-black bg-white px-6 py-4 flex justify-between items-center sticky top-0 shadow-sm shrink-0">
          <button onClick={() => setGameState('setup')} className="flex items-center gap-2 font-bold uppercase hover:underline">
            <ArrowLeft size={20} /> Cancelar y Volver
          </button>
          <div className="font-black text-xl tracking-tighter uppercase hidden md:block">Editor Maestro</div>
          <button
            onClick={handleSaveEditor}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#ffe600] border-2 border-black text-black px-6 py-2 font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Cloud size={18} />}
            {isSaving ? "Guardando..." : "Guardar en la Nube"}
          </button>
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
                        className="absolute -top-3 -right-3 bg-[#ff3366] text-white border-2 border-black p-1 hover:scale-110 transition-transform z-20"
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
    <div className="min-h-screen bg-[#faf9f6] text-black flex flex-col font-sans select-none relative overflow-x-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 fixed" style={{
        backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <header className="relative z-10 border-b-4 border-black bg-white px-4 md:px-6 py-4 flex justify-between items-center shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
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
            className="p-2 md:p-3 border-4 border-black hover:bg-[#ff3366] hover:text-white transition-all group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] bg-white"
            title="Terminar Partida"
          >
            <RotateCcw size={20} className="group-hover:-rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 p-4 md:p-8 flex flex-col justify-center max-w-[1600px] w-full mx-auto pb-12">
        <div
          className="grid gap-3 md:gap-4 h-full"
          style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}
        >
          {categories.map((cat, i) => (
            <div key={`header-${i}`} className="flex items-center justify-center text-center p-3 bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
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
                      relative flex items-center justify-center p-4 transition-all duration-200 border-4 border-black
                      ${q.answered
                        ? 'bg-[#faf9f6] text-gray-300 cursor-default shadow-inner'
                        : 'bg-white cursor-pointer hover:bg-[#ffe600] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px]'}
                    `}
                    style={{ aspectRatio: categories.length > 4 ? '1/1' : '4/3' }}
                  >
                    {!q.answered ? (
                      <span className="text-3xl md:text-5xl font-black tracking-tighter">
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
      <Footer />

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
              className="absolute top-4 right-4 bg-white border-4 border-black p-2 hover:bg-[#ffe600] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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
