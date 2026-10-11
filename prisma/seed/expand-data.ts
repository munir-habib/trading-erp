export const SUPPLIER_COUNTRY_TEMPLATES: {
  country: string;
  cities: string[];
  types: string[];
  suffix: string;
}[] = [
  {
    country: "Portugal",
    cities: ["Porto", "Braga", "Coimbra", "Aveiro", "Faro", "Setúbal", "Évora", "Leiria", "Viseu", "Guimarães"],
    types: ["Farmacêutica", "Distribuição Médica", "Comércio Internacional", "Exportações Médicas", "Saúde Global", "Import-Export"],
    suffix: "Lda",
  },
  {
    country: "Espanha",
    cities: ["Madrid", "Valencia", "Sevilla", "Bilbao", "Zaragoza", "Málaga", "Murcia", "Alicante", "Vigo", "Granada"],
    types: ["Farmacéutica", "Suministros Médicos", "Distribución Sanitaria", "Comercio Internacional", "Exportaciones Médicas"],
    suffix: "S.L.",
  },
  {
    country: "China",
    cities: ["Beijing", "Shenzhen", "Wuhan", "Chengdu", "Nanjing", "Suzhou", "Xiamen", "Qingdao", "Tianjin", "Hangzhou"],
    types: ["Medical Supplies", "Healthcare Products", "Pharma Export", "Surgical Instruments", "MedTech Manufacturing"],
    suffix: "Co., Ltd",
  },
  {
    country: "Índia",
    cities: ["Hyderabad", "Pune", "Bangalore", "Ahmedabad", "Kolkata", "Chennai", "Jaipur", "Surat", "Nagpur", "Indore"],
    types: ["Pharma Exports", "MedTech Traders", "Surgical Supplies", "Healthcare Exports", "Life Sciences"],
    suffix: "Pvt Ltd",
  },
  {
    country: "Brasil",
    cities: ["Curitiba", "Salvador", "Recife", "Fortaleza", "Belo Horizonte", "Porto Alegre", "Campinas", "Brasília", "Goiânia", "Manaus"],
    types: ["Farma Distribuidora", "Comércio Médico", "Exportadora de Saúde", "Suprimentos Hospitalares"],
    suffix: "Ltda",
  },
];

