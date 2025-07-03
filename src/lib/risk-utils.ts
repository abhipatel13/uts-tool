// Risk-related utilities and constants shared across components

export const riskCategories = [
  { id: "Personnel", label: "Personnel", color: "bg-[#00A3FF]" },
  { id: "Maintenance", label: "Maintenance", color: "bg-gray-200" },
  { id: "Revenue", label: "Revenue", color: "bg-gray-200" },
  { id: "Process", label: "Process", color: "bg-gray-200" },
  { id: "Environmental", label: "Environmental", color: "bg-gray-200" },
]

export const personnelConsequenceLabels = [
  { value: "Minor", label: "Minor", description: "No Lost Time", score: 1 },
  { value: "Significant", label: "Significant", description: "Lost Time", score: 2 },
  { value: "Serious", label: "Serious", description: "Short Term Disability", score: 3 },
  { value: "Major", label: "Major", description: "Long Term Disability", score: 4 },
  { value: "Catastrophic", label: "Catastrophic", description: "Fatality", score: 5 },
]

export const maintenanceConsequenceLabels = [
  { value: "Minor", label: "Minor", description: "<5% Impact to Maintenance Budget", score: 1 },
  { value: "Significant", label: "Significant", description: "5-10% Impact to Maintenance Budget", score: 2 },
  { value: "Serious", label: "Serious", description: "20-30% Impact to Maintenance Budget", score: 3 },
  { value: "Major", label: "Major", description: "30-40% Impact to Maintenance Budget", score: 4 },
  { value: "Catastrophic", label: "Catastrophic", description: ">41% Impact to Maintenance Budget", score: 5 },
]

export const revenueConsequenceLabels = [
  { value: "Minor", label: "Minor", description: "<2% Impact to Revenue", score: 1 },
  { value: "Significant", label: "Significant", description: "2-6% Impact to Revenue", score: 2 },
  { value: "Serious", label: "Serious", description: "6-12% Impact to Revenue", score: 3 },
  { value: "Major", label: "Major", description: "12-24% Impact to Revenue", score: 4 },
  { value: "Catastrophic", label: "Catastrophic", description: ">25% Impact to Revenue", score: 5 },
]

export const processConsequenceLabels = [
  { value: "Minor", label: "Minor", description: "Production Loss < 10 Days", score: 1 },
  { value: "Significant", label: "Significant", description: "Production Loss 10 - 20 Days", score: 2 },
  { value: "Serious", label: "Serious", description: "Production Loss 20 - 40 Days", score: 3 },
  { value: "Major", label: "Major", description: "Production Loss 40 - 80 Days", score: 4 },
  { value: "Catastrophic", label: "Catastrophic", description: "Production Loss >81 Days", score: 5 },
]

export const environmentalConsequenceLabels = [
  { value: "Minor", label: "Minor", description: "Near Source - Non Reportable - Cleanup <1Shift", score: 1 },
  { value: "Significant", label: "Significant", description: "Near Source - Reportable - Cleanup <1Shift", score: 2 },
  { value: "Serious", label: "Serious", description: "Near Source - Reportable - Cleanup <4WKS", score: 3 },
  { value: "Major", label: "Major", description: "Near Source - Reportable - Cleanup <52WKS", score: 4 },
  { value: "Catastrophic", label: "Catastrophic", description: "Near Source - Reportable - Cleanup <1WK", score: 5 },
]

export const likelihoodLabels = [
  { value: "Very Unlikely", label: "Very Unlikely", description: "Once in Lifetime >75 Years", score: 1 },
  { value: "Slight Chance", label: "Slight Chance", description: "Once in 10 to 75 Years", score: 2 },
  { value: "Feasible", label: "Feasible", description: "Once in 10 Years", score: 3 },
  { value: "Likely", label: "Likely", description: "Once in 2 to 10 Years", score: 4 },
  { value: "Very Likely", label: "Very Likely", description: "Multiple times in 2 Years", score: 5 },
]

// Risk matrix scores based on the image
export const riskMatrix = [
  // Minor (1), Significant (2), Serious (3), Major (4), Catastrophic (5)
  [1, 2, 3, 4, 5],    // Very Unlikely (1)
  [2, 4, 6, 8, 10],   // Slight Chance (2)
  [3, 6, 9, 12, 15],  // Feasible (3)
  [4, 8, 12, 16, 20], // Likely (4)
  [5, 10, 15, 20, 25] // Very Likely (5)
];

export const getRiskScore = (likelihood: string, consequence: string, consequenceLabels: Array<{value: string, score: number}>) => {
  const likelihoodScore = likelihoodLabels.find(l => l.value === likelihood)?.score || 0;
  const consequenceScore = consequenceLabels.find(c => c.value === consequence)?.score || 0;
  
  if (likelihoodScore === 0 || consequenceScore === 0) return 0;
  
  return riskMatrix[likelihoodScore - 1][consequenceScore - 1];
};

