# 🎨 Plan de Rediseño UI — ElectroControl (Electrónica Pimentel)

App: Expo / React Native, expo-router, StyleSheet nativo, `@expo/vector-icons`. Sin librerías de UI externas. El rediseño solo toca presentación: ninguna llamada a `api.ts` ni tipos del dominio cambian.

---

## Diagnóstico actual

1. **Sin sistema de diseño**: cada pantalla inventa sus propios grises (`#F3F4F6`, `#F9FAFB`), azules (`#3B82F6`, `#2563eb`, `#1E40AF`), radios y sombras.
2. **Badges de estado sólidos** con texto blanco en 9–10pt — ilegibles, el color pierde significado.
3. **Semántica contradictoria**: "En Progreso" es azul en Dashboard pero ámbar en Órdenes.
4. **Cards sin jerarquía**: ID, cliente, fecha y total con el mismo peso; el monto no destaca.
5. **UUIDs truncados** (`#2e6e27a1`) como título de las cards.
6. **Grid de acciones rápidas desalineado** (`width: '30%'`) con círculos pastel multicolor.
7. **Métricas de ventas planas**: 3 cards grises idénticas en scroll horizontal.
8. **Formulario de presupuestos denso**: inputs sin etiqueta, total enterrado al fondo del scroll.
9. **Vencimiento de presupuestos invisible** en la lista.
10. **Tab bar sin estado activo claro**.
11. **Estados vacíos sin acción** ("No hay ventas" y nada más).

---

## 1. Fundamento: Design Tokens + componentes base (Fase 1)

### 1.1 Nuevo `app/theme.ts` — única fuente de verdad

**Paleta "Taller Eléctrico Premium"** (neutros cálidos + azul eléctrico profundo + semánticos):

- Superficies: `surface #FFFFFF` · `surfaceMuted #F6F7F9` · `canvas #F2F4F7`
- Bordes: `border #E4E7EC` · `borderStrong #D0D5DD`
- Texto: `textPrimary #101828` · `textSecondary #475467` · `textMuted #98A2B3`
- Primario: `primary #1D4ED8` (reemplaza todo `#3B82F6`/`#2563eb`, contraste AA) · `primarySoft #EFF4FF`
- Semánticos (pareja color + soft): `success #067647/#ECFDF3` · `warning #B54708/#FFFAEB` · `danger #B42318/#FEF3F2` · `violet #5925DC/#F4F3FF`

**Tipografía**: `display` 28/bold (montos héroe, saludo) · `title` 18/700 · `bodyStrong` 15/600 · `body` 14/400 · `caption` 12/500 · `micro` 11/600 uppercase + tracking (solo labels de sección y estados).

**Espaciado**: 4/8/12/16/20/24. **Radios**: card 16 · botón/input 12 · pill 999 · sheet 20. **Sombra única**: `#101828` op 0.06, radius 3, offset {0,1}, elevation 1.

### 1.2 Componentes nuevos en `app/components/ui/`

- **`Card`** — surface + radio 16 + borde 1px + sombra única; con `onPress` se vuelve TouchableOpacity (`activeOpacity 0.85`)
- **`StatusBadge`** — pill fondo soft + texto del color + dot 6px. Nunca sólido con texto blanco
- **`SectionHeader`** — título + slot de acción ("Ver todas")
- **`MetricCard`** — variantes `hero` (fondo primary, texto blanco) y `default`
- **`EmptyState`** — ícono outline + título + descripción + CTA opcional
- **`SegmentedControl`** — pista `surfaceMuted` radio 999, opción activa blanca con sombra (iOS)
- **`StatusPillBar`** — barra de color 4px al borde izquierdo de la card

### 1.3 Mapa semántico único de estados (en `theme.ts`)

| Estado | Color |
|---|---|
| RECEIVED | gris |
| DIAGNOSED | violeta |
| IN_PROGRESS | azul primario |
| WAITING_FOR_PARTS | ámbar |
| COMPLETED | verde |
| DELIVERED | verde profundo |
| CANCELLED | rojo |

Lo consumen dashboard, lista de órdenes y detalle — fin de las contradicciones.

---

## 2. Dashboard / Home (Fase 2)

**Header hero** — bloque sobre `canvas`, sin barra blanca: micro-label "ELECTRÓNICA PIMENTEL" en `primary`, saludo "¡Hola, {nombre} 👋" en display, fecha en caption. Avatar circular (iniciales sobre `primarySoft`) a la derecha → perfil.

**Fila de KPIs (nueva)** — 3 mini-cards con `flex:1`:
- *Órdenes activas* (RECEIVED + DIAGNOSED + IN_PROGRESS + WAITING_FOR_PARTS)
- *Por cobrar* (COMPLETED sin entregar)
- *Ventas hoy* (suma de `getSales` del día)

Cargan en paralelo con `Promise.all`; si fallan muestran `—` sin bloquear la pantalla.

**Acciones rápidas** — fila horizontal de pills de 88px con gap 12: ícono en **cuadrado redondeado 44px radio 12 sobre `primarySoft`**. Primer slot "Nueva Orden" con fondo `primary` e ícono blanco. Máx. 4 visibles; "Usuarios" (ADMIN) entra por scroll.

**Card de orden rediseñada** (el cambio más visible):

```
┃ ● En Progreso                     S/ 450.00 ┃  ← barra 4px del color del estado
┃ Sonny Pimentel                            ▸ ┃  ← cliente bodyStrong, chevron
┃ Sony TV LED · Control            Hoy 12:40  ┃  ← equipo secondary + fecha relativa
```

