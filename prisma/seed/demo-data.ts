export const CATEGORY_DEFS = [
  { name: "Medicamentos", riskLevel: "ALTO" as const },
  { name: "Material Cirúrgico", riskLevel: "MEDIO" as const },
  { name: "Equipamento Hospitalar", riskLevel: "MEDIO" as const },
  { name: "Descartáveis Médicos", riskLevel: "BAIXO" as const },
  { name: "Outros", riskLevel: "BAIXO" as const },
];

export const CERTIFICATION_DEFS = ["GMP", "ISO 9001", "ISO 13485", "INFARMED", "EMA", "CE Mark", "FDA"];

export const SUPPLIER_DEFS = [
  { name: "Farmacêutica Ibérica, S.A.", country: "Espanha", categories: ["Medicamentos"] },
  { name: "MedPT Distribuição, Lda", country: "Portugal", categories: ["Medicamentos", "Descartáveis Médicos"] },
  { name: "Lusofarma Exportações, Lda", country: "Portugal", categories: ["Medicamentos"] },
  { name: "Hispano Médica Supplies, S.L.", country: "Espanha", categories: ["Material Cirúrgico", "Descartáveis Médicos"] },
  { name: "Shanghai Meditech Co., Ltd", country: "China", categories: ["Equipamento Hospitalar", "Material Cirúrgico"] },
  { name: "Guangzhou Health Products Co.", country: "China", categories: ["Descartáveis Médicos"] },
  { name: "Shenzhen Surgical Instruments Ltd", country: "China", categories: ["Material Cirúrgico"] },
  { name: "Bharat Pharma Exports Pvt Ltd", country: "Índia", categories: ["Medicamentos"] },
  { name: "Mumbai MedSupply Pvt Ltd", country: "Índia", categories: ["Medicamentos", "Descartáveis Médicos"] },
  { name: "Delhi Surgical Traders", country: "Índia", categories: ["Material Cirúrgico"] },
  { name: "Distribuidora Saúde Brasil, Ltda", country: "Brasil", categories: ["Medicamentos"] },
  { name: "São Paulo Med Export, Ltda", country: "Brasil", categories: ["Equipamento Hospitalar"] },
  { name: "Rio Farma Comércio Internacional", country: "Brasil", categories: ["Medicamentos", "Outros"] },
  { name: "EuroMed Trading GmbH", country: "Alemanha", categories: ["Equipamento Hospitalar"] },
  { name: "French Pharma Distribution SAS", country: "França", categories: ["Medicamentos"] },
  { name: "Porto Cirúrgico Import-Export", country: "Portugal", categories: ["Material Cirúrgico"] },
  { name: "Barcelona Health Devices, S.L.", country: "Espanha", categories: ["Equipamento Hospitalar"] },
  { name: "Guangdong PPE Manufacturing Co.", country: "China", categories: ["Descartáveis Médicos"] },
  { name: "Novo Farma Angola Parceiros", country: "Portugal", categories: ["Medicamentos", "Outros"] },
  { name: "Chennai Medical Devices Ltd", country: "Índia", categories: ["Equipamento Hospitalar"] },
];

export const CLIENT_NAMES = [
  "Hospital Josina Machel", "Clínica Girassol", "Farmácia Central de Luanda",
  "Clínica Sagrada Esperança", "Hospital Américo Boavida", "Farmácia Multicare Luanda",
  "Clínica Multiperfil", "Hospital Geral do Huambo", "Farmácia Benfica",
  "Clínica Cruz Vermelha Angola", "Hospital Provincial do Bié", "Farmácia Nova Vida",
  "Clínica Espírito Santo", "Hospital Central de Benguela", "Farmácia Kilamba",
  "Clínica Sant'Anna Luanda", "Hospital Militar Principal", "Farmácia Talatona",
  "Clínica Girassol Talatona", "Hospital Provincial do Namibe", "Farmácia Miramar",
  "Distribuidora Médica Angola, Lda", "Clínica Multimédica Lubango", "Hospital Provincial de Malanje",
  "Farmácia Nova Luanda Sul",
];

export const COMMERCIAL_MAPPINGS: { commercialName: string; genericName: string }[] = [
  { commercialName: "Brufen", genericName: "Ibuprofeno" },
  { commercialName: "Ben-u-ron", genericName: "Paracetamol" },
  { commercialName: "Augmentin", genericName: "Amoxicilina + Ácido Clavulânico" },
  { commercialName: "Voltaren", genericName: "Diclofenac" },
  { commercialName: "Lasix", genericName: "Furosemida" },
  { commercialName: "Amoxil", genericName: "Amoxicilina" },
  { commercialName: "Zantac", genericName: "Ranitidina" },
  { commercialName: "Glucophage", genericName: "Metformina" },
  { commercialName: "Cipro", genericName: "Ciprofloxacina" },
  { commercialName: "Zyrtec", genericName: "Cetirizina" },
];

