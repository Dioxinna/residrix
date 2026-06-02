---
name: Residrix
description: Sistema visual glass + profundidad sobre aurora violeta, base light con dark mode, para panel de administradores de fincas y app de vecinos.
colors:
  brand: "#7c3aed"
  brand-soft: "#6d28d9"
  violet: "#a855f7"
  cyan: "#06b6d4"
  ink: "#15151c"
  ink-soft: "#4b4b57"
  ink-faint: "#8a8a99"
  base: "#eceeff"
  base-2: "#f6f7fe"
  surface: "#ffffff"
  canvas: "#e9ebfb"
typography:
  display:
    fontFamily: "Space Grotesk, Inter, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Space Grotesk, Inter, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  badge: "6px"
  input: "8px"
  nav: "12px"
  glass: "20px"
  glass-lg: "28px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  input:
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "10px 12px"
  badge:
    rounded: "{rounded.badge}"
    padding: "2px 8px"
  nav-link-active:
    textColor: "{colors.ink}"
    rounded: "{rounded.nav}"
    padding: "8px 12px"
---

# Design System: Residrix

## 1. Overview

**Creative North Star: "Cristal sobre Violeta"**

Superficies de cristal esmerilado flotando sobre una niebla viva de violeta y cian. La base es light: una aurora animada (blobs violeta/cian difuminados a 80px) se mueve lentamente bajo un grano sutil al 3%, y encima de ella se posan paneles glass translúcidos con bordes claros y profundidad real. El material es lo primero que se siente; la luz lo atraviesa. Existe un modo oscuro espejo (`.dark`) donde el mismo sistema se invierte: cristal tenue sobre un casi-negro y aurora más saturada.

El sistema sirve a dos audiencias con una misma identidad. En el panel web del administrador la densidad sube (tablas, listas, formularios) pero el glass nunca compite con la tarea: organiza jerarquía, no decora. En la app móvil del vecino la misma estética se simplifica. El acento violeta (`#7c3aed`) marca acción, selección y estado de marca; jamás se reparte como relleno.

Esto rechaza explícitamente cuatro cosas: el SaaS genérico "AI slop" 2026 (fondo cream/beige, eyebrows mayúsculas en cada sección, grids de cards idénticas, plantilla hero-metric); el software de gestión anticuado (tablas grises densas, estética business legacy); la banca/fintech institucional (navy + dorado frío sin personalidad); y la consumer app juguetona (exceso de color, cartoon, gamificación). El carácter vive en el material glass, la tipografía y el acento violeta, no en adornos.

**Key Characteristics:**
- Cristal esmerilado (`backdrop-filter: blur`) con bordes claros visibles, no glass plano y decorativo.
- Profundidad tangible: sombras tintadas de violeta, `glow-brand` reservado a acciones e hover.
- Aurora violeta/cian animada como fondo único, detrás de todo, con grano sutil.
- Base light por defecto + modo oscuro espejo vía `next-themes` (`.dark`).
- Acento violeta como única voz de acción/estado; nunca decoración.
- Nítido y con cuerpo: cada componente se siente material, no plano.

## 2. Colors

Paleta de un acento violeta saturado con un secundario cian frío, sobre neutros casi-blancos tintados de azul-violeta y tinta negra cálida; todo lo demás es transparencia.

### Primary
- **Violeta Marca** (`#7c3aed`, dark `#8b5cf6`): el único color de acción. Botones primarios, icono de navegación activo, foco/selección, estado de marca. Sobre él el texto siempre va en blanco (`#ffffff`).
- **Violeta Profundo** (`#6d28d9`, dark `#c4b5fd`): inicio del degradado `text-gradient` y variantes hover del acento. En dark se aclara para legibilidad de texto.
- **Violeta Luz** (`#a855f7`): cierre del degradado de marca y color del foco de inputs (`ring-violet-500`). Mismo valor en light y dark.

### Secondary
- **Cian** (`#06b6d4`, dark `#22d3ee`): tercer blob de la aurora y acento frío puntual. Equilibra el violeta; nunca se usa para acción.

### Neutral
- **Tinta** (`#15151c`, dark `#f5f5f7`): texto principal. Cumple ≥4.5:1 sobre superficies glass y base.
- **Tinta Suave** (`#4b4b57`, dark `#a1a1aa`): texto secundario, labels de navegación en reposo.
- **Tinta Tenue** (`#8a8a99`, dark `#71717a`): texto deshabilitado, items de navegación bloqueados, metadatos. NO usar para texto de cuerpo: no alcanza 4.5:1.
- **Base** (`#eceeff` al 90%, dark `#07070b`): lienzo de contenido tras el glass.
- **Base 2** (`#f6f7fe`, dark `#0b0b12`): segunda capa neutra para zonas de formulario y paneles.
- **Superficie** (`#ffffff`, dark `#101019`): superficie sólida bajo el glass cuando hace falta opacidad total.
- **Canvas** (`#e9ebfb`, dark `#07070b`): color de `html`/`body` bajo la aurora.

