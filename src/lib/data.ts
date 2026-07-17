export type Predio = {
  id: string
  nombre: string
  agricultor: string
  comuna: string
  metrica: string
  cultivo: string
}

export const predios: Predio[] = [
  {
    id: "1",
    nombre: "Los Olivos",
    agricultor: "Pedro González",
    comuna: "Quillota",
    metrica: "12.4 ha",
    cultivo: "Paltos",
  },
  {
    id: "2",
    nombre: "Santa Rosa",
    agricultor: "María López",
    comuna: "Quillota",
    metrica: "8.1 ha",
    cultivo: "Cítricos",
  },
  {
    id: "3",
    nombre: "El Mirador",
    agricultor: "Pedro González",
    comuna: "La Cruz",
    metrica: "5.6 ha",
    cultivo: "Paltos",
  },
  {
    id: "4",
    nombre: "San José",
    agricultor: "Ana Torres",
    comuna: "Nogales",
    metrica: "15.2 ha",
    cultivo: "Cítricos",
  },
  {
    id: "5",
    nombre: "Las Palmas",
    agricultor: "María López",
    comuna: "Quillota",
    metrica: "3.9 ha",
    cultivo: "Paltos",
  },
]

export const cultivos = ["Paltos", "Cítricos"]
export const comunas = ["Quillota"]
