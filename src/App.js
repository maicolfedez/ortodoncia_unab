'use client';
import React, { useState, useRef, useEffect } from 'react';

const TEETH_MAX_KEYS = ["16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26"];
const TEETH_MAND_KEYS = ["46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36"];

// Helper ultra-robusto para convertir textos a números
const getNum = (val) => {
  if (val === null || val === undefined) return 0;
  const str = String(val).trim().replace(',', '.');
  if (str === '' || str === '-') return 0;
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Función de cálculo para Odontometría (Bolton y Tanaka-Johnston)
const calculateDentario = (maxInputs, mandInputs) => {
  const sum12MaxRaw = TEETH_MAX_KEYS.reduce((acc, key) => acc + getNum(maxInputs[key]), 0);
  const sum12MandRaw = TEETH_MAND_KEYS.reduce((acc, key) => acc + getNum(mandInputs[key]), 0);

  const sum6MaxRaw = getNum(maxInputs["13"]) + getNum(maxInputs["12"]) + getNum(maxInputs["11"]) + 
                     getNum(maxInputs["21"]) + getNum(maxInputs["22"]) + getNum(maxInputs["23"]);
  
  const sum6MandRaw = getNum(mandInputs["43"]) + getNum(mandInputs["42"]) + getNum(mandInputs["41"]) + 
                      getNum(mandInputs["31"]) + getNum(mandInputs["32"]) + getNum(mandInputs["33"]);

  const sum12Max = Number(sum12MaxRaw.toFixed(1));
  const sum12Mand = Number(sum12MandRaw.toFixed(1));
  const sum6Max = Number(sum6MaxRaw.toFixed(1));
  const sum6Mand = Number(sum6MandRaw.toFixed(1));

  const boltonAnteriorVal = sum6Max > 0 ? (sum6Mand / sum6Max) * 100 : 0;
  const boltonTotalVal = sum12Max > 0 ? (sum12Mand / sum12Max) * 100 : 0;

  const boltonAnterior = isNaN(boltonAnteriorVal) ? "0.0" : boltonAnteriorVal.toFixed(1);
  const boltonTotal = isNaN(boltonTotalVal) ? "0.0" : boltonTotalVal.toFixed(1);

  const difAnt = boltonAnteriorVal - 77.2;
  const diagAnt = difAnt > 0 ? 'Aumentado: Exceso inferior' : 'Disminuido: Exceso superior';
  const difTot = boltonTotalVal - 91.2;
  const diagTot = difTot > 0 ? 'Aumentado: Exceso inferior' : 'Disminuido: Exceso superior';

  const siiRaw = getNum(mandInputs["42"]) + getNum(mandInputs["41"]) + getNum(mandInputs["31"]) + getNum(mandInputs["32"]); 
  const sii = Number(siiRaw.toFixed(1));
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
};

// Función de cálculo para VERT Ricketts
const calculateVert = (vData) => {
  const edadNum = getNum(vData.edad);
  const edadCalculo = edadNum > 0 ? edadNum : 9;
  const difEdad = edadCalculo - 9;

  const baseNorms = {
    ejeFacial: { base: 90, ds: 3, ageFactor: 0 },
    profunFacial: { base: 87, ds: 3, ageFactor: 1 / 3 },
    anguloPM: { base: 26, ds: 4, ageFactor: -1 / 3 },
    altFacialInf: { base: 47, ds: 4, ageFactor: 0 },
    arcoMandibular: { base: 26, ds: 4, ageFactor: 1 / 3 }
  };

  let sumDeviations = 0;
  const detalles = {};

  Object.keys(baseNorms).forEach((key) => {
    const { base, ds, ageFactor } = baseNorms[key];
    const normaEdad = base + (difEdad * ageFactor);
    const pacienteVal = getNum(vData[key]);

    let dev = 0;
    if (key === 'anguloPM' || key === 'altFacialInf') {
      dev = (normaEdad - pacienteVal) / ds;
    } else {
      dev = (pacienteVal - normaEdad) / ds;
    }

    detalles[key] = {
      normaEdad,
      ds,
      valorSigno: dev
    };

    sumDeviations += dev;
  });

  const vertVal = sumDeviations / 5;
  const vertTotal = vertVal.toFixed(2);

  let biotipo = 'Mesofacial';
  if (vertVal < -1.5) biotipo = 'Dolicofacial Severo';
  else if (vertVal < -0.5) biotipo = 'Dolicofacial';
  else if (vertVal <= 0.5) biotipo = 'Mesofacial';
  else if (vertVal <= 1.5) biotipo = 'Braquifacial';
  else biotipo = 'Braquifacial Severo';

  return {
    edadCalculo,
    difEdad,
    detalles,
    vertTotal,
    biotipo
  };
};

function TollaroTab() {
  const [imageSrc, setImageSrc] = useState('https://lh3.googleusercontent.com/d/1AFFQRm-hgrInhR0qINq310luVxI1mxiM');
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  const [frameRelY, setFrameRelY] = useState(0.5);
  const [markersRelY, setMarkersRelY] = useState([0.1, 0.1, 0.1, 0.1, 0.1]);

  const imageRef = useRef(null);
  const [draggingIdx, setDraggingIdx] = useState(null);

  const handlePointerDown = (e, target) => {
    if (e.type === 'touchstart') e.preventDefault();
    setDraggingIdx(target);
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (draggingIdx === null || !imageRef.current) return;
      
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = imageRef.current.getBoundingClientRect();
      
      let relY = (clientY - rect.top) / rect.height;
      relY = Math.max(0, Math.min(1, relY));

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

  const currentPixelY = imageRef.current && imageRef.current.naturalHeight && imgLoaded
    ? Math.round(frameRelY * imageRef.current.naturalHeight) 
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative mt-6">
      <div className="p-6 bg-slate-50 border-b border-slate-200">
        <h2 className="text-blue-900 font-bold text-sm uppercase tracking-wider mb-3">Instrucciones de uso Tollaro</h2>
        <ol className="space-y-2 text-slate-700 text-sm">
          <li className="flex gap-2 items-center"><span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px]">1</span><span>Realice la cefalometría para obtener los valores base.</span></li>
          <li className="flex gap-2 items-center"><span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px]">2</span><span>Desplace los <b>puntos verdes</b> sobre los números obtenidos.</span></li>
          <li className="flex gap-2 items-center"><span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px]">3</span><span>Ajuste el <b>marco azul</b> hasta contener la mayor cantidad de puntos.</span></li>
        </ol>
      </div>

      <div className="bg-slate-900 p-3 text-white flex justify-between items-center relative z-40">
        <div className="flex items-center gap-2 ml-2 text-blue-400">
          <span className="text-[10px] font-bold uppercase tracking-widest">Área Interactiva</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 shadow-inner">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Y:</span>
          <span className="text-sm md:text-lg font-mono font-bold text-blue-400">{currentPixelY} px</span>
        </div>
      </div>

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

            <div 
              className="absolute border-2 border-blue-500 bg-blue-500/15 shadow-[0_0_15px_rgba(59,130,246,0.3)] z-30 cursor-grab active:cursor-grabbing flex items-center justify-center transition-opacity"
              style={{
                left: '1rem',
                width: 'calc(100% - 2rem)',
                height: '40%',
                top: `${frameRelY * 100}%`,
                transform: 'translateY(-50%)',
                clipPath: 'polygon(0% 42%, 18% 42%, 18% 17%, 42% 17%, 42% 22.5%, 60% 22.5%, 60% 3%, 82% 3%, 82% 44%, 100% 44%, 100% 56%, 82% 56%, 82% 95%, 60% 95%, 60% 78%, 42% 78%, 42% 83%, 18% 83%, 18% 58%, 0% 58%)'
              }}
              onMouseDown={(e) => handlePointerDown(e, 'frame')}
              onTouchStart={(e) => handlePointerDown(e, 'frame')}
            >
              <div className="w-full h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] absolute top-1/2 -translate-y-1/2" />
            </div>

            {markersRelY.map((relY, idx) => (
              <div 
                key={idx}
                className="absolute w-6 h-6 md:w-8 md:h-8 bg-green-500/50 border-2 border-white/90 rounded-full cursor-ns-resize z-40 shadow-lg flex items-center justify-center hover:bg-green-500/80 transition-colors -translate-x-1/2 -translate-y-1/2 backdrop-blur-sm"
                style={{
                  left: `calc(1rem + ${(idx * 20) + 10}% - 0.2rem)`,
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
  const initialMaxilar = {
    "16": "10", "15": "7", "14": "7", "13": "8", "12": "6", "11": "8",
    "21": "8", "22": "6", "23": "8", "24": "7", "25": "7", "26": "10"
  };

  const initialMandibula = {
    "46": "10", "45": "7", "44": "7", "43": "7", "42": "6", "41": "5",
    "31": "5", "32": "6", "33": "7", "34": "7", "35": "7", "36": "10"
  };

  const initialVertData = {
    edad: "9",
    ejeFacial: "82",
    profunFacial: "86",
    anguloPM: "35",
    altFacialInf: "57",
    arcoMandibular: "25"
  };

  // Estados para capturar entradas de texto
  const [maxilar, setMaxilar] = useState(initialMaxilar);
  const [mandibula, setMandibula] = useState(initialMandibula);
  const [vertData, setVertData] = useState(initialVertData);

  const [activeTab, setActiveTab] = useState('bolton');

  // Estados que guardan los RESULTADOS CALCULADOS solo al hacer clic en "Calcular"
  const [analisisDentario, setAnalisisDentario] = useState(() => calculateDentario(initialMaxilar, initialMandibula));
  const [analisisVert, setAnalisisVert] = useState(() => calculateVert(initialVertData));

  // Handlers para la ejecución manual del cálculo al presionar los botones
  const handleCalcularDentario = () => {
    setAnalisisDentario(calculateDentario(maxilar, mandibula));
  };

  const handleCalcularVert = () => {
    setAnalisisVert(calculateVert(vertData));
  };

  const handleTeethChange = (arch, tooth, value) => {
    const toothKey = String(tooth);
    if (arch === 'max') {
      setMaxilar(prev => ({ ...prev, [toothKey]: value }));
    } else {
      setMandibula(prev => ({ ...prev, [toothKey]: value }));
    }
  };

  const handleVertChange = (field, value) => {
    setVertData(prev => ({ ...prev, [field]: value }));
  };

  const vertLabels = {
    ejeFacial: "Eje Facial",
    profunFacial: "Profun. Facial",
    anguloPM: "Ángulo del PM",
    altFacialInf: "Alt. Facial Inf.",
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
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Odontometría (mm)</h2>
                    <p className="text-sm text-slate-500">Mide cada diente e ingresa el ancho mesiodistal.</p>
                  </div>
                  {/* Botón de calcular en la pestaña de modelos */}
                  <button
                    onClick={handleCalcularDentario}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Calcular Bolton / Tanaka
                  </button>
                </div>

                {/* Maxilar */}
                <div className="mb-8 overflow-x-auto pb-2 custom-scrollbar">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-indigo-900 bg-indigo-50 px-2 py-1 rounded">Maxilar</span>
                  </div>
                  <div className="flex justify-between gap-1 min-w-max">
                    {[16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26].map(tooth => (
                      <div key={tooth} className="flex flex-col items-center">
                        <label className="text-xs text-slate-400 mb-1">{tooth}</label>
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={maxilar[String(tooth)] ?? ''} 
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
                  </div>
                  <div className="flex justify-between gap-1 min-w-max">
                    {[46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36].map(tooth => (
                      <div key={tooth} className="flex flex-col items-center">
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={mandibula[String(tooth)] ?? ''} 
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
                      <p className="text-2xl font-black text-indigo-600">{analisisDentario.boltonAnterior} %</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Norma: 77,2% | Sumas: M= {analisisDentario.sum6Max} m= {analisisDentario.sum6Mand}</p>
                    <div className={`mt-2 p-2 rounded text-sm font-medium ${parseFloat(analisisDentario.boltonAnterior) > 77.2 ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'}`}>
                      {analisisDentario.diagAnt}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-medium text-slate-500">Total (12 a 12)</p>
                      <p className="text-2xl font-black text-indigo-600">{analisisDentario.boltonTotal} %</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Norma: 91,2% | Sumas: M= {analisisDentario.sum12Max} m= {analisisDentario.sum12Mand}</p>
                    <div className={`mt-2 p-2 rounded text-sm font-medium ${parseFloat(analisisDentario.boltonTotal) > 91.2 ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'}`}>
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
            
            <div className="lg:col-span-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Medidas Cefalométricas</h2>
                
                <div className="space-y-4">
                  <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <label className="block text-sm font-semibold text-orange-900 mb-1">Edad del Paciente</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={vertData.edad ?? ''}
                      onChange={(e) => handleVertChange('edad', e.target.value)}
                      className="w-full p-2 rounded border border-orange-200 focus:ring-orange-500 font-bold"
                    />
                  </div>

                  {Object.keys(vertLabels).map(key => (
                    <div key={key} className="flex justify-between items-center gap-4">
                      <label className="text-sm font-medium text-slate-600">{vertLabels[key]}</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={vertData[key] ?? ''}
                        onChange={(e) => handleVertChange(key, e.target.value)}
                        className="w-24 p-2 rounded border border-slate-300 text-center font-bold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de calcular en la pestaña de VERT */}
              <button
                onClick={handleCalcularVert}
                className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Calcular VERT
              </button>
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

              {/* Tabla VERT con Columna Dinámica de Edad */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap">Factor</th>
                        <th className="px-4 py-3">Norma Base (9a)</th>
                        <th className="px-4 py-3">D.S.</th>
                        <th className="px-4 py-3 bg-indigo-50/70 text-indigo-900 font-bold border-x border-indigo-100">
                          Norma ({analisisVert.edadCalculo}a)
                        </th>
                        <th className="px-4 py-3">Desvío</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {Object.keys(vertLabels).map((v) => {
                        const d = analisisVert.detalles?.[v] || { normaEdad: 0, ds: 0, valorSigno: 0 };
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
                            
                            <td className="px-4 py-3 font-bold text-indigo-900 bg-indigo-50/40 border-x border-indigo-100">
                              {normaEdadFormatted}
                            </td>

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
