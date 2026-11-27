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
const shuffleBtn      = document.getElementById('shuffleBtn');
const shuffleLed      = document.getElementById('shuffleLed');
const toggleLayoutBtn = document.getElementById('toggleLayoutBtn');
const audioFilesInput = document.getElementById('audioFilesInput');
const coverFileInput  = document.getElementById('coverFileInput');

const eqCanvas        = document.getElementById('eqCanvas');
const ctx             = eqCanvas.getContext('2d');


// =========================================================
// BLOQUE 2: BASE DE DATOS PERSISTENTE (IndexedDB)
// =========================================================
const DB_NAME = 'RetroCDDeckDB';
const STORE_NAME = 'albums';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveAlbumToDB(albumData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).add(albumData);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadAllAlbumsFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteAlbumFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}


// =========================================================
// BLOQUE 3: MOTOR DE AUDIO Y ESTADO DEL REPRODUCTOR
// =========================================================
const audioPlayer = new Audio();
audioPlayer.volume = 0.8;

let isPoweredOn       = true;
let isPlaying         = false;
let isShuffle         = false; // Controla el modo Aleatorio
let library           = [];
let currentAlbumIndex = -1;
let currentTrackIndex = 0;
let isCompactGrid     = true;

tonearm.classList.add('resting');
playLed.classList.remove('active');
playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';


// =========================================================
// BLOQUE 4: VENTANA MODAL PARA AGREGAR CD
// =========================================================
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

const modalAlbumName    = document.getElementById('modalAlbumName');
const modalPickAudioBtn = document.getElementById('modalPickAudioBtn');
const modalPickCoverBtn = document.getElementById('modalPickCoverBtn');
const modalCancelBtn    = document.getElementById('modalCancelBtn');
const modalSaveBtn      = document.getElementById('modalSaveBtn');

let tempRawTracks = [];
let tempCoverBlob = null;
const defaultCover = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80';

addCdBtn.addEventListener('click', () => {
  tempRawTracks = [];
  tempCoverBlob = null;
  modalAlbumName.value = '';
  modalPickAudioBtn.textContent = 'Seleccionar archivos de audio...';
  modalPickCoverBtn.textContent = 'Elegir imagen de portada...';
  modalOverlay.style.display = 'flex';
});

modalPickAudioBtn.addEventListener('click', () => {
  audioFilesInput.value = '';
  audioFilesInput.click();
});

audioFilesInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  tempRawTracks = files.map(file => ({
    title: file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/^\d+[\.\-\s_]+/, '')
      .trim(),
    blob: file // Guardamos el archivo original para IndexedDB
  }));

  modalPickAudioBtn.textContent = `✓ ${tempRawTracks.length} canciones listas`;
});

modalPickCoverBtn.addEventListener('click', () => {
  coverFileInput.value = '';
  coverFileInput.click();
});

coverFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  tempCoverBlob = file;
  modalPickCoverBtn.textContent = `✓ Portada: ${file.name.slice(0, 18)}...`;
});

modalCancelBtn.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});

modalSaveBtn.addEventListener('click', async () => {
  if (tempRawTracks.length === 0) {
    alert('Por favor selecciona al menos una canción antes de guardar.');
    return;
  }

  modalSaveBtn.textContent = 'Guardando...';
  const albumTitle = modalAlbumName.value.trim() || `Mi CD #${library.length + 1}`;

  // Guardamos permanentemente en IndexedDB
  const recordToStore = {
    artist: albumTitle,
    coverBlob: tempCoverBlob,
    tracks: tempRawTracks
  };
  const savedId = await saveAlbumToDB(recordToStore);

  // Creamos las URLs activas en memoria para reproducir de inmediato
  const activeAlbum = {
    id: savedId,
    artist: albumTitle,
    cover: tempCoverBlob ? URL.createObjectURL(tempCoverBlob) : defaultCover,
    tracks: tempRawTracks.map(t => ({
      title: t.title,
      url: URL.createObjectURL(t.blob)
    }))
  };

  library.push(activeAlbum);
  modalSaveBtn.textContent = 'Guardar CD';
  modalOverlay.style.display = 'none';
  renderVitrine();
  mountAlbumOnDeck(library.length - 1);
});


// =========================================================
// BLOQUE 5: REPRODUCCIÓN, SHUFFLE Y CONTROLES
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

  const items = trackListEl.querySelectorAll('.clean-track-row');
  items.forEach((row, idx) => {
    const active = idx === trackIndex;
    row.style.color = active ? '#5ef2b8' : '#d8ece3';
    if (active) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    row.style.fontWeight = active ? '700' : '400';
  });

  if (autoPlay) setPlaybackState(true);
}

// Calcula una pista al azar distinta de la actual
function getRandomTrackIndex(totalTracks) {
  if (totalTracks <= 1) return 0;
  let randomIdx;
  do {
    randomIdx = Math.floor(Math.random() * totalTracks);
  } while (randomIdx === currentTrackIndex);
  return randomIdx;
}

// Botón Aleatorio (Shuffle)
shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleLed.style.background = isShuffle ? '#5ef2b8' : '#b5ab99';
  shuffleLed.style.boxShadow = isShuffle ? '0 0 6px #5ef2b8' : 'none';
});

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
  const targetIdx = isShuffle
    ? getRandomTrackIndex(album.tracks.length)
    : (currentTrackIndex - 1 + album.tracks.length) % album.tracks.length;
  loadTrack(targetIdx, true);
});