export const getRiskColor = (score: number, riskType: string) => {
  // For Maintenance Risk
  if (riskType === "Maintenance") {
    // Looking at the exact matrix:
    // Scores: 1, 2 are green
    if (score <= 2) return "bg-[#8DC63F] text-black";
    
    // Scores: 3, 4, 5, 6, 8, 9 are yellow
    if (score <= 9) return "bg-[#FFFF00] text-black";
    
    // Scores: 10, 12 are orange
    if (score <= 12) return "bg-[#F7941D] text-white";
    
    // Scores: 15 is orange
    if (score === 15) return "bg-[#F7941D] text-white";
    
    // Scores: 16, 20, 25 are red
    return "bg-[#ED1C24] text-white";
  }

  if (riskType === "Personnel") {
    // Scores: 1-2 are green
    if (score <= 2) return "bg-[#8DC63F] text-black";
    
    // Scores: 3-4 are yellow
    if (score <= 9) return "bg-[#FFFF00] text-black";

    // Scores: 5-10 are orange
    if (score <= 15) return "bg-[#F7941D] text-white";

    // Scores: 12-25 are red
    return "bg-[#ED1C24] text-white";
  }

  if (riskType === "Revenue") {
    // Scores: 1-2 are green
    if (score <= 2) return "bg-[#8DC63F] text-black";

    // Scores: 3-6 are yellow
    if (score <= 9) return "bg-[#FFFF00] text-black";

    // Scores: 7-8 are orange
    if (score <= 15) return "bg-[#F7941D] text-white";

    // Scores: 12-25 are red
    return "bg-[#ED1C24] text-white";
  }

  if (riskType === "Process") {
     // Scores: 1-2 are green
     if (score <= 2) return "bg-[#8DC63F] text-black";

     // Scores: 3-6 are yellow
     if (score <= 9) return "bg-[#FFFF00] text-black";
 
     // Scores: 7-8 are orange
     if (score <= 15) return "bg-[#F7941D] text-white";
 
     // Scores: 12-25 are red
     return "bg-[#ED1C24] text-white";
  }

  if (riskType === "Environmental") {
   // Scores: 1-2 are green
   if (score <= 2) return "bg-[#8DC63F] text-black";

   // Scores: 3-6 are yellow
   if (score <= 9) return "bg-[#FFFF00] text-black";

   // Scores: 7-8 are orange
   if (score <= 15) return "bg-[#F7941D] text-white";

   // Scores: 12-25 are red
   return "bg-[#ED1C24] text-white";
  }
  
  // For Personnel Risk and other types
  // Green (1-2)
  if (score <= 2) return "bg-[#8DC63F] text-black";
  
  // Yellow (3-4)
  if (score <= 4) return "bg-[#FFFF00] text-black";
  
  // Orange (5-10)
  if (score <= 10) return "bg-[#F7941D] text-white";
  
  // Red (12-25)
  return "bg-[#ED1C24] text-white";
}

// Define risk level indicators for each risk type
export const riskLevelIndicators = {
  Personnel: [
    { color: "bg-[#8DC63F]", label: "Low Risk (1-2)", textColor: "text-black" },
    { color: "bg-[#FFFF00]", label: "Medium Risk (3-9)", textColor: "text-black" },
    { color: "bg-[#F7941D]", label: "High Risk (10-15)", textColor: "text-white" },
    { color: "bg-[#ED1C24]", label: "Critical Risk (16-25)", textColor: "text-white" },
  ],
  Maintenance: [
    { color: "bg-[#8DC63F]", label: "Low Risk (1-2)", textColor: "text-black" },
    { color: "bg-[#FFFF00]", label: "Medium Risk (3-9)", textColor: "text-black" },
    { color: "bg-[#F7941D]", label: "High Risk (10-15)", textColor: "text-white" },
    { color: "bg-[#ED1C24]", label: "Critical Risk (16-25)", textColor: "text-white" },
  ],
  Revenue: [
    { color: "bg-[#8DC63F]", label: "Low Risk (1-2)", textColor: "text-black" },
    { color: "bg-[#FFFF00]", label: "Medium Risk (3-9)", textColor: "text-black" },
    { color: "bg-[#F7941D]", label: "High Risk (10-15)", textColor: "text-white" },
    { color: "bg-[#ED1C24]", label: "Critical Risk (16-25)", textColor: "text-white" },
  ],
  Process: [
    { color: "bg-[#8DC63F]", label: "Low Risk (1-2)", textColor: "text-black" },
    { color: "bg-[#FFFF00]", label: "Medium Risk (3-9)", textColor: "text-black" },
    { color: "bg-[#F7941D]", label: "High Risk (10-15)", textColor: "text-white" },
    { color: "bg-[#ED1C24]", label: "Critical Risk (16-25)", textColor: "text-white" },
  ],
  Environmental: [
    { color: "bg-[#8DC63F]", label: "Low Risk (1-2)", textColor: "text-black" },
    { color: "bg-[#FFFF00]", label: "Medium Risk (3-9)", textColor: "text-black" },
    { color: "bg-[#F7941D]", label: "High Risk (10-15)", textColor: "text-white" },
    { color: "bg-[#ED1C24]", label: "Critical Risk (16-25)", textColor: "text-white" },
  ],
};

// Get consequence labels for a specific risk type
export const getConsequenceLabels = (riskType: string) => {
  switch (riskType) {
    case "Maintenance": return maintenanceConsequenceLabels;
    case "Personnel": return personnelConsequenceLabels;
    case "Revenue": return revenueConsequenceLabels;
    case "Process": return processConsequenceLabels;
    case "Environmental": return environmentalConsequenceLabels;
    default: return personnelConsequenceLabels;
  }
};

// TypeScript types
export type RiskCategory = typeof riskCategories[number];
export type ConsequenceLabel = typeof personnelConsequenceLabels[number];
export type LikelihoodLabel = typeof likelihoodLabels[number];
export type RiskType = "Personnel" | "Maintenance" | "Revenue" | "Process" | "Environmental"; 