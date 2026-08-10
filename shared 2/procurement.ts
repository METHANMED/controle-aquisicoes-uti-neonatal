export const PROJECT_INFO = {
  proposalCode: "PNE-2025-001",
  proposalDate: "2026-07-29",
  title: "Projeto UTI Neonatal",
  organization: "CASSEMS",
  destination: "Hospital CASSEMS de Corumbá",
  city: "Corumbá/MS",
  equipmentTypes: 52,
  totalUnits: 162,
  totalValueCents: 431426540,
} as const;

export const STAGE_DEFINITIONS = [
  { key: "acquisition", label: "Aquisição", order: 1 },
  { key: "invoice_link", label: "Link da Nota Fiscal", order: 2 },
  { key: "shipping", label: "Envio", order: 3 },
  { key: "expected_delivery", label: "Previsão de Entrega", order: 4 },
  { key: "delivery", label: "Entrega", order: 5 },
  { key: "installation", label: "Instalação", order: 6 },
] as const;

export const STAGE_STATUSES = [
  { key: "pending", label: "Pendente" },
  { key: "in_progress", label: "Em andamento" },
  { key: "completed", label: "Concluída" },
  { key: "blocked", label: "Com impedimento" },
] as const;

export type StageKey = (typeof STAGE_DEFINITIONS)[number]["key"];
export type StageStatus = (typeof STAGE_STATUSES)[number]["key"];

export type SourceEquipment = {
  itemNumber: number;
  name: string;
  brand: string | null;
  model: string | null;
  quantity: number;
  unitValueCents: number;
  totalValueCents: number;
};

