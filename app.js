//===========================================
// Parte 1: Conexion con el HTML y Ecualizador
//===========================================

// Buscamos en el HTML la vitrina inferior usando su id="cdVitrine" y la guardamos en una variable constante
const cdVitrine = document.getElementById('cdVitrine');

// Buscamos el lienzo circular usando su id="eqCanvas"
const eqCanvas = document.getElementById('eqCanvas');

// Pedimos el contexto '2d' del lienzo: es el "pincel" con el que JavaScript puede dibujar lineas y figuras
const ctx = eqCanvas.getContext('2d');

// Definimos una funcion llamada 'drawCircularEq' que dibujara el anillo de barras blancas
function drawCircularEq() {
    // Calculamos la coordenada X del centro exacto del lienzo (si mide 210pxde ancho, la mitas es 105px)
    const cx = eqCanvas.width / 2;
    
    // Calculamos la coordenada y del centro exacto del lienzo (105px)
    const cy = eqCanvas.height / 2;

    // Definimos el radio (distancia en pixeles desde el centro donde empezaran a dibujar las barras)
    const radius = 84;

    // Definimos cuantas rayitas queremos repartir alrededor de todo el circulo
    const bars = 90;

    // Borramos cualquier dibujo previo en todo el lienzo para que no se encimen lineas viejas con nuevas
    ctx.clearRect(0, 0, eqCanvas.width, eqCanvas.height);

    //Creamos un ciclo 'for' que se repetira 90 veces (desde i = 0 hasta i = 89)
    for (let i = 0; i < bars; i++) {
        // Calculamos el angulo en radianes para cada dayita (Math.PI * 2 equivale a 360 grados completos)
        const angle = (i / bars) * Math.PI * 2;

        // Calculamos una altura variable usando una onda matematica (Math.sin) para simular el ritmo de la musica
        const barHeight = 4 + Math.abs(Math.sin(i*0.35))*10;

        //Usamos coseno y seno para encontrar el punto inicial (x1, y1) justo en el borde del circulo interior
        const x1 = cx + Math.cos(angle) * radius;
        const y1 = cy + Math.sin(angle) * radius;

        // Calculamos el punto final (x2, y2) sumando 'barHeight' para que la rayita apunte hacia afuera
        const x2 = cx + Math.cos(angle) * (radius + barHeight);
        const y2 = cx + Math.sin(angle) * (radius + barHeight);

        //Elegimos el colo blanco con 85% de opacidad para el trazo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';

        // Definimos un grosor de 2 pixeles para ada rayita
        ctx.lineWidth = 2;

        // Indicamos que vamos a empezar un trazo nuevo
        ctx.beginPath();

        // Movemos el "lapiz" al punto inicial (x1, y1) sin pintar todavia
        ctx.moveTo(x1, y1);

        // Trazamos una linea recta hasta el punto final (x2, y2)
        ctx.lineTo(x2, y2);

        // Pintamos efectivamente la linea sobre el lienzo
        ctx.stroke();
    }
}

// ==========================================
// PARTE 2: VITRINA DE CDs Y ARRANQUE INICIAL
// ==========================================

// Definimos la función que llenará la vitrina inferior con los álbumes
function renderDemoVitrine() {
  // Guardamos en una constante el enlace de una imagen de muestra para las portadas
  const sampleCover = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80';

  // Creamos un arreglo (lista) de 8 objetos que representan cada espacio de la vitrina
  // 'cover' mostrará la caja con portada; 'disc' mostrará el CD brillante expuesto
  const slots = [
    { type: 'cover', img: sampleCover },
    { type: 'cover', img: sampleCover },
    { type: 'disc' },
    { type: 'cover', img: sampleCover },
    { type: 'disc' },
    { type: 'cover', img: sampleCover },
    { type: 'cover', img: sampleCover },
    { type: 'disc' }
  ];

  // '.map()' recorre cada elemento de la lista 'slots' y lo transforma en un bloque de texto HTML
  // '.join("")' une los 8 bloques de texto en uno solo sin agregar comas entre ellos
  // Finalmente, 'cdVitrine.innerHTML' inserta todo ese HTML dentro de la vitrina en la página
  cdVitrine.innerHTML = slots.map(slot => {
    // Si este espacio es de tipo 'disc', devolvemos el HTML del disco iridiscente
    if (slot.type === 'disc') {
      return `
        <div class="cd-case exposed-disc">
          <div class="iridescent-cd"></div>
        </div>
      `;
    }

    // De lo contrario, devolvemos el HTML de una caja acrílica con su imagen de portada
    return `
      <div class="cd-case">
        <img src="${slot.img}" alt="CD Cover" />
      </div>
    `;
  }).join('');
}

// ==========================================
// EJECUCIÓN INICIAL AL CARGAR LA PÁGINA
// ==========================================

// Llamamos a la función para que dibuje el anillo ecualizador
drawCircularEq();

// Llamamos a la función para que aparezcan los 8 CDs en la vitrina inferior
renderDemoVitrine();