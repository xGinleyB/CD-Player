// =========================================================
// BLOQUE 1: CONEXIÓN CON LOS ELEMENTOS DEL HTML (DOM)
// =========================================================

// Contenedores principales y piezas mecánicas
const deviceChassis   = document.getElementById('deviceChassis');
const discAssembly    = document.getElementById('discAssembly');
const tonearm         = document.getElementById('tonearm');
const currentCoverImg = document.getElementById('currentCoverImg');
const dropZone        = document.getElementById('dropZone');

// Botones físicos y luces LED
const powerBtn        = document.getElementById('powerBtn');
const powerLed        = document.getElementById('powerLed');
const prevBtn         = document.getElementById('prevBtn');
const playPauseBtn    = document.getElementById('playPauseBtn');
const playLed         = document.getElementById('playLed');
const playIcon        = document.getElementById('playIcon');
const nextBtn         = document.getElementById('nextBtn');

// Pantallas digitales y controles deslizantes
const miniTrackTitle  = document.getElementById('miniTrackTitle');
const trackListEl     = document.getElementById('trackList');
const progressBar     = document.getElementById('progressBar');
const mainTrackTitle  = document.getElementById('mainTrackTitle');
const mainArtistName  = document.getElementById('mainArtistName');
const volumeSlider    = document.getElementById('volumeSlider');

// Vitrina y botones de biblioteca
const cdVitrine       = document.getElementById('cdVitrine');
const addCdBtn        = document.getElementById('addCdBtn');
const audioFilesInput = document.getElementById('audioFilesInput');
const coverFileInput  = document.getElementById('coverFileInput');

// Lienzo circular del ecualizador
const eqCanvas        = document.getElementById('eqCanvas');
const ctx             = eqCanvas.getContext('2d');


// =========================================================
// BLOQUE 2: ESTADO DEL REPRODUCTOR Y MOTOR DE AUDIO
// =========================================================

// Creamos el objeto nativo de Audio del navegador (el motor que reproduce el sonido)
const audioPlayer = new Audio();
audioPlayer.volume = 0.8; // Volumen inicial al 80%

// Variables de estado para saber qué está pasando en cada momento
let isPoweredOn       = true;  // Indica si el equipo está encendido
let isPlaying         = false; // Indica si hay música sonando ahora mismo
let library           = [];    // Aquí guardaremos todos los CDs cargados
let currentAlbumIndex = -1;    // Índice del CD puesto en el plato (-1 = ninguno)
let currentTrackIndex = 0;     // Índice de la canción actual dentro del CD

// Dejamos el brazo retirado en posición de descanso al iniciar la página
tonearm.classList.add('resting');
playLed.classList.remove('active');
// Ponemos el ícono de "Play" (triángulo) en el botón central
playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';


// =========================================================
// BLOQUE 3: FUNCIONES DE MOVIMIENTO Y REPRODUCCIÓN
// =========================================================

// Función maestra que sincroniza el sonido, el giro del disco, el brazo y los LEDs
function setPlaybackState(playing) {
  // Si el equipo está apagado o no hay ningún CD cargado, no hacemos nada
  if (!isPoweredOn || currentAlbumIndex === -1) return;

  isPlaying = playing;

  if (isPlaying) {
    audioPlayer.play();                          // Inicia el sonido real
    discAssembly.classList.add('spinning');      // Arranca la animación de giro del vinilo/CD
    tonearm.classList.remove('resting');         // Coloca la aguja sobre el disco
    playLed.classList.add('active');             // Enciende el LED verde del botón Play
    // Cambia el ícono SVG a Pausa (dos barras verticales)
    playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
  } else {
    audioPlayer.pause();                         // Pausa el sonido
    discAssembly.classList.remove('spinning');   // Detiene el giro del disco
    tonearm.classList.add('resting');            // Retira el brazo hacia afuera
    playLed.classList.remove('active');          // Apaga el LED verde
    // Cambia el ícono SVG a Play (triángulo)
    playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  }
}

// Carga una canción específica del álbum actual y actualiza las pantallas
function loadTrack(trackIndex, autoPlay = true) {
  const album = library[currentAlbumIndex];
  if (!album || !album.tracks[trackIndex]) return;

  currentTrackIndex = trackIndex;
  const track = album.tracks[trackIndex];

  // Asignamos la URL temporal del archivo de audio al reproductor
  audioPlayer.src = track.url;

  // Actualizamos los textos de la pantalla OLED rectangular y la pantalla circular
  const trackNumber = String(trackIndex + 1).padStart(2, '0');
  miniTrackTitle.textContent = `${trackNumber}. ${track.title}`;
  mainTrackTitle.textContent = track.title;
  mainArtistName.textContent = album.artist;

  // Resaltamos en verde menta la canción activa dentro de la lista
  const items = trackListEl.querySelectorAll('.track-item');
  items.forEach((li, idx) => {
    li.classList.toggle('active', idx === trackIndex);
  });

  // Si autoPlay es verdadero, empezamos a reproducir de inmediato
  if (autoPlay) {
    setPlaybackState(true);
  }
}