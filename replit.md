# Control financiero

Aplicación web responsive para registrar ingresos y egresos, controlar presupuestos por categoría y consultar un resumen financiero mensual.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/control-financiero/src/App.tsx` — navegación, estado financiero, formularios y persistencia local.
- `artifacts/control-financiero/src/index.css` — tema visual, responsive layout y estados interactivos.
- `artifacts/control-financiero` — aplicación web principal.

## Architecture decisions

- La primera versión es frontend-only y persiste los datos en `localStorage` para poder usarla sin configuración de cuenta o servidor.
- La app inicia con datos de ejemplo para que el resumen sea útil desde el primer acceso y permite restablecerlos.
- Las tres áreas principales se mantienen como rutas separadas: resumen, movimientos y presupuesto.

## Product

- Resumen mensual con ingresos, gastos, disponible, salud financiera y avance del presupuesto.
- Registro, edición, eliminación y filtrado de ingresos y egresos.
- Creación, edición y eliminación de presupuestos por categoría con alertas visuales de progreso y exceso.
- Experiencia responsive con navegación lateral en escritorio y navegación inferior en móvil.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