- **Barra de estado 4px** a la izquierda → scannability instantánea
- **Monto como héroe** arriba-derecha (hoy ni se muestra en el dashboard)
- Estado como `StatusBadge`; ID corto `#A1B2` degrada a micro junto a la fecha
- Navegación corregida: push directo a `/orders/{id}` (hoy usa el hack `?openOrderId=`)

**Empty state** — "Aún no hay órdenes" + CTA "Crear primera orden".

---

## 3. Ventas (Fase 3)

**Header** — botón "Nueva Venta" pasa a botón **primario** (el verde queda reservado para montos).

**KPIs jerarquizados** — grilla en vez de scroll horizontal:
- *Total Ventas*: `MetricCard hero` (fondo primary, texto blanco, monto display)
- *Transacciones* y *Ticket Promedio*: dos cards blancas secundarias
- Íconos bajan a micro-etiquetas; el número es el protagonista

**Filtros de fecha** — `SegmentedControl` Hoy / Semana / Mes / Todas (lógica `dateFilter` intacta).

**Card de venta rediseñada:**

```
┃ Efectivo ●                      S/ 1,250.00 ┃  ← método con dot de color, monto display success
┃ Cliente General · 3 productos               ┃
┃ #AB12CD34 · Hoy 14:22          [📄]  [🖨]   ┃  ← acciones de contorno
```

- Monto primero y a la derecha en `display` `success #067647` (hoy enterrado en el footer)
- Método de pago con dot por método: Efectivo=verde, Tarjetas=azul, Yape/Plin=violeta, Transferencia=gris
- ID degrada a micro-caption; acciones en botones de contorno `borderStrong`, touch target 44px

**Modales (detalle y ticket)** — header sticky con close 44px; secciones con `SectionHeader`; filas etiqueta (caption muted) / valor (body primary); tabla de productos con montos a la derecha; total en banda `successSoft`; "Ver Ticket" fijo en footer. El ticket conserva su estética de recibo (divisores dashed, marca EP) migrada a tokens.

---

## 4. Presupuestos (Fase 4)

**Filtros (nuevos)** — `SegmentedControl` de estado: Pendientes / Aprobados / Rechazados / Todos.

**Card de presupuesto rediseñada:**

```
┃ ● Pendiente                        S/ 890.00 ┃
┃ Juan Pérez · Orden #A1B2                    ┃
┃ 3 items · Vence en 5 días           10 mar  ┃
```

- **Urgencia visible**: "Vence hoy" / "Vence en 3 días" en `warning`; vencido en `danger` (calculado desde `expiresAt`, que hoy no se muestra)
- Cliente + orden vinculada en bodyStrong; N° de items en caption; monto héroe derecha

**Detalle como "documento"** — cabecera con cliente + monto display + StatusBadge; tabla de items con subtotales; notas en bloque `surfaceMuted`; **botones Aprobar (primario success) / Rechazar (contorno danger) fijos en el footer** — hoy viven dentro del scroll. Eliminar como acción de texto `danger` en el header.

**Formulario nuevo presupuesto en 3 pasos visuales** (mismo scroll, `SectionHeader` numerados):
- **01 · Cliente** — SearchableSelector actual
- **02 · Items** — fila compacta: descripción (flex) + cant (64px) + precio (88px) + botón "+" cuadrado `primary`; todos con micro-label (hoy el precio flota sin etiqueta); items agregados como mini-cards con delete
- **03 · Resumen** — notas + desglose subtotal/total
- **Sticky footer**: banda siempre visible con total en vivo + botón Guardar primario — hoy hay que scrollear al fondo
- **Validación inline** en `dangerSoft` bajo cada campo, en vez de `Alert.alert` centralizado

---

## 5. Cards en general — reglas transversales

1. **Una sombra, un borde, un radio**: radio 16, borde `#E4E7EC`, sombra única.
2. **Regla del protagonista**: un solo dato héroe por card — monto (ventas/presupuestos), equipo+estado (órdenes). El resto es caption.
3. **Color con significado**: solo en estados, montos y botones primarios. Prohibidos íconos decorativos multicolor.
4. **Touch targets ≥ 44px**, `activeOpacity 0.85`, separación entre cards 12px.
5. **Contraste AA**: `#1D4ED8` y `#067647` sobre blanco; texto blanco solo sobre sólidos primary/success.
6. **Estados vacíos con CTA**, nunca solo texto.
7. **Fechas relativas** en listas ("Hoy 14:22", "Ayer", "3 mar"); fecha completa solo en detalles.

## 6. Cohesión global

- **BottomTabBar**: pill flotante despegada del borde (margin 12, radio completo), tab activo con fondo `primarySoft` radio 999 en ícono+label `primary`; conserva `BlurView`.
- **Migración de color**: `#3B82F6`/`#2563eb` → `primary` en las pantallas del plan (login mantiene su tema oscuro propio).
- **Fuera de alcance**: Clientes, Productos, Reportes y Perfil quedan para después; consumirán estos mismos tokens.

---

## Orden de ejecución y verificación

| Fase | Alcance | Verificación |
|---|---|---|
| **1** | `theme.ts` + 7 componentes UI + mapa de estados | `tsc --noEmit` + build |
| **2** | Dashboard: header hero, KPIs, acciones, cards de orden | typecheck + build + inspección visual en preview |
| **3** | Ventas: KPIs jerarquizados, segmented, cards, modales | idem |
| **4** | Presupuestos + TabBar flotante | idem |

Cada fase es un punto de rollback seguro: solo cambia presentación.