nextBtn.addEventListener('click', () => {
  if (!isPoweredOn || currentAlbumIndex === -1) return;
  const album = library[currentAlbumIndex];
  const targetIdx = isShuffle
    ? getRandomTrackIndex(album.tracks.length)
    : (currentTrackIndex + 1) % album.tracks.length;
  loadTrack(targetIdx, true);
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
// BLOQUE 6: VITRINA INTERACTIVA Y ECUALIZADOR CIRCULAR
// =========================================================
function mountAlbumOnDeck(albumIndex, autoPlay = true) {
  const album = library[albumIndex];
  if (!album) return;

  currentAlbumIndex = albumIndex;
  currentCoverImg.src = album.cover;

  trackListEl.className = 'oled-scroll';
  trackListEl.style.cssText = `
    list-style: none;
    display: block;
    width: 100%;
    height: 92px;
    overflow-y: auto;
    padding: 4px 2px;
    margin: 4px 0;
    text-align: left;
  `;

  trackListEl.innerHTML = album.tracks.map((track, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    return `
      <div class="clean-track-row" data-index="${idx}"
           style="display: block; width: 100%; font-family: 'JetBrains Mono', monospace;
                  font-size: 12px; line-height: 20px; color: #d8ece3;
                  padding: 1px 4px; cursor: pointer; white-space: nowrap;
                  overflow: hidden; text-overflow: ellipsis;">
        ${num}. ${track.title}
      </div>
    `;
  }).join('');

  trackListEl.querySelectorAll('.clean-track-row').forEach(row => {
    row.addEventListener('click', () => {
      loadTrack(parseInt(row.getAttribute('data-index'), 10), true);
    });
  });

  // Si está en modo aleatorio al montar el disco, arranca con una canción aleatoria
  const initialIdx = (autoPlay && isShuffle) ? getRandomTrackIndex(album.tracks.length) : 0;
  loadTrack(initialIdx, autoPlay);
}

function renderVitrine() {
  const totalSlots = isCompactGrid ? 6 : 8;
  let html = '';

  for (let i = 0; i < Math.max(totalSlots, library.length); i++) {
    if (i < library.length) {
      const album = library[i];
      html += `
        <div class="cd-case" draggable="true" data-album-index="${i}"
             title="Clic: reproducir | Clic derecho: quitar CD (${album.artist})">
          <img src="${album.cover}" alt="${album.artist}" />
        </div>
      `;
    } else {
      html += `
        <div class="cd-case exposed-disc" title="Espacio disponible">
          <div class="iridescent-cd"></div>
        </div>
      `;
    }
  }

  cdVitrine.innerHTML = html;

  cdVitrine.querySelectorAll('.cd-case[data-album-index]').forEach(card => {
    const idx = parseInt(card.getAttribute('data-album-index'), 10);
    card.addEventListener('click', () => mountAlbumOnDeck(idx, true));
    card.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', idx));

    // Clic derecho permite borrar un CD guardado si ya no lo quieres en la vitrina
    card.addEventListener('contextmenu', async (e) => {
      e.preventDefault();
      const album = library[idx];
      if (confirm(`¿Quieres quitar "${album.artist}" de tu vitrina?`)) {
        await deleteAlbumFromDB(album.id);
        library.splice(idx, 1);
        if (currentAlbumIndex === idx) {
          setPlaybackState(false);
          currentAlbumIndex = -1;
          mainTrackTitle.textContent = 'Sin Disco';
          mainArtistName.textContent = 'Carga un Album';
        } else if (currentAlbumIndex > idx) {
          currentAlbumIndex--;
        }
        renderVitrine();
      }
    });
  });
}

dropZone.addEventListener('dragover', (e) => e.preventDefault());
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  const idx = parseInt(e.dataTransfer.getData('text/plain'), 10);
  if (!isNaN(idx)) mountAlbumOnDeck(idx, true);
});

let eqPhase = 0;
function animateCircularEq() {
  const cx = eqCanvas.width / 2;
  const cy = eqCanvas.height / 2;
  const radius = 84;
  const bars = 90;

  ctx.clearRect(0, 0, eqCanvas.width, eqCanvas.height);

  for (let i = 0; i < bars; i++) {
    const angle = (i / bars) * Math.PI * 2;
    const wave = isPlaying
      ? Math.abs(Math.sin(i * 0.35 + eqPhase) * Math.cos(i * 0.15 - eqPhase * 0.7)) * 14
      : Math.abs(Math.sin(i * 0.35)) * 4;
    const barHeight = 3 + wave;

    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * (radius + barHeight);
    const y2 = cy + Math.sin(angle) * (radius + barHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  if (isPlaying) eqPhase += 0.12;
  requestAnimationFrame(animateCircularEq);
}

// =========================================================
// ARRANQUE INICIAL: RECUPERA LOS CDs GUARDADOS EN IndexedDB
// =========================================================
async function initApp() {
  try {
    const storedAlbums = await loadAllAlbumsFromDB();
    library = storedAlbums.map(item => ({
      id: item.id,
      artist: item.artist,
      cover: item.coverBlob ? URL.createObjectURL(item.coverBlob) : defaultCover,
      tracks: item.tracks.map(t => ({
        title: t.title,
        url: URL.createObjectURL(t.blob)
      }))
    }));
  } catch (err) {
    console.error('Error cargando álbumes guardados:', err);
  }

  renderVitrine();
  // Si ya había al menos un CD guardado, lo deja listo en el plato (en pausa) al abrir la página
  if (library.length > 0) {
    mountAlbumOnDeck(0, false);
  }
  animateCircularEq();
}

initApp();