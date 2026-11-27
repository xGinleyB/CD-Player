// =========================================================
// BLOQUE 1: CONEXIÓN CON LOS ELEMENTOS DEL HTML (DOM)
// =========================================================
const deviceChassis   = document.getElementById('deviceChassis');
const discAssembly    = document.getElementById('discAssembly');
const tonearm         = document.getElementById('tonearm');
const currentCoverImg = document.getElementById('currentCoverImg');
const dropZone        = document.getElementById('dropZone');

const powerBtn        = document.getElementById('powerBtn');
const powerLed        = document.getElementById('powerLed');
const prevBtn         = document.getElementById('prevBtn');
const playPauseBtn    = document.getElementById('playPauseBtn');
const playLed         = document.getElementById('playLed');
const playIcon        = document.getElementById('playIcon');
const nextBtn         = document.getElementById('nextBtn');

const miniTrackTitle  = document.getElementById('miniTrackTitle');
const trackListEl     = document.getElementById('trackList');
const progressBar     = document.getElementById('progressBar');
const mainTrackTitle  = document.getElementById('mainTrackTitle');
const mainArtistName  = document.getElementById('mainArtistName');
const volumeSlider    = document.getElementById('volumeSlider');

const cdVitrine       = document.getElementById('cdVitrine');
const addCdBtn        = document.getElementById('addCdBtn');
const toggleLayoutBtn = document.getElementById('toggleLayoutBtn');
const audioFilesInput = document.getElementById('audioFilesInput');
const coverFileInput  = document.getElementById('coverFileInput');

const eqCanvas        = document.getElementById('eqCanvas');
const ctx             = eqCanvas.getContext('2d');


// =========================================================
// BLOQUE 2: MOTOR DE AUDIO Y ESTADO DEL REPRODUCTOR
// =========================================================
const audioPlayer = new Audio();
audioPlayer.volume = 0.8;

let isPoweredOn       = true;
let isPlaying         = false;
let library           = [];
let currentAlbumIndex = -1;
let currentTrackIndex = 0;
let isCompactGrid     = true; // Empieza en 6 columnas compactas

// Estado inicial en descanso
tonearm.classList.add('resting');
playLed.classList.remove('active');
playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';


// =========================================================
// BLOQUE 3: VENTANA MODAL PARA AGREGAR CD (SIN BLOQUEOS)
// =========================================================
// Creamos dinámicamente un pequeño cuadro de diálogo estilo retro
const modalOverlay = document.createElement('div');
modalOverlay.style.cssText = `
  position: fixed; inset: 0; background: rgba(18, 21, 20, 0.72);
  display: none; justify-content: center; align-items: center; z-index: 999;
  backdrop-filter: blur(3px);
`;

modalOverlay.innerHTML = `
  <div style="background: #f2ece1; border-radius: 18px; padding: 20px; width: 320px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 2px solid #fff;
              font-family: 'Space Grotesk', sans-serif; color: #2c2a27;">
    <h3 style="margin-bottom: 12px; font-size: 1rem;">Nuevo CD para la Vitrina</h3>
    
    <label style="font-size: 0.78rem; font-weight: 700; display: block; margin-bottom: 4px;">1. Nombre del Álbum / Artista:</label>
    <input type="text" id="modalAlbumName" placeholder="Ej. Un Verano Sin Ti"
           style="width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid #c4baa6;
                  margin-bottom: 12px; font-family: inherit; font-size: 0.85rem;" />

    <label style="font-size: 0.78rem; font-weight: 700; display: block; margin-bottom: 4px;">2. Canciones (.mp3, .wav, .m4a):</label>
    <button type="button" id="modalPickAudioBtn"
            style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #b5ab99;
                   background: #faf7f0; cursor: pointer; font-family: 'JetBrains Mono', monospace;
                   font-size: 0.75rem; margin-bottom: 12px; text-align: left;">
      Seleccionar archivos de audio...
    </button>

    <label style="font-size: 0.78rem; font-weight: 700; display: block; margin-bottom: 4px;">3. Imagen de Carátula (Opcional):</label>
    <button type="button" id="modalPickCoverBtn"
            style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #b5ab99;
                   background: #faf7f0; cursor: pointer; font-family: 'JetBrains Mono', monospace;
                   font-size: 0.75rem; margin-bottom: 16px; text-align: left;">
      Elegir imagen de portada...
    </button>

    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button type="button" id="modalCancelBtn"
              style="padding: 8px 14px; border-radius: 8px; border: none; background: #dcd4c4;
                     cursor: pointer; font-weight: 600;">Cancelar</button>
      <button type="button" id="modalSaveBtn"
              style="padding: 8px 16px; border-radius: 8px; border: none; background: #2c2a27;
                     color: #5ef2b8; cursor: pointer; font-weight: 700;">Guardar CD</button>
    </div>
  </div>
`;
document.body.appendChild(modalOverlay);

