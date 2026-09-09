import React, { useState, useMemo, useRef, useEffect } from "react";

const TollaroAnalysis = () => {
  const [imageSrc, setImageSrc] = useState(
    "https://lh3.googleusercontent.com/d/1AFFQRm-hgrInhR0qINq310luVxI1mxiM"
  );
  const [imgError, setImgError] = useState(false);

  // Posiciones relativas (porcentaje 0 a 1) para que sea responsivo
  const [relFrameY, setRelFrameY] = useState(0.5);
  const [relMarkersY, setRelMarkersY] = useState([0.1, 0.1, 0.1, 0.1, 0.1]);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [dragging, setDragging] = useState(null); // 'frame' | 'marker-0' ...

  const containerRef = useRef(null);

  const handleImageLoad = (e) => setNaturalHeight(e.target.naturalHeight);
  const handleImageError = () => setImgError(true);

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

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragging || !containerRef.current) return;
      // Prevenir el scroll de pantalla en móviles mientras se arrastra
      if (e.cancelable && e.type.includes("touch")) e.preventDefault();

      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = containerRef.current.getBoundingClientRect();
      let newRelY = (y - rect.top) / rect.height;
      newRelY = Math.max(0, Math.min(1, newRelY)); // Limitar dentro de la imagen

      if (dragging === "frame") {
        setRelFrameY(newRelY);
      } else if (dragging.startsWith("marker-")) {
        const idx = parseInt(dragging.split("-")[1]);
        setRelMarkersY((prev) => {
          const next = [...prev];
          next[idx] = newRelY;
          return next;
        });
      }
    };

    const handleUp = () => setDragging(null);

    // Eventos globales a nivel de ventana para evitar perder el click si te sales rápido del elemento
    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [dragging]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Estilos inyectados específicos para el marco con clip-path */}
      <style>{`
        .tollaro-frame {
            position: absolute; cursor: grab; border: 2px solid #3b82f6;
            background-color: rgba(59, 130, 246, 0.15); box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
            clip-path: polygon(0% 42%, 18% 42%, 18% 17%, 42% 17%, 42% 22.5%, 60% 22.5%, 60% 3%, 82% 3%, 82% 44%, 100% 44%, 100% 56%, 82% 56%, 82% 95%, 60% 95%, 60% 78%, 42% 78%, 42% 83%, 18% 83%, 18% 58%, 0% 58%);
            z-index: 30; width: 100%; height: 40%; left: 0; transform: translateY(-50%);
        }
        .tollaro-frame:active { cursor: grabbing; }
        .tollaro-frame::after {
            content: ""; position: absolute; top: 50%; left: 0; width: 100%; height: 2px;
            background-color: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.9); transform: translateY(-50%);
        }
        .tollaro-marker {
            position: absolute; width: clamp(18px, 4.5vw, 22px); height: clamp(18px, 4.5vw, 22px);
            background-color: rgba(34, 197, 94, 0.5); border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%; cursor: ns-resize; z-index: 40; box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); transition: background-color 0.2s;
        }
        .tollaro-marker:hover, .tollaro-marker:active { background-color: rgba(34, 197, 94, 0.8); }
        .tollaro-marker::after { content: ""; width: 4px; height: 4px; background: white; border-radius: 50%; opacity: 0.7; }
      `}</style>

      {/* Caja de Instrucciones */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 md:p-6 text-left shadow-sm">
        <h2 className="text-blue-900 font-bold text-xs uppercase tracking-wider mb-3 flex items-center">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          Instrucciones de uso Tollaro
        </h2>
        <ol className="space-y-2 text-slate-700 text-xs md:text-sm leading-relaxed">
          <li className="flex gap-2">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px]">
              1
            </span>
            <span>Realice la cefalometría para obtener los valores base.</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px]">
              2
            </span>
            <span>
              Desplace los <b>puntos verdes</b> transparentes sobre los números
              obtenidos.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px]">
              3
            </span>
            <span>
              Ajuste el <b>marco azul</b> hasta contener la mayor cantidad de
              puntos verdes.
            </span>
          </li>
        </ol>
      </div>

      {/* Lienzo y Herramienta (Mismo aspecto que tu HTML original) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="bg-slate-900 p-3 text-white flex justify-between items-center relative z-50">
          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400">
            Área de Análisis Tollaro
          </span>
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            <span className="text-[9px] text-slate-400 font-bold uppercase">
              Y:
            </span>
            <span className="text-sm md:text-lg font-mono font-bold text-blue-400">
              {Math.round(relFrameY * naturalHeight)} px
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-100 p-4 md:p-12 flex justify-center min-h-[50vh]">
          {/* El touch-none es crucial en móviles para evitar que la pantalla suba/baje al mover un punto */}
          <div
            ref={containerRef}
            className="relative inline-block w-full max-w-2xl select-none touch-none"
          >
            {!imgError ? (
              <img
                src={imageSrc}
                alt="Tabla Tollaro"
                className="w-full h-auto block border border-slate-200 shadow-sm"
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
              />
            ) : (
              <div className="w-full h-64 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
                <h3 className="text-lg font-bold text-slate-700 mb-2">
                  Imagen no disponible
                </h3>
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-2 rounded-lg font-semibold shadow-sm">
                  Subir Imagen Manualmente
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            )}

            {/* Overlays interactivos (Sólo se muestran si la imagen cargó) */}
            {!imgError && naturalHeight > 0 && (
              <>
                <div
                  className="tollaro-frame"
                  style={{ top: `${relFrameY * 100}%` }}
                  onMouseDown={() => setDragging("frame")}
                  onTouchStart={() => setDragging("frame")}
                />
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="tollaro-marker"
                    style={{
                      left: `${i * 20 + 10}%`,
                      top: `${relMarkersY[i] * 100}%`,
                    }}
                    onMouseDown={() => setDragging(`marker-${i}`)}
                    onTouchStart={() => setDragging(`marker-${i}`)}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OrtodonciaApp() {
  // --- ESTADOS INICIALES ---
  // Precargados con los datos exactos que enviaste para que coincida.

  // Dientes Maxilares (FDI: 16 al 26)
  const [maxilar, setMaxilar] = useState({
    16: 10,
    15: 7,
    14: 7,
    13: 8,
    12: 6,
    11: 8,
    21: 8,
    22: 6,
    23: 8,
    24: 7,
    25: 7,
    26: 10,
  });

  // Dientes Mandibulares (FDI: 46 al 36)
  const [mandibula, setMandibula] = useState({
    46: 10,
    45: 7,
    44: 7,
    43: 7,
    42: 6,
    41: 5,
    31: 5,
    32: 6,
    33: 7,
    34: 7,
    35: 7,
    36: 10,
  });

  // Estado para el cálculo VERT
  const [vertData, setVertData] = useState({
    edad: 9,
    ejeFacial: 82,
    profunFacial: 86,
    anguloPM: 35,
    altFacialInf: 57,
    arcoMandibular: 25,
  });

  const [activeTab, setActiveTab] = useState("bolton");

  // --- FUNCIONES DE CÁLCULO ---

  const analisisDentario = useMemo(() => {
    const valsMax = Object.values(maxilar)
      .map(Number)
      .map((n) => (isNaN(n) ? 0 : n));
    const valsMand = Object.values(mandibula)
      .map(Number)
      .map((n) => (isNaN(n) ? 0 : n));

    // Suma de los 12 dientes
    const sum12Max = valsMax.reduce((a, b) => a + b, 0); // Esperado: 92
    const sum12Mand = valsMand.reduce((a, b) => a + b, 0); // Esperado: 84

    // Suma de los 6 anteriores (canino a canino)
    // Maxilar: 13,12,11, 21,22,23 (Índices 3 al 8 en el array si vamos de 16 a 26)
    const sum6Max =
      maxilar[13] +
      maxilar[12] +
      maxilar[11] +
      maxilar[21] +
      maxilar[22] +
      maxilar[23]; // Esperado: 44
    const sum6Mand =
      mandibula[43] +
      mandibula[42] +
      mandibula[41] +
      mandibula[31] +
      mandibula[32] +
      mandibula[33]; // Esperado: 36

    // Cálculos Bolton
    const boltonAnterior = sum6Max > 0 ? (sum6Mand / sum6Max) * 100 : 0;
    const boltonTotal = sum12Max > 0 ? (sum12Mand / sum12Max) * 100 : 0;

    // Diagnósticos Bolton
    const difAnt = boltonAnterior - 77.2;
    const diagAnt =
      difAnt > 0 ? "Aumentado: Exceso inferior" : "Disminuido: Exceso superior";
    const difTot = boltonTotal - 91.2;
    const diagTot =
      difTot > 0 ? "Aumentado: Exceso inferior" : "Disminuido: Exceso superior";

    // Tanaka - Johnston (Suma de los 4 incisivos inferiores)
    const sii = mandibula[42] + mandibula[41] + mandibula[31] + mandibula[32]; // Esperado: 22
    const tanakaSup = sii / 2 + 11; // Esperado: 22
    const tanakaInf = sii / 2 + 10.5; // Esperado: 21.5

    return {
      sum12Max,
      sum12Mand,
      sum6Max,
      sum6Mand,
      boltonAnterior: boltonAnterior.toFixed(1),
      boltonTotal: boltonTotal.toFixed(1),
      diagAnt,
      diagTot,
      sii,
      tanakaSup,
      tanakaInf,
    };
  }, [maxilar, mandibula]);

  const analisisVert = useMemo(() => {
    // Restringir edad a 19 maximo, como en el excel original
    const edadCalculo = Math.min(Math.max(vertData.edad, 9), 19);
    const difEdad = edadCalculo - 9;

    // Normas a los 9 años y variación por año de Ricketts
    const normas = {
      ejeFacial: { base: 90, varAnual: 0, ds: 3, reverseSign: false },
      profunFacial: { base: 87, varAnual: 0.3333, ds: 3, reverseSign: false },
      anguloPM: { base: 26, varAnual: -0.3, ds: 4, reverseSign: true }, // Mayor angulo = más negativo
      altFacialInf: { base: 47, varAnual: 0, ds: 4, reverseSign: true }, // Mayor altura = más negativo
      arcoMandibular: { base: 26, varAnual: 0.5, ds: 4, reverseSign: false },
    };

    const variables = [
      "ejeFacial",
      "profunFacial",
      "anguloPM",
      "altFacialInf",
      "arcoMandibular",
    ];
    let vertSum = 0;
    const detalles = {};

    variables.forEach((v) => {
      const normaEdad = normas[v].base + difEdad * normas[v].varAnual;
      const valPcte = vertData[v];

      // Cálculo del desvío
      // Si reverseSign es true (ej. Angulo PM alto es Dolico/Negativo): (Norma - Pcte) / DS
      // Si reverseSign es false (ej. Eje Facial bajo es Dolico/Negativo): (Pcte - Norma) / DS
      let desvio = normas[v].reverseSign
        ? (normaEdad - valPcte) / normas[v].ds
        : (valPcte - normaEdad) / normas[v].ds;

      detalles[v] = {
        normaEdad: normaEdad,
        ds: normas[v].ds,
        valorSigno: desvio,
      };
      vertSum += desvio;
    });

    const vertTotal = (vertSum / 5).toFixed(2);

    // Determinación de Biotipo
    let biotipo = "";
    if (vertTotal >= 1) biotipo = "Braquifacial Severo";
    else if (vertTotal >= 0.5) biotipo = "Braquifacial";
    else if (vertTotal >= -0.5) biotipo = "Mesofacial";
    else if (vertTotal >= -1.5) biotipo = "Dolicofacial";
    else biotipo = "Dolicofacial Severo";

    return { difEdad, detalles, vertTotal, biotipo };
  }, [vertData]);

  const handleTeethChange = (arch, tooth, value) => {
    const val = value === "" ? "" : Number(value);
    if (arch === "max") setMaxilar((prev) => ({ ...prev, [tooth]: val }));
    else setMandibula((prev) => ({ ...prev, [tooth]: val }));
  };

  const handleVertChange = (field, value) => {
    setVertData((prev) => ({ ...prev, [field]: Number(value) }));
  };

  // Nombres de visualización para las variables Cefalométricas
  const vertLabels = {
    ejeFacial: "Eje Facial",
    profunFacial: "Profun. Facial",
    anguloPM: "Ángulo del PM",
    altFacialInf: "Alt. Facial Inf.",
    arcoMandibular: "Arco Mandibular",
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Análisis Ortodóncico
            </h1>
            <p className="text-indigo-200 mt-1">
              Bolton, Tanaka-Johnston y VERT Cefalométrico
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("bolton")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "bolton"
                  ? "bg-indigo-500 text-white"
                  : "bg-indigo-950/50 text-indigo-300 hover:bg-indigo-800"
              }`}
            >
              Modelos
            </button>
            <button
              onClick={() => setActiveTab("vert")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "vert"
                  ? "bg-indigo-500 text-white"
                  : "bg-indigo-950/50 text-indigo-300 hover:bg-indigo-800"
              }`}
            >
              VERT Ricketts
            </button>
            <button
              onClick={() => setActiveTab("tollaro")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "tollaro"
                  ? "bg-indigo-500 text-white"
                  : "bg-indigo-950/50 text-indigo-300 hover:bg-indigo-800"
              }`}
            >
              Tollaro
            </button>
          </div>
        </div>

        {/* PESTAÑA BOLTON Y TANAKA */}
        {activeTab === "bolton" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Izquierda: Inputs Odontometría */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-800">
                    Odontometría (mm)
                  </h2>
                  <p className="text-sm text-slate-500">
                    Mide cada diente e ingresa el ancho mesiodistal.
                  </p>
                </div>

                {/* Fila Maxilar */}
                <div className="mb-8 overflow-x-auto pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-indigo-900 bg-indigo-50 px-2 py-1 rounded">
                      Maxilar
                    </span>
                    <span className="text-sm text-slate-400">
                      Total: {analisisDentario.sum12Max}mm
                    </span>
                  </div>
                  <div className="flex justify-between gap-1 min-w-max">
                    {[16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26].map(
                      (tooth) => (
                        <div key={tooth} className="flex flex-col items-center">
                          <label className="text-xs text-slate-400 mb-1">
                            {tooth}
                          </label>
                          <input
                            type="number"
                            value={maxilar[tooth]}
                            onChange={(e) =>
                              handleTeethChange("max", tooth, e.target.value)
                            }
                            className={`w-12 h-12 text-center rounded border-2 font-semibold focus:border-indigo-500 focus:ring-0 transition-colors
                            ${
                              [13, 12, 11, 21, 22, 23].includes(tooth)
                                ? "bg-blue-50 border-blue-200 text-blue-900"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Fila Mandíbula */}
                <div className="overflow-x-auto pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-1 rounded">
                      Mandíbula
                    </span>
                    <span className="text-sm text-slate-400">
                      Total: {analisisDentario.sum12Mand}mm
                    </span>
                  </div>
                  <div className="flex justify-between gap-1 min-w-max">
                    {[46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36].map(
                      (tooth) => (
                        <div key={tooth} className="flex flex-col items-center">
                          <input
                            type="number"
                            value={mandibula[tooth]}
                            onChange={(e) =>
                              handleTeethChange("mand", tooth, e.target.value)
                            }
                            className={`w-12 h-12 text-center rounded border-2 font-semibold focus:border-indigo-500 focus:ring-0 transition-colors
                            ${
                              [43, 42, 41, 31, 32, 33].includes(tooth)
                                ? "bg-blue-50 border-blue-200 text-blue-900"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          />
                          <label className="text-xs text-slate-400 mt-1">
                            {tooth}
                          </label>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Derecha: Resultados Bolton y Tanaka */}
            <div className="lg:col-span-4 space-y-6">
              {/* Resultado Bolton */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-indigo-500">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
                  Análisis de Bolton
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-medium text-slate-500">
                        Bolton Anterior (6 a 6)
                      </p>
                      <p className="text-2xl font-black text-indigo-600">
                        {analisisDentario.boltonAnterior}%
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Norma: 77.2% | Sumas: M={analisisDentario.sum6Max} m=
                      {analisisDentario.sum6Mand}
                    </p>
                    <div
                      className={`mt-2 p-2 rounded text-sm font-medium ${
                        analisisDentario.boltonAnterior > 77.2
                          ? "bg-rose-50 text-rose-700"
                          : "bg-sky-50 text-sky-700"
                      }`}
                    >
                      {analisisDentario.diagAnt}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-medium text-slate-500">
                        Bolton Total (12 a 12)
                      </p>
                      <p className="text-2xl font-black text-indigo-600">
                        {analisisDentario.boltonTotal}%
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Norma: 91.2% | Sumas: M={analisisDentario.sum12Max} m=
                      {analisisDentario.sum12Mand}
                    </p>
                    <div
                      className={`mt-2 p-2 rounded text-sm font-medium ${
                        analisisDentario.boltonTotal > 91.2
                          ? "bg-rose-50 text-rose-700"
                          : "bg-sky-50 text-sky-700"
                      }`}
                    >
                      {analisisDentario.diagTot}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resultado Tanaka */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-emerald-500">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
                  Tanaka-Johnston
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span className="text-sm font-medium text-slate-600">
                      SII (4 incisivos inf.)
                    </span>
                    <span className="font-bold text-slate-800">
                      {analisisDentario.sii} mm
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      Espacio Nec. Superior (1 cuadrante)
                    </span>
                    <span className="font-bold text-emerald-600">
                      {analisisDentario.tanakaSup} mm
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      Espacio Nec. Inferior (1 cuadrante)
                    </span>
                    <span className="font-bold text-emerald-600">
                      {analisisDentario.tanakaInf} mm
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA VERT */}
        {activeTab === "vert" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Izquierda: Inputs VERT */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                Medidas Cefalométricas
              </h2>

              <div className="space-y-4">
                <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <label className="block text-sm font-semibold text-orange-900 mb-1">
                    Edad del Paciente
                  </label>
                  <input
                    type="number"
                    value={vertData.edad}
                    onChange={(e) => handleVertChange("edad", e.target.value)}
                    className="w-full p-2 rounded border border-orange-200 focus:ring-orange-500"
                    max="19"
                  />
                  <p className="text-xs text-orange-700 mt-1">
                    Máximo 19 años. Diff a 9 años = {analisisVert.difEdad}
                  </p>
                </div>

                {Object.keys(vertLabels).map((key) => (
                  <div
                    key={key}
                    className="flex justify-between items-center gap-4"
                  >
                    <label className="text-sm font-medium text-slate-600">
                      {vertLabels[key]}
                    </label>
                    <input
                      type="number"
                      value={vertData[key]}
                      onChange={(e) => handleVertChange(key, e.target.value)}
                      className="w-24 p-2 rounded border border-slate-300 text-center font-bold text-slate-800"
                      step="0.1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Derecha: Resultados VERT */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Diagnostico Biotipo */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <p className="text-slate-500 font-medium mb-2">
                  Índice VERT (Ricketts)
                </p>
                <h1
                  className={`text-6xl font-black tracking-tighter mb-4 ${
                    analisisVert.vertTotal > 0
                      ? "text-sky-600"
                      : "text-rose-600"
                  }`}
                >
                  {analisisVert.vertTotal}
                </h1>
                <div className="inline-block bg-slate-900 text-white px-6 py-2 rounded-full font-bold text-lg">
                  {analisisVert.biotipo}
                </div>
              </div>

              {/* Tabla de cálculos */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Factor</th>
                        <th className="px-4 py-3">Norma (9a)</th>
                        <th className="px-4 py-3">D.S.</th>
                        <th className="px-4 py-3">Norma Ajustada</th>
                        <th className="px-4 py-3">Valor Paciente</th>
                        <th className="px-4 py-3">Desvío (Signo)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {Object.keys(vertLabels).map((v) => {
                        const d = analisisVert.detalles[v];
                        // Rescatar las normas base y DS usadas en el cálculo
                        const baseNorms = {
                          ejeFacial: { base: 90, ds: 3 },
                          profunFacial: { base: 87, ds: 3 },
                          anguloPM: { base: 26, ds: 4 },
                          altFacialInf: { base: 47, ds: 4 },
                          arcoMandibular: { base: 26, ds: 4 },
                        };

                        return (
                          <tr key={v} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {vertLabels[v]}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {baseNorms[v].base}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {baseNorms[v].ds}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {d.normaEdad.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 font-bold text-indigo-600">
                              {vertData[v]}
                            </td>
                            <td
                              className={`px-4 py-3 font-bold ${
                                d.valorSigno < 0
                                  ? "text-rose-500"
                                  : "text-sky-500"
                              }`}
                            >
                              {d.valorSigno > 0 ? "+" : ""}
                              {d.valorSigno.toFixed(2)}
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
        {activeTab === "tollaro" && <TollaroAnalysis />}
      </div>
    </div>
  );
}