export const EXTRA_PRODUCT_STEMS: { name: string; category: string }[] = [
  // Medicamentos
  { name: "Azitromicina", category: "Medicamentos" },
  { name: "Claritromicina", category: "Medicamentos" },
  { name: "Cefalexina", category: "Medicamentos" },
  { name: "Doxiciclina", category: "Medicamentos" },
  { name: "Metronidazol", category: "Medicamentos" },
  { name: "Omeprazol", category: "Medicamentos" },
  { name: "Pantoprazol", category: "Medicamentos" },
  { name: "Loratadina", category: "Medicamentos" },
  { name: "Prednisolona", category: "Medicamentos" },
  { name: "Dexametasona", category: "Medicamentos" },
  { name: "Hidrocortisona", category: "Medicamentos" },
  { name: "Insulina Regular", category: "Medicamentos" },
  { name: "Enalapril", category: "Medicamentos" },
  { name: "Losartan", category: "Medicamentos" },
  { name: "Atenolol", category: "Medicamentos" },
  { name: "Amlodipina", category: "Medicamentos" },
  { name: "Sinvastatina", category: "Medicamentos" },
  { name: "Atorvastatina", category: "Medicamentos" },
  { name: "Varfarina", category: "Medicamentos" },
  { name: "Heparina", category: "Medicamentos" },
  { name: "Tramadol", category: "Medicamentos" },
  { name: "Diazepam", category: "Medicamentos" },
  { name: "Fluoxetina", category: "Medicamentos" },
  { name: "Sertralina", category: "Medicamentos" },
  { name: "Salbutamol", category: "Medicamentos" },
  { name: "Budesonida", category: "Medicamentos" },
  { name: "Vitamina C", category: "Medicamentos" },
  { name: "Complexo B", category: "Medicamentos" },
  { name: "Sulfato Ferroso", category: "Medicamentos" },
  { name: "Ácido Fólico", category: "Medicamentos" },
  { name: "Sulfato de Zinco", category: "Medicamentos" },
  { name: "Multivitamínico", category: "Medicamentos" },
  { name: "Ondansetrona", category: "Medicamentos" },
  { name: "Domperidona", category: "Medicamentos" },
  { name: "Loperamida", category: "Medicamentos" },
  { name: "Sais de Reidratação Oral", category: "Medicamentos" },
  { name: "Nistatina", category: "Medicamentos" },
  { name: "Fluconazol", category: "Medicamentos" },
  { name: "Aciclovir", category: "Medicamentos" },
  { name: "Captopril", category: "Medicamentos" },
  // Descartáveis Médicos
  { name: "Touca Cirúrgica", category: "Descartáveis Médicos" },
  { name: "Propé Descartável", category: "Descartáveis Médicos" },
  { name: "Avental Descartável", category: "Descartáveis Médicos" },
  { name: "Lençol Descartável", category: "Descartáveis Médicos" },
  { name: "Saco para Resíduos Hospitalares", category: "Descartáveis Médicos" },
  { name: "Algodão Hidrófilo", category: "Descartáveis Médicos" },
  { name: "Adesivo Médico", category: "Descartáveis Médicos" },
  { name: "Ligadura Elástica", category: "Descartáveis Médicos" },
  { name: "Tubo Endotraqueal", category: "Descartáveis Médicos" },
  { name: "Cânula de Guedel", category: "Descartáveis Médicos" },
  { name: "Equipo de Soro", category: "Descartáveis Médicos" },
  { name: "Agulha Hipodérmica", category: "Descartáveis Médicos" },
  { name: "Coletor de Urina", category: "Descartáveis Médicos" },
  { name: "Fralda Geriátrica", category: "Descartáveis Médicos" },
  { name: "Compressa Hemostática", category: "Descartáveis Médicos" },
  { name: "Óculos de Proteção Descartáveis", category: "Descartáveis Médicos" },
  { name: "Toalhetes Desinfetantes", category: "Descartáveis Médicos" },
  // Material Cirúrgico
  { name: "Pinça Hemostática", category: "Material Cirúrgico" },
  { name: "Tesoura Cirúrgica", category: "Material Cirúrgico" },
  { name: "Porta-agulhas", category: "Material Cirúrgico" },
  { name: "Afastador Cirúrgico", category: "Material Cirúrgico" },
  { name: "Eletrocautério", category: "Material Cirúrgico" },
  { name: "Grampeador Cirúrgico", category: "Material Cirúrgico" },
  { name: "Dreno Torácico", category: "Material Cirúrgico" },
  { name: "Cateter Central", category: "Material Cirúrgico" },
  { name: "Agulha de Sutura", category: "Material Cirúrgico" },
  { name: "Malha Cirúrgica", category: "Material Cirúrgico" },
  { name: "Colar Cervical", category: "Material Cirúrgico" },
  { name: "Tala Ortopédica", category: "Material Cirúrgico" },
  { name: "Fio de Sutura Absorvível", category: "Material Cirúrgico" },
  // Equipamento Hospitalar
  { name: "Aspirador Cirúrgico", category: "Equipamento Hospitalar" },
  { name: "Lâmpada Cirúrgica", category: "Equipamento Hospitalar" },
  { name: "Mesa Cirúrgica", category: "Equipamento Hospitalar" },
  { name: "Incubadora Neonatal", category: "Equipamento Hospitalar" },
  { name: "Ecógrafo Portátil", category: "Equipamento Hospitalar" },
  { name: "Eletrocardiógrafo", category: "Equipamento Hospitalar" },
  { name: "Nebulizador", category: "Equipamento Hospitalar" },
  { name: "Concentrador de Oxigénio", category: "Equipamento Hospitalar" },
  { name: "Cilindro de Oxigénio", category: "Equipamento Hospitalar" },
  { name: "Refrigerador de Vacinas", category: "Equipamento Hospitalar" },
  { name: "Centrífuga Laboratorial", category: "Equipamento Hospitalar" },
  { name: "Microscópio", category: "Equipamento Hospitalar" },
  { name: "Analisador Bioquímico", category: "Equipamento Hospitalar" },
  { name: "Carrinho de Emergência", category: "Equipamento Hospitalar" },
  { name: "Maca Hospitalar", category: "Equipamento Hospitalar" },
  { name: "Foco Cirúrgico Móvel", category: "Equipamento Hospitalar" },
  // Outros
  { name: "Kit de Primeiros Socorros", category: "Outros" },
  { name: "Mala de Emergência", category: "Outros" },
  { name: "Régua Antropométrica", category: "Outros" },
  { name: "Marquesa de Exame", category: "Outros" },
  { name: "Ivermectina", category: "Medicamentos" },
  { name: "Albendazol", category: "Medicamentos" },
  { name: "Mebendazol", category: "Medicamentos" },
  { name: "Paracetamol Xarope Pediátrico", category: "Medicamentos" },
  { name: "Ibuprofeno Xarope Pediátrico", category: "Medicamentos" },
  { name: "Clorexidina Solução", category: "Descartáveis Médicos" },
  { name: "Iodopovidona Solução", category: "Descartáveis Médicos" },
  { name: "Tubo de Colheita de Sangue", category: "Descartáveis Médicos" },
  { name: "Manómetro de Pressão Arterial", category: "Outros" },
  { name: "Balança Antropométrica Pediátrica", category: "Equipamento Hospitalar" },
];

export function generateExtraSupplierNames(count: number, existing: Set<string>) {
  const results: { name: string; country: string }[] = [];
  let attempts = 0;
  while (results.length < count && attempts < count * 20) {
    attempts++;
    const template =
      SUPPLIER_COUNTRY_TEMPLATES[Math.floor(Math.random() * SUPPLIER_COUNTRY_TEMPLATES.length)];
    const city = template.cities[Math.floor(Math.random() * template.cities.length)];
    const type = template.types[Math.floor(Math.random() * template.types.length)];
    const name = `${city} ${type}, ${template.suffix}`;
    if (existing.has(name)) continue;
    existing.add(name);
    results.push({ name, country: template.country });
  }
  return results;
}