// Referencias a los botones internos del cuadro de diálogo
const modalAlbumName    = document.getElementById('modalAlbumName');
const modalPickAudioBtn = document.getElementById('modalPickAudioBtn');
const modalPickCoverBtn = document.getElementById('modalPickCoverBtn');
const modalCancelBtn    = document.getElementById('modalCancelBtn');
const modalSaveBtn      = document.getElementById('modalSaveBtn');

let tempTracks = [];
let tempCoverUrl = '';
const defaultCover = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80';

// Al hacer clic en "+ Agregar CD", abrimos nuestro cuadro limpio
addCdBtn.addEventListener('click', () => {
  tempTracks = [];
  tempCoverUrl = '';
  modalAlbumName.value = '';
  modalPickAudioBtn.textContent = 'Seleccionar archivos de audio...';
  modalPickCoverBtn.textContent = 'Elegir imagen de portada...';
  modalOverlay.style.display = 'flex';
});

// Clic directo del usuario -> Chrome permite abrir el selector de audio sin bloqueos
modalPickAudioBtn.addEventListener('click', () => {
  audioFilesInput.value = '';
  audioFilesInput.click();
});

audioFilesInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  tempTracks = files.map(file => ({
    // Limpia la extensión (.mp3) y quita números iniciales repetidos como "08. " o "8 - "
    title: file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/^\d+[\.\-\s_]+/, '')
      .trim(),
    url: URL.createObjectURL(file)
  }));

  modalPickAudioBtn.textContent = `✓ ${tempTracks.length} canciones listas`;
});

// Clic directo del usuario -> Chrome permite abrir el selector de imagen sin bloqueos
modalPickCoverBtn.addEventListener('click', () => {
  coverFileInput.value = '';
  coverFileInput.click();
});

coverFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  tempCoverUrl = URL.createObjectURL(file);
  modalPickCoverBtn.textContent = `✓ Portada: ${file.name.slice(0, 18)}...`;
});

modalCancelBtn.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});

modalSaveBtn.addEventListener('click', () => {
  if (tempTracks.length === 0) {
    alert('Por favor selecciona al menos una canción antes de guardar.');
    return;
  }

  const albumTitle = modalAlbumName.value.trim() || `Mi CD #${library.length + 1}`;
  library.push({
    artist: albumTitle,
    cover: tempCoverUrl || defaultCover,
    tracks: tempTracks
  });

  modalOverlay.style.display = 'none';
  renderVitrine();
  mountAlbumOnDeck(library.length - 1);
});


// =========================================================
// BLOQUE 4: REPRODUCCIÓN, CONTROLES Y CAMBIO DE VISTA
// =========================================================
function setPlaybackState(playing) {
  if (!isPoweredOn || currentAlbumIndex === -1) return;
  isPlaying = playing;

  if (isPlaying) {
    audioPlayer.play();
    discAssembly.classList.add('spinning');
    tonearm.classList.remove('resting');
    playLed.classList.add('active');
    playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
  } else {
    audioPlayer.pause();
    discAssembly.classList.remove('spinning');
    tonearm.classList.add('resting');
    playLed.classList.remove('active');
    playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  }
}

