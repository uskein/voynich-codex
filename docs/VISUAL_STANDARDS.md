# Estándares Visuales — Voynich Codex

Guía para implementar mejoras visuales (animaciones, simuladores y visualizadores) de forma consistente en el frontend. Léelo antes de tocar UI.

---

## 1. Stack y decisiones de diseño

| Área | Elección |
|---|---|
| UI | React 19 + TypeScript + Vite 8 |
| Estilos | Tailwind CSS v4 (tokens vía `@theme` en `src/index.css`) |
| Animación | `framer-motion` (entradas, micro-interacciones, `AnimatePresence`) |
| Grafos/diagramas | `reactflow` v11 (visualizadores de relaciones, cronologías, magia) |
| Drag & drop | `@dnd-kit` (kanban) |
| Iconos | `lucide-react` |
| i18n | Hook `useI18n` + `src/i18n/es.json` y `en.json` |
| Lint | `oxlint` (`npm run lint`) |

Regla de oro: **no añadir dependencias nuevas** si `framer-motion` o `reactflow` pueden resolverlo. Antes de añadir una librería, justificarlo en el PR.

---

## 2. Design tokens

### Paletas (definidas en `@theme` de `index.css`)

- **midnight-50..900** — neutros oscuros para fondos, superficies y bordes (base del tema dark).
- **parchment-50..900** — tonos pergamino para texto sobre oscuro y tema sepia.
- **burnt-500/600** — acento primario (botones, enlaces activos, progreso).
- **ink-50..900** — neutros del tema light.
- **gold-400/500/600** — acentos "raro"/tesoro (usar con moderación, ej. eras épicas).

### Variables de tema (cambian por `[data-theme]`)

Siempre que una superficie deba adaptarse a los 3 temas (dark/light/sepia) usa las variables:

- `var(--bg-primary)` — fondo de página
- `var(--bg-secondary)` — sidebar, header, tarjetas
- `var(--bg-tertiary)` — inputs, avatares, barras de fondo
- `var(--text-primary)` — texto principal
- `var(--text-secondary)` — texto secundario/labels
- `var(--border-color)` — bordes

Ejemplo correcto en un visualizador:

```tsx
<div style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
```

Las clases fijas como `bg-midnight-800` están **bien** para componentes del tema oscuro base, pero no en superficies que deben verse bien en los 3 temas.

### Tipografía

- Títulos/serif: `font-serif` (Noto Serif / Georgia) — usar en encabezados de página y títulos de entidades.
- Cuerpo: `font-sans` (Inter).
- No cambiar fuentes por componente.

### Formas y espaciado

- Radios: `rounded-lg` (inputs, nodos), `rounded-xl` (tarjetas, modales), `rounded-full` (badges, medidores).
- Padding base de tarjetas: `p-4`.
- Grillas de tarjetas: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.

---

## 3. Motion system

### Variantes compartidas (`src/lib/motion.ts`)

Usa SIEMPRE las variantes de `src/lib/motion.ts` en vez de inventar `initial/animate` por componente:

- `fadeUp` — entrada estándar (opacity 0 → 1, y 20 → 0). Duración 0.4s, easing `easeOut`.
- `scaleIn` — para modales/paneles (opacity + scale 0.95).
- `staggerContainer` + `staggerItem` — para grillas/listas con retardo escalonado.
- `springs` — configuraciones de `spring` (contadores, orbitas).

### Reglas de duración y easing

| Uso | Duración | Easing |
|---|---|---|
| Entrada de página/sección | 300–500ms | `easeOut` |
| Modales (`AnimatePresence`) | 200–300ms | `easeOut` / `easeInOut` |
| Micro-interacción (hover/active) | 150–200ms | `easeOut` |
| Animación de simulación (órbitas, partículas) | 600–1500ms | `linear` o `easeInOut` |
| Contadores numéricos | 600–1000ms | `spring` (`stiffness: 80, damping: 20`) |

### Stagger (grillas)

Retardo por ítem: `0.05s` para grillas densas, `0.1s` para tarjetas grandes. Nunca superar 12 ítems antes de que todo haya entrado.

### `prefers-reduced-motion`

Todo componente con animación continua (órbitas, partículas, auras pulsantes, autoplay) debe respetar:

