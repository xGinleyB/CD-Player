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

// =========================================================
// BLOQUE 4: EVENTOS DE BOTONES, BARRAS Y CARGA DE CDs
// =========================================================

// 1. Botón de Encendido / Apagado (Power)
powerBtn.addEventListener('click', () => {
  isPoweredOn = !isPoweredOn; // Invierte el estado (si estaba prendido, lo apaga y viceversa)
  powerLed.classList.toggle('on', isPoweredOn); // Prende o apaga el puntito LED

  if (!isPoweredOn) {
    // Si apagamos el aparato: pausamos música, retiramos brazo y atenuamos pantallas
    setPlaybackState(false);
    deviceChassis.style.opacity = '0.88';
    mainTrackTitle.textContent = 'APAGADO';
    mainArtistName.textContent = '';
  } else {
    // Si lo encendemos: restauramos el brillo y textos
    deviceChassis.style.opacity = '1';
    if (currentAlbumIndex === -1) {
      mainTrackTitle.textContent = 'Sin Disco';
      mainArtistName.textContent = 'Carga un Album';
    } else {
      const album = library[currentAlbumIndex];
      mainTrackTitle.textContent = album.tracks[currentTrackIndex].title;
      mainArtistName.textContent = album.artist;
    }
  }
});

// 2. Botón Play / Pausa
playPauseBtn.addEventListener('click', () => {
  if (!isPoweredOn) return;
  // Si hay un disco cargado, alterna entre reproducir y pausar
  if (currentAlbumIndex !== -1) {
    setPlaybackState(!isPlaying);
  }
});

// 3. Botón Canción Anterior
prevBtn.addEventListener('click', () => {
  if (!isPoweredOn || currentAlbumIndex === -1) return;
  const album = library[currentAlbumIndex];
  // Si estamos en la primera canción (0), saltamos a la última; si no, retrocedemos 1
  const prevIndex = (currentTrackIndex - 1 + album.tracks.length) % album.tracks.length;
  loadTrack(prevIndex, true);
});

// 4. Botón Siguiente Canción
nextBtn.addEventListener('click', () => {
  if (!isPoweredOn || currentAlbumIndex === -1) return;
  const album = library[currentAlbumIndex];
  // Avanza a la siguiente canción; si llega al final, vuelve a la primera (0)
  const nextIndex = (currentTrackIndex + 1) % album.tracks.length;
  loadTrack(nextIndex, true);
});

// 5. Cuando una canción termina sola, pasa automáticamente a la siguiente
audioPlayer.addEventListener('ended', () => {
  nextBtn.click();
});

// 6. Actualiza la barra deslizante de progreso mientras avanza la canción
audioPlayer.addEventListener('timeupdate', () => {
  if (audioPlayer.duration) {
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = percent;
  }
});

// 7. Permite adelantar o retroceder moviendo la barra de progreso con el dedo o mouse
progressBar.addEventListener('input', () => {
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
  }
});

// 8. Control de Volumen físico
volumeSlider.addEventListener('input', () => {
  audioPlayer.volume = parseFloat(volumeSlider.value);
});

// 9. Flujo del botón "+ Agregar CD"
let pendingTracks = []; // Guarda temporalmente las canciones elegidas antes de pedir la portada

addCdBtn.addEventListener('click', () => {
  // Limpia el selector por si quieres volver a subir los mismos archivos y abre el explorador
  audioFilesInput.value = '';
  audioFilesInput.click();
});