function loadTrack(trackIndex, autoPlay = true) {
  const album = library[currentAlbumIndex];
  if (!album || !album.tracks[trackIndex]) return;

  currentTrackIndex = trackIndex;
  const track = album.tracks[trackIndex];
  audioPlayer.src = track.url;

  const trackNumber = String(trackIndex + 1).padStart(2, '0');
  miniTrackTitle.textContent = `${trackNumber}. ${track.title}`;
  mainTrackTitle.textContent = track.title;
  mainArtistName.textContent = album.artist;

  // Resaltamos en verde menta la canción activa y dejamos las demás en blanco suave
  const items = trackListEl.querySelectorAll('.track-item');
  items.forEach((li, idx) => {
    const active = idx === trackIndex;
    li.classList.toggle('active', active);
    li.style.color = active ? '#5ef2b8' : '#d8ece3';
    li.style.fontWeight = active ? '700' : '400';
  });

  if (autoPlay) setPlaybackState(true);
}

powerBtn.addEventListener('click', () => {
  isPoweredOn = !isPoweredOn;
  powerLed.classList.toggle('on', isPoweredOn);
  if (!isPoweredOn) {
    setPlaybackState(false);
    mainTrackTitle.textContent = 'APAGADO';
    mainArtistName.textContent = '';
  } else {
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

playPauseBtn.addEventListener('click', () => {
  if (isPoweredOn && currentAlbumIndex !== -1) setPlaybackState(!isPlaying);
});

prevBtn.addEventListener('click', () => {
  if (!isPoweredOn || currentAlbumIndex === -1) return;
  const album = library[currentAlbumIndex];
  loadTrack((currentTrackIndex - 1 + album.tracks.length) % album.tracks.length, true);
});

nextBtn.addEventListener('click', () => {
  if (!isPoweredOn || currentAlbumIndex === -1) return;
  const album = library[currentAlbumIndex];
  loadTrack((currentTrackIndex + 1) % album.tracks.length, true);
});

audioPlayer.addEventListener('ended', () => nextBtn.click());

audioPlayer.addEventListener('timeupdate', () => {
  if (audioPlayer.duration) {
    progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  }
});

progressBar.addEventListener('input', () => {
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
  }
});

volumeSlider.addEventListener('input', () => {
  audioPlayer.volume = parseFloat(volumeSlider.value);
});

// Botón para alternar entre vitrina compacta (6 CDs por fila) y mediana (4 CDs por fila)
toggleLayoutBtn.addEventListener('click', () => {
  isCompactGrid = !isCompactGrid;
  cdVitrine.style.setProperty(
    'grid-template-columns',
    isCompactGrid ? 'repeat(6, 1fr)' : 'repeat(4, 1fr)',
    'important'
  );
  renderVitrine();
});


// =========================================================
// BLOQUE 5: VITRINA INTERACTIVA Y ECUALIZADOR CIRCULAR
// =========================================================
// Coloca un CD de la vitrina encima del plato giratorio
function mountAlbumOnDeck(albumIndex) {
  const album = library[albumIndex];
  if (!album) return;

  currentAlbumIndex = albumIndex;
  currentCoverImg.src = album.cover;

  // 1. Forzamos que la lista <ul> sea visible, tenga altura y muestre texto claro
  trackListEl.style.cssText = `
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 92px;
    overflow-y: auto;
    padding: 4px 2px;
    margin: 0;
    color: #d8ece3;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.74rem;
  `;

  // 2. Generamos cada fila <li> con estilos explícitos para que nunca quede oculta
  trackListEl.innerHTML = album.tracks.map((track, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    return `
      <li class="track-item" data-index="${idx}"
          style="display: block !important; visibility: visible !important; opacity: 1 !important;
                 color: #d8ece3; font-size: 0.74rem; line-height: 1.35; padding: 2px 4px;
                 cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${num}. ${track.title}
      </li>
    `;
  }).join('');

  // 3. Conectamos el clic a cada canción de la lista
  trackListEl.querySelectorAll('.track-item').forEach(item => {
    item.addEventListener('click', () => {
      loadTrack(parseInt(item.getAttribute('data-index'), 10), true);
    });
  });

  // 4. Cargamos la primera canción y resaltamos su fila en verde menta
  loadTrack(0, true);
}