```tsx
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

Si `reduceMotion` es `true`: congelar auras/órbitas/partículas, y saltar las entradas con desplazamiento (solo fade).

### `AnimatePresence`

Para montar/desmontar modales, paneles y transiciones de página usa `AnimatePresence` + `exit`. Nunca animar solo la entrada si va a desaparecer de golpe.

---

## 4. Convenciones de componentes

### ui/ (Card, Button, Input)

- Reutilizar `Card`, `CardHeader`, `CardContent`, `CardFooter` de `src/components/ui/Card.tsx`.
- Variants de `Card`: `default`, `hover` (para tarjetas clickeables), `bordered`.
- `Button` variants: `primary`, `secondary`, `ghost`, `danger`; sizes `sm/md/lg`. Usar `isLoading` en submits.

### Estados

- **Loading**: spinners `animate-spin` centrados, o skeletons `animate-pulse` (grillas). Nunca layouts vacíos parpadeando.
- **Vacío**: icono grande + título + descripción + CTA primario (patrón existente en `BestiaryPage`).
- **Error**: banner `bg-red-500/10 border border-red-500/30 text-red-400`.

### Modales

Patrón estándar (ver `BestiaryPage`): overlay `bg-black/60 backdrop-blur-sm` con `motion` `fadeUp`/`scaleIn` + `exit`, `stopPropagation` en el contenido, ancho `max-w-2xl`. Altura máxima `max-h-[70vh] overflow-y-auto`.

---

## 5. Convenciones de visualizadores / simuladores

Un "simulador" convierte datos de entrada en una vista viva e interactiva. Requisitos:

### Estructura

1. **Componente en `src/components/visualizers/`** — lógica de visualización pura (recibe `data` por props).
2. **Toolbar de controles** (`VisualizerToolbar.tsx`): play/pausa, switcher de era/período, zoom, leyenda. Reutilizarla.
3. **Estado de simulación** en el componente: `isPlaying`, `currentEra`, `speed`. No meter lógica de datos en el visualizador.
4. **Leyenda** (`Legend.tsx`) para explicar colores/tamaños (ej. tamaño = importancia).

### reactflow

- Importar estilo base una vez: `import 'reactflow/dist/style.css'` en la página que lo use.
- `ReactFlow` con `fitView`, `minZoom={0.4}`, `maxZoom={2}`, `proOptions={{ hideAttribution: true }}`.
- Nodos: usar `NodeCard` (wrapper tematizado) — contenedor con `bg-midnight-800`, borde `border-midnight-600`, radio `rounded-xl`, padding pequeño.
- Edges: color `#8d97ab` (midnight-300) por defecto; colorear por relación si aporta significado. `animated` solo si representa movimiento real.
- Límite de nodos: si una lista supera ~80 nodos, agregar filtros o agrupar antes de dibujar (perf).
- Lazy-load del visualizador: `React.lazy(() => import('...'))` + `<Suspense fallback={<spinner/>}>` para no engordar el bundle inicial.

### Mapeo de datos → visual

| Dato | Visual sugerido |
|---|---|
| `dangerLevel` (bestiary) | Aura/glow + medidor: verde → amarillo → naranja → rojo, pulsante según severidad |
| `importance` (timeline) | Tamaño del nodo (escala 1–10) |
| `era` | Bandas de color / ejes con etiqueta de era |
| `school` (magia) | Color del cluster/hijos |
| `completionPct` | Anillo de progreso (`AnimatedNumber` + SVG circle) |
| Conteos | `AnimatedNumber` (count-up con spring) |

### Colores semánticos (consistencia)

- Peligro: `green-500` (INOFENSIVA/BAJA) → `yellow-500` (MEDIA) → `orange-500` (ALTA) → `red-500` (MORTAL).
- Eras / períodos: usar bandas con `burnt`/`gold`/`midnight` y variantes.
- Módulos del mundo: Bestiary=rojo, Characters=azul, Timeline=amarillo, Nations=púrpura, Magic=rosa, Geography=verde (ya establecido en `WorldDetailPage`).

---

## 6. i18n

- Todo texto visible del usuario debe estar en `es.json` y `en.json`, accesible vía `t('clave')` del hook `useI18n`.
- Clave por módulo: `simulators.timeline.play`, `simulators.bestiary.encounter`, etc.
- No hardcodear strings en español/inglés dentro de componentes.

---

## 7. Verificaciones obligatorias antes de dar por terminada una tarea visual

1. `npm run lint` (oxlint) sin errores nuevos.
2. `tsc -b` (typecheck) sin errores.
3. `npm run build` (vite) correcto.
4. Prueba visual en navegador: los 3 temas (dark/light/sepia) al menos para las superficies nuevas.
5. Con `prefers-reduced-motion: reduce` activado, no hay animación continua desagradable.
6. Responsive: `md` y `lg` (y `sm` si el componente tiene grillas/toolbars).

---

## 8. Checklist: cómo añadir un visualizador nuevo

- [ ] Defino qué datos consume (endpoint ya existente; si falta wrapper, lo agrego en `services/api.ts`).
- [ ] Creo el componente en `components/visualizers/` (lógica pura, props de datos).
- [ ] Uso `VisualizerToolbar` + `Legend` + `NodeCard` + variantes de `lib/motion.ts`.
- [ ] Añado toggle "vista" si convive con una lista (patrón Lista | Simulador).
- [ ] Respeto `prefers-reduced-motion` para animaciones continuas.
- [ ] Strings i18n en `es.json` + `en.json`.
- [ ] Lazy-load si el bundle crece.
- [ ] Corro lint + tsc + build y pruebo en navegador (3 temas + reduced-motion).