### Named Rules
**La Regla de Una Sola Voz.** El violeta marca es acción, selección y estado de marca; nunca decoración. Si aparece en una superficie que no se puede pulsar ni indica estado, está mal.

**La Regla del Cristal Translúcido.** Las superficies glass usan vars de transparencia (`--glass-bg`, `--glass-border`), no colores sólidos opacos. El color sólido (`surface`) solo entra cuando la opacidad total es necesaria (ver Regla Anti-barro en Elevation).

## 3. Typography

**Display Font:** Space Grotesk (con Inter, sans-serif como fallback)
**Body Font:** Inter (con `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)

**Character:** Pareja en eje de contraste geométrico vs. neogrotesco humanista. Space Grotesk aporta carácter técnico-contemporáneo a los titulares grandes (landing, héroes); Inter desaparece en la tarea como tipo de producto: carga botones, labels, datos y cuerpo sin protagonismo. Dos familias, no tres.

### Hierarchy
- **Display** (Space Grotesk 600, `clamp(2.5rem, 6vw, 5rem)`, lh 1.05, `-0.03em`): titulares de héroe en landing y splashes de onboarding. Solo superficies de marca; nunca en labels o datos del panel.
- **Headline** (Space Grotesk 600, ~1.5rem, lh 1.2): títulos de sección y cabeceras de página del panel.
- **Title** (Inter 600, 1rem, lh 1.4): títulos de card, cabeceras de fila, nombres en listas.
- **Body** (Inter 400, 0.875rem, lh 1.6): texto general y prosa. Limitar prosa a 65–75ch; datos densos y tablas pueden correr más anchos.
- **Label** (Inter 500, 0.75rem, lh 1.4): labels de formulario, texto de badge, ayudas. Uppercase solo en micro-labels ≤4 palabras (p.ej. el tag de plan en navegación bloqueada).

### Named Rules
**La Regla Inter-en-la-Tarea.** Dentro del panel y la app, Space Grotesk no toca labels, botones ni datos. El display es para superficies de marca; la herramienta es 100% Inter.

**La Regla de Escala Fija en Producto.** Los titulares fluidos `clamp()` son para landing/marca. En el panel, escala en `rem` fijos: un h1 que encoge dentro de un sidebar se ve peor, no mejor.

## 4. Elevation

Sistema híbrido: capas tonales de cristal translúcido + sombras tintadas de violeta. La profundidad no se transmite con gris oscuro sino con sombras de tinte violeta (`rgba(80, 70, 160, 0.18)` en light) más un highlight interior claro que simula el borde superior iluminado del cristal. El `depth` añade una sombra violeta saturada para elementos que deben sentirse físicamente levantados (mockups de héroe, acciones primarias).

### Shadow Vocabulary
- **glass** (`inset 0 1px 0 0 var(--glass-highlight)`, `0 12px 40px -12px var(--glass-shadow)`): superficie frosted estándar (cards, inputs, nav activo).
- **glass-strong** (blur 32px + `0 20px 60px -16px var(--glass-shadow)`): paneles más opacos, inputs, contenedores que necesitan más frost.
- **depth** (`0 14px 30px -10px rgba(124,58,237,0.5)`, `0 30px 60px -24px var(--glass-shadow)`): elevación física fuerte. Mockups, botón primario en reposo.
- **glow-brand** (`0 0 0 1px rgba(124,58,237,0.35)`, `0 10px 45px -6px rgba(124,58,237,0.55)`): halo de marca en hover de acciones primarias y cards con `lift`.
- **glow-soft** (`0 10px 55px -10px rgba(124,58,237,0.4)`): halo de marca difuso y discreto en reposo.

### Named Rules
**La Regla Anti-barro (glass sobre glass = gris).** Prohibido anidar glass sobre glass: el blur acumulado produce un barro gris. Las cards dentro de un panel glass usan superficie sólida (`surface`) o tints, nunca más glass.

**La Regla del Highlight Interior.** Todo cristal lleva un `inset 0 1px 0` claro como borde superior iluminado. Sin él el glass parece una caja translúcida muerta, no un material.

## 5. Components

Carácter general: **nítido y con cuerpo.** Frosted con bordes visibles y profundidad real; tangible, nunca plano. Cada componente interactivo define default, hover, focus, disabled.

### Buttons
- **Shape:** píldora completa (`rounded-full`, 9999px). Padding `12px 24px` (`px-6 py-3`), texto `0.875rem` peso 500, `gap` de 8px para icono + label.
- **Primary:** fondo violeta marca (`#7c3aed`) sólido, texto blanco, sombra `depth` en reposo. Hover: `glow-brand` + `translateY(-2px)`.
- **Ghost:** superficie `glass`, texto tinta. Hover: pasa a `glass-strong` + `translateY(-2px)`.
- **Transición:** `lift` (`transform 0.3s cubic-bezier(0.22,1,0.36,1)`, `box-shadow 0.3s`).

### Badges
- **Style:** `px-2 py-0.5`, `rounded-md` (6px), `0.75rem` peso 500, con borde. Patrón semántico: fondo color al 20% (`bg-<color>-500/20`) + texto del color + borde al 30%.
- **State:** urgencia (crítica/alta/media/baja → rojo/naranja/amarillo/verde) y estado de incidencia (abierta/en progreso/pdte/resuelta/cerrada → azul/morado/amarillo/verde/zinc).
- **Aviso a11y:** en base light, el texto `-400` sobre fondo `/20` puede no alcanzar 4.5:1. Verificar contraste o bajar el texto a `-700` en light (footgun conocido del proyecto).

### Cards / Containers
- **Corner Style:** `rounded-[var(--radius-glass)]` (20px); contenedores grandes 28px.
- **Background:** superficie `glass` (o `glass-strong` para más frost). Cards anidadas: sólido, nunca glass (Regla Anti-barro).
- **Shadow Strategy:** `glass` por defecto; `glow-soft` opcional en reposo; `lift` + `hover:-translate-y-1 hover:glow-brand` para cards accionables.
- **Border:** `1px solid var(--glass-border)` (blanco al 85% en light, al 12% en dark).
- **Internal Padding:** 24px (`p-6`) típico.

### Inputs / Fields
- **Style:** `glass-strong` con `border var(--glass-border)`, `rounded-lg` (8px), `px-3 py-2.5`, texto tinta, placeholder que debe cumplir 4.5:1 (no `placeholder-zinc-500` claro).
- **Focus:** `outline-none` + `ring-2 ring-violet-500`. El anillo violeta es la señal de foco en todo el sistema.
- **Disabled / Error:** definir explícitamente (estado de error pendiente de estandarizar en algunos formularios).

### Navigation (Sidebar)
- **Style:** items `rounded-xl` (12px), `px-3 py-2`, `0.875rem`, icono lucide 16px `strokeWidth 1.75`.
- **Active:** superficie `glass`, texto tinta peso 500, icono en violeta marca.
- **Idle:** texto tinta-suave, hover → tinta + `glass`.
- **Locked (feature gating):** texto tinta-tenue + tag de plan en micro-uppercase con icono `Lock`; visible pero atenuado, no oculto.

### Signature: Aurora background
Fondo fijo único (`.aurora`) detrás de todo el contenido (`z-index: -2`): dos blobs radiales violeta animados en deriva lenta (22s / 26s `ease-in-out alternate`) + un tercer blob cian, todos `blur(80–90px)`, más una capa de grano (`.noise`) al 3%. Es el lienzo de marca; las superficies glass se posan encima.

## 6. Do's and Don'ts

### Do:
- **Do** usar el violeta marca (`#7c3aed`) solo para acción, selección y estado (Regla de Una Sola Voz).
- **Do** mantener texto de cuerpo en tinta (`#15151c` light / `#f5f5f7` dark) a ≥4.5:1, incluido sobre superficies glass tintadas (el riesgo principal con base light).
- **Do** dar a cada cristal su highlight interior (`inset 0 1px 0` claro) para que se lea como material.
- **Do** usar Inter para todo label, botón, dato y cuerpo dentro del panel y la app; reservar Space Grotesk para titulares de marca.
- **Do** respetar `prefers-reduced-motion`: aurora, `float` y `rise` se desactivan (ya implementado en `globals.css`).
- **Do** verificar el contraste de los badges semánticos en light; bajar el texto a `-700` si el `-400` sobre `/20` no llega a 4.5:1.

### Don't:
- **Don't** anidar glass sobre glass: produce barro gris. Usar superficie sólida o tints dentro de un panel glass (Regla Anti-barro).
- **Don't** parecerse al SaaS genérico "AI slop" 2026: nada de fondo cream/beige, eyebrows mayúsculas con tracking sobre cada sección, grids de cards idénticas, ni plantilla hero-metric.
- **Don't** caer en software de gestión anticuado: nada de tablas grises densas sin jerarquía ni estética business legacy.
- **Don't** caer en banca/fintech institucional: nada de navy + dorado frío sin personalidad.
- **Don't** caer en consumer app juguetona: nada de exceso de color, ilustraciones cartoon ni gamificación que reste credibilidad B2B.
- **Don't** usar tinta-tenue (`#8a8a99`) para texto de cuerpo: no alcanza 4.5:1; es solo para deshabilitado/metadatos.
- **Don't** meter Space Grotesk ni titulares fluidos `clamp()` en labels, botones o datos del panel.
- **Don't** repartir el violeta como relleno decorativo en superficies no accionables.
- **Don't** usar `text-gradient` (degradado sobre texto) fuera del logo/título de marca; nunca como énfasis decorativo recurrente.
