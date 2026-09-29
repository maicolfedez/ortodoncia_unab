import React, { useState, useMemo, useRef, useEffect } from 'react';

// --- COMPONENTE TOLLARO (Integrado como pestaña) ---
function TollaroTab() {
  const [imageSrc, setImageSrc] = useState('https://lh3.googleusercontent.com/d/1AFFQRm-hgrInhR0qINq310luVxI1mxiM');
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  // Guardamos las posiciones como porcentajes relativos (0 a 1) para que sea responsivo
  const [frameRelY, setFrameRelY] = useState(0.5);
  const [markersRelY, setMarkersRelY] = useState([0.1, 0.1, 0.1, 0.1, 0.1]);

  const imageRef = useRef(null);
  const [draggingIdx, setDraggingIdx] = useState(null); // 'frame' o 0,1,2,3,4

  // Iniciar arrastre
  const handlePointerDown = (e, target) => {
    // Solo hacemos preventDefault si es touch para evitar scroll indeseado en móviles
    if (e.type === 'touchstart') e.preventDefault();
    setDraggingIdx(target);
  };

  // Efecto global para manejar el movimiento del puntero
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (draggingIdx === null || !imageRef.current) return;
      
      // Obtener coordenada Y (Soporte para Mouse y Touch)
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = imageRef.current.getBoundingClientRect();
      
      // Calcular posición relativa (0.0 a 1.0)
      let relY = (clientY - rect.top) / rect.height;
      relY = Math.max(0, Math.min(1, relY)); // Restringir dentro de la imagen

      if (draggingIdx === 'frame') {
        setFrameRelY(relY);
      } else {
        setMarkersRelY(prev => {
          const next = [...prev];
          next[draggingIdx] = relY;
          return next;
        });
      }
    };

    const handlePointerUp = () => setDraggingIdx(null);

    if (draggingIdx !== null) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [draggingIdx]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSrc(ev.target.result);
        setImgError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cálculo visual de los pixeles basado en el tamaño natural de la imagen
  const currentPixelY = imageRef.current && imageRef.current.naturalHeight && imgLoaded
    ? Math.round(frameRelY * imageRef.current.naturalHeight) 
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative mt-6">
      
      {/* Instrucciones Tollaro */}
      <div className="p-6 bg-slate-50 border-b border-slate-200">
        <h2 className="text-blue-900 font-bold text-sm uppercase tracking-wider mb-3">Instrucciones de uso Tollaro</h2>
        <ol className="space-y-2 text-slate-700 text-sm">
          <li className="flex gap-2 items-center"><span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px]">1</span><span>Realice la cefalometría para obtener los valores base.</span></li>
          <li className="flex gap-2 items-center"><span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px]">2</span><span>Desplace los <b>puntos verdes</b> sobre los números obtenidos.</span></li>
          <li className="flex gap-2 items-center"><span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px]">3</span><span>Ajuste el <b>marco azul</b> hasta contener la mayor cantidad de puntos.</span></li>
        </ol>
      </div>

      {/* Header Info Tollaro */}
      <div className="bg-slate-900 p-3 text-white flex justify-between items-center relative z-40">
        <div className="flex items-center gap-2 ml-2 text-blue-400">
          <span className="text-[10px] font-bold uppercase tracking-widest">Área Interactiva</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 shadow-inner">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Y:</span>
          <span className="text-sm md:text-lg font-mono font-bold text-blue-400">{currentPixelY} px</span>
        </div>
      </div>

      {/* Contenedor de la Imagen */}
      <div className="relative flex justify-center items-start min-h-[60vh] py-10 touch-none overflow-hidden bg-slate-100">
        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-40 p-6 text-center">
            <h3 className="text-lg font-bold text-slate-700 mb-2">Imagen no disponible</h3>
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-2 rounded-lg font-semibold shadow-md">
              Subir Imagen Manualmente
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          <div className="relative w-full max-w-2xl mx-auto touch-none select-none px-4 md:px-0">
            <img 
              ref={imageRef}
              src={imageSrc} 
              alt="Tabla Tollaro" 
              className="w-full h-auto border border-slate-300 shadow-sm pointer-events-none rounded bg-white"
              onError={() => setImgError(true)}
              onLoad={() => setImgLoaded(true)}
            />

            {/* Marco Deslizante Azul */}
            <div 
              className="absolute border-2 border-blue-500 bg-blue-500/15 shadow-[0_0_15px_rgba(59,130,246,0.3)] z-30 cursor-grab active:cursor-grabbing flex items-center justify-center transition-opacity"
              style={{
                left: '1rem', // padding compensating px-4
                width: 'calc(100% - 2rem)',
                height: '40%',
                top: `${frameRelY * 100}%`,
                transform: 'translateY(-50%)',
                clipPath: 'polygon(0% 42%, 18% 42%, 18% 17%, 42% 17%, 42% 22.5%, 60% 22.5%, 60% 3%, 82% 3%, 82% 44%, 100% 44%, 100% 56%, 82% 56%, 82% 95%, 60% 95%, 60% 78%, 42% 78%, 42% 83%, 18% 83%, 18% 58%, 0% 58%)'
              }}
              onMouseDown={(e) => handlePointerDown(e, 'frame')}
              onTouchStart={(e) => handlePointerDown(e, 'frame')}
            >
              {/* Línea roja central */}
              <div className="w-full h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] absolute top-1/2 -translate-y-1/2" />
            </div>

            {/* Marcadores Verdes (5 Columnas) */}
            {markersRelY.map((relY, idx) => (
              <div 
                key={idx}
                className="absolute w-6 h-6 md:w-8 md:h-8 bg-green-500/50 border-2 border-white/90 rounded-full cursor-ns-resize z-40 shadow-lg flex items-center justify-center hover:bg-green-500/80 transition-colors -translate-x-1/2 -translate-y-1/2 backdrop-blur-sm"
                style={{
                  left: `calc(1rem + ${(idx * 20) + 10}% - 0.2rem)`, // Ajuste dinámico exacto al centro de cada columna (20% por col)
                  top: `${relY * 100}%`
                }}
                onMouseDown={(e) => handlePointerDown(e, idx)}
                onTouchStart={(e) => handlePointerDown(e, idx)}
              >
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full opacity-90 shadow-sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrtodonciaApp() {
  
  // --- ESTADOS INICIALES ---
  // AHORA LOS ESTADOS SON STRINGS ("") PARA EVITAR EL BUG DEL TECLADO MÓVIL AL BORRAR O ESCRIBIR "0"
  
  const [maxilar, setMaxilar] = useState({
    16: "10", 15: "7", 14: "7", 13: "8", 12: "6", 11: "8", 21: "8", 22: "6", 23: "8", 24: "7", 25: "7", 26: "10"
  });

  const [mandibula, setMandibula] = useState({
    46: "10", 45: "7", 44: "7", 43: "7", 42: "6", 41: "5", 31: "5", 32: "6", 33: "7", 34: "7", 35: "7", 36: "10"
  });

  // Estado para el cálculo VERT (Almacenado como texto temporalmente durante la edición)
  const [vertData, setVertData] = useState({
    edad: "9",
    ejeFacial: "82",
    profunFacial: "86",
    anguloPM: "35",
    altFacialInf: "57",
    arcoMandibular: "25"
  });

  const [activeTab, setActiveTab] = useState('bolton'); // 'bolton' | 'vert' | 'tollaro'

  
  // Helper ultra-robusto para convertir textos a números (soporta coma decimal, espacios y evita NaN/crashes)
  const getNum = (val) => {
    if (val === null || val === undefined) return 0;
    const str = String(val).trim().replace(',', '.');
    if (str === '' || str === '-') return 0;
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const analisisDentario = useMemo(() => {
    const valsMax = Object.values(maxilar).map(getNum);
    const valsMand = Object.values(mandibula).map(getNum);

    // Suma de los 12 dientes
    const sum12Max = valsMax.reduce((a, b) => a + b, 0); 
    const sum12Mand = valsMand.reduce((a, b) => a + b, 0); 

    // Suma de los 6 anteriores (canino a canino)
    const sum6Max = getNum(maxilar[13]) + getNum(maxilar[12]) + getNum(maxilar[11]) + 
                    getNum(maxilar[21]) + getNum(maxilar[22]) + getNum(maxilar[23]);
    
    const sum6Mand = getNum(mandibula[43]) + getNum(mandibula[42]) + getNum(mandibula[41]) + 
                     getNum(mandibula[31]) + getNum(mandibula[32]) + getNum(mandibula[33]);

    // Cálculos Bolton
    const boltonAnteriorVal = sum6Max > 0 ? (sum6Mand / sum6Max) * 100 : 0;
    const boltonTotalVal = sum12Max > 0 ? (sum12Mand / sum12Max) * 100 : 0;

    const boltonAnterior = isNaN(boltonAnteriorVal) ? "0.0" : boltonAnteriorVal.toFixed(1);
    const boltonTotal = isNaN(boltonTotalVal) ? "0.0" : boltonTotalVal.toFixed(1);

    // Diagnósticos Bolton
    const difAnt = boltonAnteriorVal - 77.2;
    const diagAnt = difAnt > 0 ? 'Aumentado: Exceso inferior' : 'Disminuido: Exceso superior';
    const difTot = boltonTotalVal - 91.2;
    const diagTot = difTot > 0 ? 'Aumentado: Exceso inferior' : 'Disminuido: Exceso superior';

    // Tanaka - Johnston (Suma de los 4 incisivos inferiores)
    const sii = getNum(mandibula[42]) + getNum(mandibula[41]) + getNum(mandibula[31]) + getNum(mandibula[32]); 
    const tanakaSup = (sii / 2) + 11; 
    const tanakaInf = (sii / 2) + 10.5; 

    return {
      sum12Max, sum12Mand, sum6Max, sum6Mand,
      boltonAnterior, boltonTotal,
      diagAnt, diagTot,
      sii, 
      tanakaSup: isNaN(tanakaSup) ? "0.0" : tanakaSup.toFixed(1), 
      tanakaInf: isNaN(tanakaInf) ? "0.0" : tanakaInf.toFixed(1)
    };
  }, [maxilar, mandibula]);


  const analisisVert = useMemo(() => {
    // Convertir el texto a número solo en el momento de calcular
    const edadRaw = getNum(vertData.edad);
    const edadCalculo = Math.min(Math.max(edadRaw, 9), 19); // Máximo 19, Mínimo 9
    const difEdad = edadCalculo - 9;

    const normas = {
      ejeFacial: { base: 90, varAnual: 0, ds: 3, reverseSign: false },
      profunFacial: { base: 87, varAnual: 0.3333333333, ds: 3, reverseSign: false },
      anguloPM: { base: 26, varAnual: -0.3, ds: 4, reverseSign: true }, 
      altFacialInf: { base: 47, varAnual: 0, ds: 4, reverseSign: true }, 
      arcoMandibular: { base: 26, varAnual: 0.5, ds: 4, reverseSign: false }
    };

    const variables = ['ejeFacial', 'profunFacial', 'anguloPM', 'altFacialInf', 'arcoMandibular'];
    let vertSum = 0;
    const detalles = {};

    variables.forEach(v => {
      const normaEdad = normas[v].base + (difEdad * normas[v].varAnual);
      const valPcte = getNum(vertData[v]);
      
      let desvio = normas[v].reverseSign 
        ? (normaEdad - valPcte) / normas[v].ds 
        : (valPcte - normaEdad) / normas[v].ds;

      if (isNaN(desvio)) desvio = 0;

      detalles[v] = { normaEdad, ds: normas[v].ds, valorSigno: desvio };
      vertSum += desvio;
    });

    const vertTotalVal = vertSum / 5;
    const vertTotal = isNaN(vertTotalVal) ? "0.00" : vertTotalVal.toFixed(2);
    
    let biotipo = "";
    const vt = parseFloat(vertTotal);
    if (isNaN(vt)) biotipo = "Mesofacial";
    else if (vt >= 1) biotipo = "Braquifacial Severo";
    else if (vt >= 0.5) biotipo = "Braquifacial";
    else if (vt >= -0.5) biotipo = "Mesofacial";
    else if (vt >= -1.5) biotipo = "Dolicofacial";
    else biotipo = "Dolicofacial Severo";

    return { difEdad, detalles, vertTotal, biotipo };
  }, [vertData]);

  const handleTeethChange = (arch, tooth, value) => {
    if (arch === 'max') setMaxilar(prev => ({ ...prev, [tooth]: value }));
    else setMandibula(prev => ({ ...prev, [tooth]: value }));
  };

  const handleVertChange = (field, value) => {
    setVertData(prev => ({ ...prev, [field]: value }));
  };

  const vertLabels = {
    ejeFacial: "Eje Facial",
    profunFacial: "Profun. Facial",
    anguloPM: "Ángulo del PM",
    altFacialInf: "Altura Facial Inferior",
    arcoMandibular: "Arco Mandibular"
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Responsivo */}
        <div className="bg-indigo-900 text-white p-5 md:p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Análisis Ortodóncico</h1>
            <p className="text-indigo-200 mt-1 text-sm md:text-base">Bolton, Tanaka, VERT y Tollaro</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button 
              onClick={() => setActiveTab('bolton')} 
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-colors ${activeTab === 'bolton' ? 'bg-indigo-500 text-white shadow-md' : 'bg-indigo-950/50 text-indigo-300 hover:bg-indigo-800'}`}
            >
              Modelos
            </button>
            <button 
              onClick={() => setActiveTab('vert')} 
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-colors ${activeTab === 'vert' ? 'bg-indigo-500 text-white shadow-md' : 'bg-indigo-950/50 text-indigo-300 hover:bg-indigo-800'}`}
            >
              VERT Ricketts
            </button>
            <button 
              onClick={() => setActiveTab('tollaro')} 
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-colors ${activeTab === 'tollaro' ? 'bg-indigo-500 text-white shadow-md' : 'bg-indigo-950/50 text-indigo-300 hover:bg-indigo-800'}`}
            >
              Tollaro
            </button>
          </div>
        </div>

        {/* PESTAÑA BOLTON Y TANAKA */}
        {activeTab === 'bolton' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-800">Odontometría (mm)</h2>
                  <p className="text-sm text-slate-500">Mide cada diente e ingresa el ancho mesiodistal.</p>
                </div>

                {/* Maxilar */}
                <div className="mb-8 overflow-x-auto pb-2 custom-scrollbar">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-indigo-900 bg-indigo-50 px-2 py-1 rounded">Maxilar</span>
                    <span className="text-sm text-slate-400">Total: {analisisDentario.sum12Max}mm</span>
                  </div>
                  <div className="flex justify-between gap-1 min-w-max">
                    {[16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26].map(tooth => (
                      <div key={tooth} className="flex flex-col items-center">
                        <label className="text-xs text-slate-400 mb-1">{tooth}</label>
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={maxilar[tooth]} 
                          onChange={(e) => handleTeethChange('max', tooth, e.target.value)}
                          className={`w-12 h-12 text-center rounded border-2 font-semibold focus:border-indigo-500 focus:ring-0 transition-colors
                            ${[13,12,11,21,22,23].includes(tooth) ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mandíbula */}
                <div className="overflow-x-auto pb-2 custom-scrollbar">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-1 rounded">Mandíbula</span>
                    <span className="text-sm text-slate-400">Total: {analisisDentario.sum12Mand}mm</span>
                  </div>
                  <div className="flex justify-between gap-1 min-w-max">
                    {[46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36].map(tooth => (
                      <div key={tooth} className="flex flex-col items-center">
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={mandibula[tooth]} 
                          onChange={(e) => handleTeethChange('mand', tooth, e.target.value)}
                          className={`w-12 h-12 text-center rounded border-2 font-semibold focus:border-indigo-500 focus:ring-0 transition-colors
                            ${[43,42,41,31,32,33].includes(tooth) ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                        />
                        <label className="text-xs text-slate-400 mt-1">{tooth}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              {/* Resultados Bolton */}
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-indigo-500">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Análisis de Bolton</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-medium text-slate-500">Anterior (6 a 6)</p>
                      <p className="text-2xl font-black text-indigo-600">{analisisDentario.boltonAnterior}%</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Norma: 77.2% | Sumas: M={analisisDentario.sum6Max} m={analisisDentario.sum6Mand}</p>
                    <div className={`mt-2 p-2 rounded text-sm font-medium ${analisisDentario.boltonAnterior > 77.2 ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'}`}>
                      {analisisDentario.diagAnt}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-medium text-slate-500">Total (12 a 12)</p>
                      <p className="text-2xl font-black text-indigo-600">{analisisDentario.boltonTotal}%</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Norma: 91.2% | Sumas: M={analisisDentario.sum12Max} m={analisisDentario.sum12Mand}</p>
                    <div className={`mt-2 p-2 rounded text-sm font-medium ${analisisDentario.boltonTotal > 91.2 ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'}`}>
                      {analisisDentario.diagTot}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resultados Tanaka */}
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-emerald-500">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Tanaka-Johnston</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span className="text-sm font-medium text-slate-600">SII (4 incisivos inf.)</span>
                    <span className="font-bold text-slate-800">{analisisDentario.sii} mm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Espacio Nec. Sup</span>
                    <span className="font-bold text-emerald-600">{analisisDentario.tanakaSup} mm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Espacio Nec. Inf</span>
                    <span className="font-bold text-emerald-600">{analisisDentario.tanakaInf} mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA VERT */}
        {activeTab === 'vert' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Medidas Cefalométricas</h2>
              
              <div className="space-y-4">
                <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <label className="block text-sm font-semibold text-orange-900 mb-1">Edad del Paciente</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={vertData.edad}
                    onChange={(e) => handleVertChange('edad', e.target.value)}
                    className="w-full p-2 rounded border border-orange-200 focus:ring-orange-500 font-bold"
                  />
                  <p className="text-xs text-orange-700 mt-1">Diferencia usada: {analisisVert.difEdad} años</p>
                </div>

                {Object.keys(vertLabels).map(key => (
                  <div key={key} className="flex justify-between items-center gap-4">
                    <label className="text-sm font-medium text-slate-600">{vertLabels[key]}</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={vertData[key]}
                      onChange={(e) => handleVertChange(key, e.target.value)}
                      className="w-24 p-2 rounded border border-slate-300 text-center font-bold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <p className="text-slate-500 font-medium mb-2">Índice VERT (Ricketts)</p>
                <h1 className={`text-5xl md:text-6xl font-black tracking-tighter mb-4 ${parseFloat(analisisVert.vertTotal) > 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                  {analisisVert.vertTotal}
                </h1>
                <div className="inline-block bg-slate-900 text-white px-6 py-2 rounded-full font-bold text-lg md:text-xl">
                  {analisisVert.biotipo}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap">Factor</th>
                        <th className="px-4 py-3">Nor(9a)</th>
                        <th className="px-4 py-3">D.S.</th>
                        <th className="px-4 py-3">Nor(Ajus)</th>
                        <th className="px-4 py-3">Paciente</th>
                        <th className="px-4 py-3">Desvío</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {Object.keys(vertLabels).map((v) => {
                        const d = analisisVert.detalles[v] || { normaEdad: 0, ds: 0, valorSigno: 0 };
                        const baseNorms = {
                          ejeFacial: { base: 90, ds: 3 },
                          profunFacial: { base: 87, ds: 3 },
                          anguloPM: { base: 26, ds: 4 },
                          altFacialInf: { base: 47, ds: 4 },
                          arcoMandibular: { base: 26, ds: 4 }
                        };

                        const normaEdadFormatted = (typeof d.normaEdad === 'number' && !isNaN(d.normaEdad)) ? d.normaEdad.toFixed(1) : '0.0';
                        const valorSignoNum = typeof d.valorSigno === 'number' && !isNaN(d.valorSigno) ? d.valorSigno : 0;
                        const valorSignoFormatted = (valorSignoNum > 0 ? '+' : '') + valorSignoNum.toFixed(2);
                        
                        return (
                          <tr key={v} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{vertLabels[v]}</td>
                            <td className="px-4 py-3 text-slate-500">{baseNorms[v]?.base ?? '-'}</td>
                            <td className="px-4 py-3 text-slate-500">{baseNorms[v]?.ds ?? '-'}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{normaEdadFormatted}</td>
                            <td className="px-4 py-3 font-bold text-indigo-600">{vertData[v]}</td>
                            <td className={`px-4 py-3 font-bold ${valorSignoNum < 0 ? 'text-rose-500' : 'text-sky-500'}`}>
                              {valorSignoFormatted}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA TOLLARO */}
        {activeTab === 'tollaro' && <TollaroTab />}

      </div>
    </div>
  );
}
