'use client';

import React, { useState, useRef, useEffect } from 'react';

// Tooth quadrant keys for 12 maxillary and 12 mandibular teeth
const TEETH_MAX_KEYS = ["16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26"];
const TEETH_MAND_KEYS = ["46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36"];

// Robust helper to sanitize string inputs to floating point numbers
const getNum = (val) => {
  if (val === null || val === undefined) return 0;
  const str = String(val).trim().replace(',', '.');
  if (str === '' || str === '-' || isNaN(Number(str))) return 0;
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Calculate Bolton anterior/total ratios and Tanaka-Johnston space requirements
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
  const diagAnt = boltonAnteriorVal === 0 ? 'Sin datos suficientes' : difAnt > 0 ? 'Aumentado: Exceso inferior' : 'Disminuido: Exceso superior';
  const difTot = boltonTotalVal - 91.2;
  const diagTot = boltonTotalVal === 0 ? 'Sin datos suficientes' : difTot > 0 ? 'Aumentado: Exceso inferior' : 'Disminuido: Exceso superior';

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

// Calculate Ricketts VERT Index and facial biotype
const calculateVert = (vertData) => {
  const edadNum = Math.min(19, Math.max(1, getNum(vertData.edad) || 9));
  const diffEdad = edadNum - 9;

  const factors = {
    ejeFacial: {
      label: 'Eje Facial',
      baseNorma: 90,
      ds: 3,
      calcNorma: () => 90,
      calcDesvio: (val, norma, ds) => (val - norma) / ds
    },
    profunFacial: {
      label: 'Profun. Facial',
      baseNorma: 87,
      ds: 3,
      calcNorma: (diff) => 87 + (diff * (1 / 3)),
      calcDesvio: (val, norma, ds) => (val - norma) / ds
    },
    anguloPM: {
      label: 'Ángulo del PM',
      baseNorma: 26,
      ds: 4,
      calcNorma: (diff) => 26 - (diff * (1 / 3)),
      calcDesvio: (val, norma, ds) => (norma - val) / ds
    },
    altFacialInf: {
      label: 'Alt. Facial Inf.',
      baseNorma: 47,
      ds: 4,
      calcNorma: () => 47,
      calcDesvio: (val, norma, ds) => (norma - val) / ds
    },
    arcoMandibular: {
      label: 'Arco Mandibular',
      baseNorma: 26,
      ds: 4,
      calcNorma: (diff) => 26 + (diff * 0.5),
      calcDesvio: (val, norma, ds) => (val - norma) / ds
    }
  };

  let sumDesvios = 0;
  const detalles = {};

  Object.keys(factors).forEach((key) => {
    const f = factors[key];
    const val = getNum(vertData[key]);
    const normaEdad = f.calcNorma(diffEdad);
    const valorSigno = f.calcDesvio(val, normaEdad, f.ds);

    detalles[key] = {
      normaEdad: Number(normaEdad.toFixed(1)),
      ds: f.ds,
      valorSigno: Number(valorSigno.toFixed(2))
    };
    sumDesvios += valorSigno;
  });

  const vertTotalVal = sumDesvios / 5;
  const vertTotal = isNaN(vertTotalVal) ? '0.00' : vertTotalVal.toFixed(2);

  let biotipo = 'Mesofacial';
  const v = parseFloat(vertTotal);
  if (v <= -2.0) biotipo = 'Dolicofacial Severo';
  else if (v <= -0.5) biotipo = 'Dolicofacial';
  else if (v < 0.5) biotipo = 'Mesofacial';
  else if (v < 2.0) biotipo = 'Braquifacial';
  else biotipo = 'Braquifacial Severo';

  return {
    edadCalculo: edadNum,
    vertTotal,
    biotipo,
    detalles
  };
};

function TollaroTab({ vertData }) {
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [frameRelY, setFrameRelY] = useState(0.5);
  const [markersRelY, setMarkersRelY] = useState([0.3, 0.4, 0.5, 0.4, 0.3]);
  const [draggingTarget, setDraggingTarget] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    if (!vertData) return;
    const factorNorms = [
      { key: 'ejeFacial', min: 78, max: 102 },
      { key: 'profunFacial', min: 75, max: 99 },
      { key: 'anguloPM', min: 38, max: 14 },
      { key: 'altFacialInf', min: 59, max: 35 },
      { key: 'arcoMandibular', min: 14, max: 38 }
    ];

    const newRelY = factorNorms.map(({ key, min, max }) => {
      const val = getNum(vertData[key]);
      if (!val) return 0.5;
      const pct = (val - min) / (max - min);
      return Math.max(0.05, Math.min(0.95, 1 - pct));
    });

    setMarkersRelY(newRelY);
  }, [vertData]);

  const handlePointerDown = (e, target) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // Fallback if capture is unsupported
    }
    setDraggingTarget(target);
  };

  const handlePointerMove = (e) => {
    if (draggingTarget === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let relY = (e.clientY - rect.top) / rect.height;
    relY = Math.max(0.02, Math.min(0.98, relY));

    if (draggingTarget === 'frame') {
      setFrameRelY(relY);
    } else if (typeof draggingTarget === 'number') {
      setMarkersRelY((prev) => {
        const next = [...prev];
        next[draggingTarget] = relY;
        return next;
      });
    }
  };

  const handlePointerUp = (e) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
    setDraggingTarget(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSrc(ev.target.result);
        setUseCustomImage(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentPixelY = containerRef.current
    ? Math.round(frameRelY * containerRef.current.clientHeight)
    : 0;

  const columns = [
    { name: 'Eje Facial', label: 'E.F.', norm: '90° ±3°' },
    { name: 'Profun. Facial', label: 'P.F.', norm: '87° ±3°' },
    { name: 'Ángulo PM', label: 'A.PM', norm: '26° ±4°' },
    { name: 'Alt. Facial Inf.', label: 'A.F.I.', norm: '47° ±4°' },
    { name: 'Arco Mandibular', label: 'A.M.', norm: '26° ±4°' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative mt-6">
      <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-indigo-900 font-bold text-base uppercase tracking-wider mb-1">Plantilla Interactiva Tollaro</h2>
          <p className="text-slate-600 text-xs">Arrastra los puntos verdes sobre los valores o desplaza el marco azul para encuadrar la tendencia facial.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setUseCustomImage(!useCustomImage)}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            {useCustomImage ? '📐 Usar Rejilla Vectorial' : '🖼️ Usar Imagen Personalizada'}
          </button>

          <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1">
            <span>📁 Subir Cefalometría</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="bg-slate-900 px-4 py-2 text-white flex justify-between items-center relative z-40 text-xs">
        <div className="flex items-center gap-2 text-indigo-300 font-medium">
          <span>Modo: {useCustomImage ? 'Imagen Externa' : 'Gráfico Tollaro Vectorial'}</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Posición Y:</span>
          <span className="font-mono font-bold text-indigo-400">{currentPixelY} px ({Math.round(frameRelY * 100)}%)</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full min-h-[500px] h-[60vh] max-h-[650px] bg-slate-900 select-none touch-none overflow-hidden flex justify-center items-center p-4"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {useCustomImage && imageSrc ? (
          <img
            src={imageSrc}
            alt="Cefalometría Tollaro"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-slate-950 p-6 flex flex-col justify-between pointer-events-none">
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold border-b border-slate-800 pb-2 z-10">
              {columns.map((col, i) => (
                <div key={i} className="text-slate-300">
                  <div className="text-indigo-400 font-bold text-sm">{col.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{col.name}</div>
                  <div className="text-[10px] text-emerald-400">{col.norm}</div>
                </div>
              ))}
            </div>

            <div className="relative flex-1 w-full my-2 border-x border-slate-800">
              <div className="absolute top-[35%] bottom-[35%] left-0 right-0 bg-emerald-500/10 border-y border-emerald-500/30 flex items-center justify-end pr-2">
                <span className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest">Zona Mesofacial</span>
              </div>

              <div className="absolute top-0 h-[35%] left-0 right-0 border-b border-sky-500/20 p-1">
                <span className="text-[10px] font-bold text-sky-400/50 uppercase tracking-widest">Tendencia Braquifacial</span>
              </div>

              <div className="absolute bottom-0 h-[35%] left-0 right-0 border-t border-rose-500/20 p-1 flex items-end">
                <span className="text-[10px] font-bold text-rose-400/50 uppercase tracking-widest">Tendencia Dolicofacial</span>
              </div>

              <div className="absolute inset-0 grid grid-cols-5 pointer-events-none">
                {columns.map((_, i) => (
                  <div key={i} className="border-r border-slate-800/80 last:border-r-0 h-full flex justify-center items-center">
                    <div className="w-[1px] h-full bg-dashed bg-slate-800" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Draggable Blue Tollaro Frame */}
        <div
          className="absolute border-2 border-blue-400 bg-blue-500/20 backdrop-blur-[1px] shadow-[0_0_20px_rgba(59,130,246,0.4)] z-30 cursor-grab active:cursor-grabbing flex items-center justify-center touch-none rounded-sm transition-shadow hover:border-blue-300"
          style={{
            left: '5%',
            width: '90%',
            height: '38%',
            top: `${frameRelY * 100}%`,
            transform: 'translateY(-50%)'
          }}
          onPointerDown={(e) => handlePointerDown(e, 'frame')}
        >
          <div className="w-full h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] absolute top-1/2 -translate-y-1/2 pointer-events-none" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/40 pointer-events-none shadow-sm">
            Marco Tollaro (Desplazar)
          </span>
        </div>

        {/* Draggable Green Column Markers */}
        {markersRelY.map((relY, idx) => (
          <div
            key={idx}
            className="absolute w-7 h-7 md:w-8 md:h-8 bg-emerald-500 border-2 border-white rounded-full cursor-ns-resize z-40 shadow-[0_0_12px_rgba(16,185,129,0.8)] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform -translate-x-1/2 -translate-y-1/2 touch-none"
            style={{
              left: `${idx * 20 + 10}%`,
              top: `${relY * 100}%`
            }}
            onPointerDown={(e) => handlePointerDown(e, idx)}
          >
            <span className="text-[10px] font-bold text-slate-900 pointer-events-none">{idx + 1}</span>
          </div>
        ))}
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

  const [maxilar, setMaxilar] = useState(initialMaxilar);
  const [mandibula, setMandibula] = useState(initialMandibula);
  const [vertData, setVertData] = useState(initialVertData);
  const analisisDentario = calculateDentario(maxilar, mandibula);

  const [activeTab, setActiveTab] = useState('bolton');

  //const [analisisDentario, setAnalisisDentario] = useState(() => calculateDentario(initialMaxilar, initialMandibula));
  const [analisisVert, setAnalisisVert] = useState(() => calculateVert(initialVertData));

  // Auto-recalculate whenever maxillary, mandibular, or VERT data changes
  //useEffect(() => {
   // setAnalisisDentario(calculateDentario(maxilar, mandibula));
 // }, [maxilar, mandibula]);

  useEffect(() => {
    setAnalisisVert(calculateVert(vertData));
  }, [vertData]);

  //const handleCalcularDentario = (e) => {
    //if (e) e.preventDefault();
    //setAnalisisDentario(calculateDentario(maxilar, mandibula));
  };

  const handleCalcularVert = (e) => {
    if (e) e.preventDefault();
    setAnalisisVert(calculateVert(vertData));
  };

  const handleTeethChange = (arch, tooth, value) => {
    const toothKey = String(tooth);
    if (arch === 'max') {
      setMaxilar((prev) => ({ ...prev, [toothKey]: value }));
    } else {
      setMandibula((prev) => ({ ...prev, [toothKey]: value }));
    }
  };

  const handleVertChange = (field, value) => {
    setVertData((prev) => ({ ...prev, [field]: value }));
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
              type="button"
              onClick={() => setActiveTab('bolton')} 
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-colors ${activeTab === 'bolton' ? 'bg-indigo-500 text-white shadow-md' : 'bg-indigo-950/50 text-indigo-300 hover:bg-indigo-800'}`}
            >
              Modelos
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('vert')} 
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-colors ${activeTab === 'vert' ? 'bg-indigo-500 text-white shadow-md' : 'bg-indigo-950/50 text-indigo-300 hover:bg-indigo-800'}`}
            >
              VERT Ricketts
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('tollaro')} 
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-colors ${activeTab === 'tollaro' ? 'bg-indigo-500 text-white shadow-md' : 'bg-indigo-950/50 text-indigo-300 hover:bg-indigo-800'}`}
            >
              Tollaro
            </button>
          </div>
        </div>

        {/* PESTAÑA MODELOS (Bolton y Tanaka) */}
        {}
        {activeTab === 'bolton' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">Medidas Dentarias (mm)</h2>
                //<button
                  //type="button"
                  //onClick={handleCalcularDentario}
                  //className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm flex items-center gap-1.5"
                //>
                 // ⚡ Recalcular
                //</button>
              </div>

              {/* Maxilar */}
              <div className="mb-8 overflow-x-auto pb-2 custom-scrollbar">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-indigo-900 bg-indigo-50 px-2 py-1 rounded">Maxilar</span>
                </div>
                <div className="flex justify-between gap-1 min-w-max">
                  {TEETH_MAX_KEYS.map((tooth) => (
                    <div key={tooth} className="flex flex-col items-center">
                      <label className="text-xs text-slate-400 mb-1">{tooth}</label>
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={maxilar[tooth] ?? ''} 
                        onChange={(e) => handleTeethChange('max', tooth, e.target.value)}
                        className={`w-12 h-12 text-center rounded border-2 font-semibold focus:border-indigo-500 focus:ring-0 transition-colors
                          ${["13","12","11","21","22","23"].includes(tooth) ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
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
                  {TEETH_MAND_KEYS.map((tooth) => (
                    <div key={tooth} className="flex flex-col items-center">
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={mandibula[tooth] ?? ''} 
                        onChange={(e) => handleTeethChange('mand', tooth, e.target.value)}
                        className={`w-12 h-12 text-center rounded border-2 font-semibold focus:border-indigo-500 focus:ring-0 transition-colors
                          ${["43","42","41","31","32","33"].includes(tooth) ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      />
                      <label className="text-xs text-slate-400 mt-1">{tooth}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel lateral con Resultados */}
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
        {}
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
                      className="w-full p-2 rounded border border-orange-200 focus:ring-orange-500 font-bold text-slate-800"
                    />
                  </div>

                  {Object.keys(vertLabels).map((key) => (
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

              {/* Botón de calcular VERT */}
              <button
                type="button"
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
                <h1 className={`text-5xl md:text-6xl font-black tracking-tighter mb-4 ${parseFloat(analisisVert.vertTotal) >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
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
        {}
        {activeTab === 'tollaro' && <TollaroTab vertData={vertData} />}

      </div>
    </div>
  );
}