// Cuando el usuario selecciona sus archivos de audio (.mp3, .wav, .m4a...)
audioFilesInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  // Convertimos cada archivo elegido en un objeto con su título limpio y su URL local temporal
  pendingTracks = files.map(file => ({
    // Quita la extensión (.mp3, .wav) del nombre del archivo para que se vea limpio en pantalla
    title: file.name.replace(/\.[^/.]+$/, ''),
    url: URL.createObjectURL(file)
  }));

  // Preguntamos si desea elegir una imagen de portada para este CD
  const wantsCover = confirm(`Se cargaron ${pendingTracks.length} canciones.\n¿Quieres elegir una imagen de carátula para este CD?\n(Pulsa Cancelar para usar una portada por defecto)`);
  
  if (wantsCover) {
    coverFileInput.value = '';
    coverFileInput.click();
  } else {
    finalizeNewAlbum('https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80');
  }
});

// Cuando el usuario elige la foto de portada
coverFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const coverUrl = file
    ? URL.createObjectURL(file)
    : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80';
  finalizeNewAlbum(coverUrl);
});

// Guarda el nuevo álbum en la colección, lo dibuja en la vitrina y lo pone en el plato
function finalizeNewAlbum(coverUrl) {
  const albumTitle = prompt('Nombre del Álbum o Artista:', `Mi CD #${library.length + 1}`) || `CD #${library.length + 1}`;

  const newAlbum = {
    artist: albumTitle,
    cover: coverUrl,
    tracks: pendingTracks
  };

  library.push(newAlbum);
  renderVitrine();
  // Coloca automáticamente el nuevo CD en el plato listo para sonar
  mountAlbumOnDeck(library.length - 1);
}


// =========================================================
// BLOQUE 5: VITRINA INTERACTIVA Y ECUALIZADOR ANIMADO
// =========================================================

// Coloca un CD de la vitrina encima del plato giratorio
function mountAlbumOnDeck(albumIndex) {
  const album = library[albumIndex];
  if (!album) return;

  currentAlbumIndex = albumIndex;
  currentCoverImg.src = album.cover; // Cambia la carátula en el plato giratorio

  // Llena la lista negra (OLED) con las canciones de este CD
  trackListEl.innerHTML = album.tracks.map((track, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    return `<li class="track-item" data-index="${idx}">${num}. ${track.title}</li>`;
  }).join('');

  // Permite hacer clic en cualquier canción de la lista negra para reproducirla
  trackListEl.querySelectorAll('.track-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.getAttribute('data-index'), 10);
      loadTrack(idx, true);
    });
  });

  // Carga la primera canción y arranca la música
  loadTrack(0, true);
}

// Dibuja los 8 espacios de la vitrina (combinando tus CDs cargados con discos de muestra)
function renderVitrine() {
  const totalSlots = 8;
  let html = '';

  for (let i = 0; i < totalSlots; i++) {
    if (i < library.length) {
      // Si hay un CD real tuyo en esta posición, lo mostramos con su carátula y lo hacemos arrastrable
      const album = library[i];
      html += `
        <div class="cd-case" draggable="true" data-album-index="${i}" title="Clic o arrastra al plato: ${album.artist}">
          <img src="${album.cover}" alt="${album.artist}" />
        </div>
      `;
    } else {
      // Espacios vacíos decorativos (alterna disco iridiscente y caja vacía)
      if (i % 2 === 0) {
        html += `
          <div class="cd-case exposed-disc" title="Espacio disponible">
            <div class="iridescent-cd"></div>
          </div>
        `;
      } else {
        html += `
          <div class="cd-case" style="opacity: 0.35; cursor: default;" title="Espacio disponible">
            <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80" alt="Vacio" />
          </div>
        `;
      }
    }
  }

  cdVitrine.innerHTML = html;

  // Conectamos eventos de Clic y Arrastre (Drag & Drop) a cada CD cargado
  cdVitrine.querySelectorAll('.cd-case[data-album-index]').forEach(card => {
    const idx = parseInt(card.getAttribute('data-album-index'), 10);

    // Al hacer clic en un CD de la vitrina, se monta en el plato
    card.addEventListener('click', () => {
      mountAlbumOnDeck(idx);
    });

    // Al empezar a arrastrar el CD con el mouse, guardamos su número
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', idx);
    });
  });
}