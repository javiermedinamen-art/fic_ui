# FIC UI · Cartera del asesor

Interfaz de monitoreo agrícola para asesores: cartera de predios, series temporales satelitales (NDVI/NDRE/NDMI/GNDVI), comparación semanal y vuelos de dron (RGB, NDVI, NDWI, térmico, LiDAR).

## Stack

- Next.js 16 (App Router)
- shadcn/ui + Tailwind CSS
- Recharts
- TypeScript

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000/cartera](http://localhost:3000/cartera).

## Flujo de usuario

1. **Cartera** — agregados por Predio / Agricultor / Comuna, filtros y métrica satelital
2. **Predio** — serie temporal (clic en un punto → semana)
3. **Semana** — mapas satélite histórico vs actual
4. **Vuelo de dron** — capas RGB / NDVI / NDWI / Térmico / LiDAR

## Build

```bash
npm run build
npm start
```