export interface ProductDef {
  name: string;
  genericName?: string;
  category: string;
  variants: {
    name: string;
    presentations: {
      type: "BLISTER" | "FRASCO" | "INJETAVEL" | "SUSPENSAO" | "INDIVIDUAL";
      dose?: string;
      qtyPerPackage: number;
      unitsPerBox: number;
    }[];
  }[];
}

export const PRODUCT_DEFS: ProductDef[] = [
  {
    name: "Ibuprofeno", genericName: "Ibuprofeno", category: "Medicamentos",
    variants: [
      { name: "400mg", presentations: [{ type: "BLISTER", dose: "400mg", qtyPerPackage: 20, unitsPerBox: 200 }] },
      { name: "600mg", presentations: [{ type: "BLISTER", dose: "600mg", qtyPerPackage: 20, unitsPerBox: 200 }] },
    ],
  },
  {
    name: "Paracetamol", genericName: "Paracetamol", category: "Medicamentos",
    variants: [
      { name: "500mg", presentations: [{ type: "BLISTER", dose: "500mg", qtyPerPackage: 20, unitsPerBox: 300 }] },
      { name: "1g", presentations: [{ type: "BLISTER", dose: "1g", qtyPerPackage: 20, unitsPerBox: 200 }] },
    ],
  },
  {
    name: "Amoxicilina", genericName: "Amoxicilina", category: "Medicamentos",
    variants: [
      { name: "500mg cápsulas", presentations: [{ type: "BLISTER", dose: "500mg", qtyPerPackage: 20, unitsPerBox: 200 }] },
      { name: "Suspensão pediátrica", presentations: [{ type: "SUSPENSAO", dose: "125mg/5ml", qtyPerPackage: 1, unitsPerBox: 50 }] },
    ],
  },
  {
    name: "Diclofenac", genericName: "Diclofenac", category: "Medicamentos",
    variants: [{ name: "50mg", presentations: [{ type: "BLISTER", dose: "50mg", qtyPerPackage: 20, unitsPerBox: 200 }] }],
  },
  {
    name: "Furosemida", genericName: "Furosemida", category: "Medicamentos",
    variants: [{ name: "40mg", presentations: [{ type: "BLISTER", dose: "40mg", qtyPerPackage: 20, unitsPerBox: 200 }] }],
  },
  {
    name: "Ciprofloxacina", genericName: "Ciprofloxacina", category: "Medicamentos",
    variants: [{ name: "500mg", presentations: [{ type: "BLISTER", dose: "500mg", qtyPerPackage: 10, unitsPerBox: 100 }] }],
  },
  {
    name: "Metformina", genericName: "Metformina", category: "Medicamentos",
    variants: [{ name: "850mg", presentations: [{ type: "BLISTER", dose: "850mg", qtyPerPackage: 30, unitsPerBox: 300 }] }],
  },
  {
    name: "Cetirizina", genericName: "Cetirizina", category: "Medicamentos",
    variants: [{ name: "10mg", presentations: [{ type: "BLISTER", dose: "10mg", qtyPerPackage: 10, unitsPerBox: 100 }] }],
  },
  {
    name: "Ranitidina", genericName: "Ranitidina", category: "Medicamentos",
    variants: [{ name: "150mg", presentations: [{ type: "BLISTER", dose: "150mg", qtyPerPackage: 20, unitsPerBox: 200 }] }],
  },
  {
    name: "Soro Fisiológico", genericName: "Cloreto de Sódio 0,9%", category: "Medicamentos",
    variants: [{ name: "500ml", presentations: [{ type: "FRASCO", dose: "500ml", qtyPerPackage: 1, unitsPerBox: 20 }] }],
  },
  {
    name: "Amoxicilina Injetável", genericName: "Amoxicilina", category: "Medicamentos",
    variants: [{ name: "1g injetável", presentations: [{ type: "INJETAVEL", dose: "1g", qtyPerPackage: 1, unitsPerBox: 50 }] }],
  },
  {
    name: "Seringa", category: "Descartáveis Médicos",
    variants: [
      { name: "2ml", presentations: [{ type: "INDIVIDUAL", dose: "2ml", qtyPerPackage: 1, unitsPerBox: 100 }] },
      { name: "5ml", presentations: [{ type: "INDIVIDUAL", dose: "5ml", qtyPerPackage: 1, unitsPerBox: 100 }] },
      { name: "10ml", presentations: [{ type: "INDIVIDUAL", dose: "10ml", qtyPerPackage: 1, unitsPerBox: 100 }] },
    ],
  },
  {
    name: "Luvas de Nitrilo", category: "Descartáveis Médicos",
    variants: [
      { name: "Tamanho M", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 100, unitsPerBox: 1000 }] },
      { name: "Tamanho G", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 100, unitsPerBox: 1000 }] },
    ],
  },
  {
    name: "Máscara Cirúrgica", category: "Descartáveis Médicos",
    variants: [{ name: "Tripla camada", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 50, unitsPerBox: 2000 }] }],
  },
  {
    name: "Máscara FFP2", category: "Descartáveis Médicos",
    variants: [{ name: "Padrão", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 20, unitsPerBox: 400 }] }],
  },
  {
    name: "Compressas de Gaze", category: "Descartáveis Médicos",
    variants: [{ name: "10x10cm", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 100, unitsPerBox: 1000 }] }],
  },
  {
    name: "Álcool Gel", category: "Descartáveis Médicos",
    variants: [{ name: "500ml", presentations: [{ type: "FRASCO", qtyPerPackage: 1, unitsPerBox: 24 }] }],
  },
  {
    name: "Bisturi Descartável", category: "Material Cirúrgico",
    variants: [{ name: "Nº 10", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 100 }] }],
  },
  {
    name: "Sutura Cirúrgica", category: "Material Cirúrgico",
    variants: [
      { name: "Vicryl 3-0", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 36 }] },
      { name: "Nylon 2-0", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 36 }] },
    ],
  },
  {
    name: "Kit de Sutura", category: "Material Cirúrgico",
    variants: [{ name: "Kit completo", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 10 }] }],
  },
  {
    name: "Campo Cirúrgico Descartável", category: "Material Cirúrgico",
    variants: [{ name: "Padrão", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 50 }] }],
  },
  {
    name: "Cateter Intravenoso", category: "Material Cirúrgico",
    variants: [{ name: "18G", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 100 }] }],
  },
  {
    name: "Sonda Urinária", category: "Material Cirúrgico",
    variants: [{ name: "Nº 14", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 50 }] }],
  },
  {
    name: "Monitor de Sinais Vitais", category: "Equipamento Hospitalar",
    variants: [{ name: "Modelo Standard", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 1 }] }],
  },
  {
    name: "Oxímetro de Pulso", category: "Equipamento Hospitalar",
    variants: [{ name: "Portátil", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 10 }] }],
  },
  {
    name: "Ventilador Portátil", category: "Equipamento Hospitalar",
    variants: [{ name: "Modelo Compacto", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 1 }] }],
  },
  {
    name: "Cama Hospitalar", category: "Equipamento Hospitalar",
    variants: [{ name: "Elétrica 3 posições", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 1 }] }],
  },
  {
    name: "Cadeira de Rodas", category: "Equipamento Hospitalar",
    variants: [{ name: "Dobrável Standard", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 1 }] }],
  },
  {
    name: "Termómetro Digital", category: "Equipamento Hospitalar",
    variants: [{ name: "Infravermelhos", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 20 }] }],
  },
  {
    name: "Desfibrilhador", category: "Equipamento Hospitalar",
    variants: [{ name: "DEA Automático", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 1 }] }],
  },
  {
    name: "Bomba de Infusão", category: "Equipamento Hospitalar",
    variants: [{ name: "Volumétrica", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 1 }] }],
  },
  {
    name: "Autoclave", category: "Equipamento Hospitalar",
    variants: [{ name: "18L", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 1 }] }],
  },
  {
    name: "Estetoscópio", category: "Outros",
    variants: [{ name: "Duplo", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 20 }] }],
  },
  {
    name: "Balança Médica", category: "Outros",
    variants: [{ name: "Digital 200kg", presentations: [{ type: "INDIVIDUAL", qtyPerPackage: 1, unitsPerBox: 1 }] }],
  },
];

export const NAO_AVANCOU_MOTIVOS = [
  "PRECO", "PRAZO", "CLIENTE_DESISTIU", "PRODUTO_INDISPONIVEL", "CONCORRENCIA", "OUTRO",
] as const;