export const SOURCE_EQUIPMENT: readonly SourceEquipment[] = [
  { itemNumber: 1, name: "Carro de Checagem", brand: "Meta Hospitalar", model: "MT 996 – Carro de Checagem", quantity: 1, unitValueCents: 800000, totalValueCents: 800000 },
  { itemNumber: 2, name: "Aspirador Portátil", brand: "Protec", model: "Evolution 10000", quantity: 2, unitValueCents: 1200000, totalValueCents: 2400000 },
  { itemNumber: 3, name: "Balança Antropométrica Digital", brand: "Welmy", model: "Baby Welmy", quantity: 1, unitValueCents: 145000, totalValueCents: 145000 },
  { itemNumber: 4, name: "Balança Antropométrica Neonatal Digital", brand: "Welmy", model: "Welmy Eletrônica", quantity: 1, unitValueCents: 180000, totalValueCents: 180000 },
  { itemNumber: 5, name: "Berço Aquecido com Baby Puff", brand: "Fanem", model: "Ampla 2085", quantity: 3, unitValueCents: 3500000, totalValueCents: 10500000 },
  { itemNumber: 6, name: "Biombo", brand: "Stärke", model: null, quantity: 8, unitValueCents: 405700, totalValueCents: 3245600 },
  { itemNumber: 7, name: "Bolsa Pressórica", brand: "Lif", model: null, quantity: 3, unitValueCents: 75000, totalValueCents: 225000 },
  { itemNumber: 8, name: "Cadeira de Rodas Adulto", brand: "Lif", model: "Capacidade 120 kg", quantity: 1, unitValueCents: 235000, totalValueCents: 235000 },
  { itemNumber: 9, name: "Cadeira de Rodas Infantil", brand: "Lif", model: "Capacidade 75 kg", quantity: 2, unitValueCents: 199000, totalValueCents: 398000 },
  { itemNumber: 10, name: "Cadeira de Rodas para Banho", brand: "Lif", model: "Capacidade 200 kg", quantity: 1, unitValueCents: 179000, totalValueCents: 179000 },
  { itemNumber: 11, name: "Cama Eletrônica 4 Motores Infantil", brand: "Meta Hospitalar", model: "MT 154 Flex Care / MT 219 Diamond", quantity: 5, unitValueCents: 2490000, totalValueCents: 12450000 },
  { itemNumber: 12, name: "Câmara de Conservação 340L", brand: "Elber Medical", model: "340 L c/ bateria", quantity: 1, unitValueCents: 1900000, totalValueCents: 1900000 },
  { itemNumber: 13, name: "Cardiotocógrafo", brand: "Edan", model: "F3 Edan", quantity: 1, unitValueCents: 3000000, totalValueCents: 3000000 },
  { itemNumber: 14, name: "Cardioversor + Marcapasso + Impressora", brand: "Instramed / Mindray", model: "UMED-20 / CardioMax", quantity: 2, unitValueCents: 4000000, totalValueCents: 8000000 },
  { itemNumber: 15, name: "Carrinho de Emergência", brand: "Stärke", model: null, quantity: 2, unitValueCents: 600000, totalValueCents: 1200000 },
  { itemNumber: 16, name: "Carrinho de Medicamentos", brand: "RWR", model: null, quantity: 2, unitValueCents: 600000, totalValueCents: 1200000 },
  { itemNumber: 17, name: "Carrinho para Eletrocardiógrafo", brand: "Stärke", model: null, quantity: 1, unitValueCents: 400000, totalValueCents: 400000 },
  { itemNumber: 18, name: "Central de Monitoramento de Leitos", brand: "Mindray", model: "Compatível Mindray", quantity: 1, unitValueCents: 4800000, totalValueCents: 4800000 },
  { itemNumber: 19, name: "Cuffômetro", brand: "Stärke", model: "Escala 0 a 120 cmH2O", quantity: 1, unitValueCents: 280000, totalValueCents: 280000 },
  { itemNumber: 20, name: "Eletrocardiógrafo Portátil", brand: "Mindray", model: "BeneHeart D3", quantity: 1, unitValueCents: 1000000, totalValueCents: 1000000 },
  { itemNumber: 21, name: "Escada 2 Degraus", brand: "Lif", model: "Antiderrapante", quantity: 5, unitValueCents: 35000, totalValueCents: 175000 },
  { itemNumber: 22, name: "Estetoscópio", brand: "Stärke", model: null, quantity: 3, unitValueCents: 16990, totalValueCents: 50970 },
  { itemNumber: 23, name: "Fita Métrica", brand: "Stärke", model: null, quantity: 2, unitValueCents: 3500, totalValueCents: 7000 },
  { itemNumber: 24, name: "Fleboscópio", brand: "Duan", model: "Venos Baby", quantity: 1, unitValueCents: 280000, totalValueCents: 280000 },
  { itemNumber: 25, name: "Foco Cirúrgico Portátil", brand: "STÄRKE", model: "ST69", quantity: 1, unitValueCents: 2790000, totalValueCents: 2790000 },
  { itemNumber: 26, name: "Fototerapia", brand: "Fanem", model: "Bilitron Sky 5006", quantity: 2, unitValueCents: 1000000, totalValueCents: 2000000 },
  { itemNumber: 27, name: "Incubadora de Transporte", brand: "Fanem", model: "IT 158 TS", quantity: 1, unitValueCents: 11000000, totalValueCents: 11000000 },
  { itemNumber: 28, name: "Incubadora Estacionária", brand: "Fanem", model: "1186", quantity: 6, unitValueCents: 6300000, totalValueCents: 37800000 },
  { itemNumber: 29, name: "Kit Laringoscópio Comum", brand: "Stärke", model: "MACCOY", quantity: 2, unitValueCents: 190000, totalValueCents: 380000 },
  { itemNumber: 30, name: "Maca de Transporte c/ Suporte para Cilindro", brand: "Meta Hospitalar", model: "MT413", quantity: 1, unitValueCents: 1200000, totalValueCents: 1200000 },
  { itemNumber: 31, name: "Marcapasso Externo", brand: "Medtronic", model: "MG45", quantity: 1, unitValueCents: 1800000, totalValueCents: 1800000 },
  { itemNumber: 32, name: "Medidor de Icterícia", brand: "Dräger", model: "JM-105", quantity: 1, unitValueCents: 4500000, totalValueCents: 4500000 },
  { itemNumber: 33, name: "Mesa Auxiliar", brand: null, model: "40x60x80 c/ rodízios", quantity: 8, unitValueCents: 99590, totalValueCents: 796720 },
  { itemNumber: 34, name: "Mesa de Mayo", brand: null, model: "Inox com bandeja", quantity: 5, unitValueCents: 103090, totalValueCents: 515450 },
  { itemNumber: 35, name: "Monitor Débito Cardíaco", brand: "Getinge", model: "PulsioFlex", quantity: 1, unitValueCents: 22990000, totalValueCents: 22990000 },
  { itemNumber: 36, name: "Monitor Multiparâmetro 5P", brand: "Mindray", model: "uMEC 12", quantity: 5, unitValueCents: 2500000, totalValueCents: 12500000 },
  { itemNumber: 37, name: "Monitor Multiparâmetro (Básico + ETCO2 + PI)", brand: "Mindray", model: "uMEC 12", quantity: 6, unitValueCents: 3500000, totalValueCents: 21000000 },
  { itemNumber: 38, name: "Monitor Multiparâmetro de Transporte", brand: "Mindray", model: "ePM 10", quantity: 2, unitValueCents: 1200000, totalValueCents: 2400000 },
  { itemNumber: 39, name: "Negatoscópio", brand: "Stärke", model: null, quantity: 1, unitValueCents: 70000, totalValueCents: 70000 },
  { itemNumber: 40, name: "Oftalmoscópio", brand: "MD", model: null, quantity: 3, unitValueCents: 60000, totalValueCents: 180000 },
  { itemNumber: 41, name: "Otoscópio", brand: "MD", model: null, quantity: 3, unitValueCents: 60000, totalValueCents: 180000 },
  { itemNumber: 42, name: "Prancha de Transferência de Pacientes", brand: "Easy Transfer", model: "Easy Transfer", quantity: 1, unitValueCents: 120000, totalValueCents: 120000 },
  { itemNumber: 43, name: "Raio-X Transportável", brand: "Mindray", model: "MobiEye 700", quantity: 1, unitValueCents: 38500000, totalValueCents: 38500000 },
  { itemNumber: 44, name: "Suporte de Monitor Multiparâmetros", brand: "Mindray", model: "Compatível Mindray", quantity: 10, unitValueCents: 245900, totalValueCents: 2459000 },
  { itemNumber: 45, name: "Suporte de Soro", brand: "LIF", model: null, quantity: 20, unitValueCents: 59990, totalValueCents: 1199800 },
  { itemNumber: 46, name: "Ultrassom Portátil", brand: "Mindray", model: "MX5 (3 transdutores + pedestal)", quantity: 1, unitValueCents: 17900000, totalValueCents: 17900000 },
  { itemNumber: 47, name: "Umidificador Aquecido", brand: "Fisher & Paykel", model: "F&P 950 System", quantity: 12, unitValueCents: 900000, totalValueCents: 10800000 },
  { itemNumber: 48, name: "Ventilador Pulmonar Adulto/Ped/Neonatal", brand: "Mindray", model: "SV300", quantity: 12, unitValueCents: 14300000, totalValueCents: 171600000 },
  { itemNumber: 49, name: "Sistema de Cateter Nasal de Alto Fluxo (CNAF)", brand: "Vapotherm", model: "Precision Flow", quantity: 1, unitValueCents: 5990000, totalValueCents: 5990000 },
  { itemNumber: 50, name: "Ventilador Pulmonar Não Invasivo c/ Bateria", brand: "Philips", model: "Trilogy", quantity: 1, unitValueCents: 4000000, totalValueCents: 4000000 },
  { itemNumber: 51, name: "Page Writer TC10", brand: "Philips", model: "TC10", quantity: 2, unitValueCents: 990000, totalValueCents: 1980000 },
  { itemNumber: 52, name: "Videolaringoscópio", brand: "STÄRKE", model: "Reutilizável (kit 6 lâminas)", quantity: 1, unitValueCents: 1725000, totalValueCents: 1725000 },
] as const;

