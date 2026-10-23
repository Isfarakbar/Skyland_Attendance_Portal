/**
 * Pakistan Salaried Individual Tax Calculator — Tax Year 2026-27 (Finance Act 2026)
 * Official FBR Progressive Slabs (Effective 1 July 2026)
 */

export interface FBRTaxSlab {
  slabNumber: number;
  minIncome: number;
  maxIncome: number | null; // null for open-ended "Above" slab
  rate: number; // e.g. 0.11 for 11%
  baseTax: number;
  description: string;
}

export const FBR_TAX_SLABS_2026_27: FBRTaxSlab[] = [
  {
    slabNumber: 1,
    minIncome: 0,
    maxIncome: 600000,
    rate: 0,
    baseTax: 0,
    description: 'Tax-free threshold (Up to Rs 600,000/year or Rs 50,000/month)',
  },
  {
    slabNumber: 2,
    minIncome: 600000,
    maxIncome: 1200000,
    rate: 0.01,
    baseTax: 0,
    description: '1% of amount exceeding Rs 600,000',
  },
  {
    slabNumber: 3,
    minIncome: 1200000,
    maxIncome: 2200000,
    rate: 0.11,
    baseTax: 6000,
    description: 'Rs 6,000 + 11% of amount exceeding Rs 1,200,000',
  },
  {
    slabNumber: 4,
    minIncome: 2200000,
    maxIncome: 3200000,
    rate: 0.2,
    baseTax: 116000,
    description: 'Rs 116,000 + 20% of amount exceeding Rs 2,200,000',
  },
  {
    slabNumber: 5,
    minIncome: 3200000,
    maxIncome: 4100000,
    rate: 0.25,
    baseTax: 316000,
    description: 'Rs 316,000 + 25% of amount exceeding Rs 3,200,000',
  },
  {
    slabNumber: 6,
    minIncome: 4100000,
    maxIncome: 5600000,
    rate: 0.29,
    baseTax: 541000,
    description: 'Rs 541,000 + 29% of amount exceeding Rs 4,100,000',
  },
  {
    slabNumber: 7,
    minIncome: 5600000,
    maxIncome: 7000000,
    rate: 0.32,
    baseTax: 976000,
    description: 'Rs 976,000 + 32% of amount exceeding Rs 5,600,000',
  },
  {
    slabNumber: 8,
    minIncome: 7000000,
    maxIncome: null,
    rate: 0.35,
    baseTax: 1424000,
    description: 'Rs 1,424,000 + 35% of amount exceeding Rs 7,000,000',
  },
];

export interface SlabBreakdownItem {
  slabNumber: number;
  incomeRange: string;
  taxableInSlab: number;
  taxFromSlab: number;
  rate: number;
}

export interface TaxCalculationResult {
  grossMonthlyIncome: number;
  preTaxReduction: number;
  monthlyTaxableIncome: number;
  annualTaxableIncome: number;
  applicableSlabNumber: number;
  marginalRate: number;
  baseTax: number;
  annualTax: number;
  monthlyTax: number;
  effectiveRate: number;
  slabDescription: string;
  breakdown: SlabBreakdownItem[];
}

/**
 * Calculates FBR progressive salaried tax.
 * Policy: First minus 10% standard reduction from the monthly salary, then apply tax on the remainder.
 * Example 1: 55,000 minus 10% (5,500) = 49,500 (< 50,000/month or 600,000/year threshold) -> Zero Tax (0%).
 * Example 2: 250,000 minus 10% (25,000) = 225,000 -> Tax brackets applied on 225,000/month.
 */
export function calculateFBRTax(monthlyIncome: number): TaxCalculationResult {
  const grossMonthly = Math.max(0, Number(monthlyIncome) || 0);
  const preTaxReduction = Math.round(grossMonthly * 0.10);
  const cleanMonthly = Math.max(0, grossMonthly - preTaxReduction);
  const annualTaxableIncome = cleanMonthly * 12;

  // Find applicable slab
  let applicableSlab = FBR_TAX_SLABS_2026_27[0];
  for (const slab of FBR_TAX_SLABS_2026_27) {
    if (slab.maxIncome === null) {
      if (annualTaxableIncome > slab.minIncome) {
        applicableSlab = slab;
      }
    } else {
      if (annualTaxableIncome > slab.minIncome && annualTaxableIncome <= slab.maxIncome) {
        applicableSlab = slab;
        break;
      }
    }
  }

  // Calculate annual tax
  let annualTax = 0;
  if (annualTaxableIncome > 600000) {
    const excess = annualTaxableIncome - applicableSlab.minIncome;
    annualTax = applicableSlab.baseTax + excess * applicableSlab.rate;
  }

  annualTax = Math.max(0, Math.round(annualTax));
  const monthlyTax = Math.round(annualTax / 12);
  const effectiveRate = annualTaxableIncome > 0 ? annualTax / annualTaxableIncome : 0;

  // Compute breakdown across each bracket (identical to the corporate FBR sheet)
  const breakdown: SlabBreakdownItem[] = [];
  for (const slab of FBR_TAX_SLABS_2026_27) {
    const rangeStr =
      slab.maxIncome !== null
        ? `${slab.minIncome.toLocaleString()} – ${slab.maxIncome.toLocaleString()}`
        : `Above ${slab.minIncome.toLocaleString()}`;

    if (annualTaxableIncome <= slab.minIncome) {
      breakdown.push({
        slabNumber: slab.slabNumber,
        incomeRange: rangeStr,
        taxableInSlab: 0,
        taxFromSlab: 0,
        rate: slab.rate,
      });
      continue;
    }

    const slabCap = slab.maxIncome !== null ? slab.maxIncome : Infinity;
    const taxableChunk = Math.min(annualTaxableIncome, slabCap) - slab.minIncome;
    const taxChunk = Math.round(taxableChunk * slab.rate);

    breakdown.push({
      slabNumber: slab.slabNumber,
      incomeRange: rangeStr,
      taxableInSlab: Math.max(0, taxableChunk),
      taxFromSlab: Math.max(0, taxChunk),
      rate: slab.rate,
    });
  }

  return {
    grossMonthlyIncome: grossMonthly,
    preTaxReduction,
    monthlyTaxableIncome: cleanMonthly,
    annualTaxableIncome,
    applicableSlabNumber: applicableSlab.slabNumber,
    marginalRate: applicableSlab.rate,
    baseTax: applicableSlab.baseTax,
    annualTax,
    monthlyTax,
    effectiveRate,
    slabDescription: applicableSlab.description,
    breakdown,
  };
}

/**
 * Universal payroll tax resolver:
 * Respects:
 * 1. Employee-level override (EXEMPT, CUSTOM_RATE, FIXED)
 * 2. Company Settings (taxDeductionEnabled, taxCalculationMode)
 */
export function resolvePayrollTax(params: {
  monthlyTaxableIncome: number;
  companySettings?: {
    taxDeductionEnabled?: boolean;
    taxCalculationMode?: 'FBR_SLABS' | 'FLAT_RATE';
    taxExemptionThreshold?: number;
    taxRate?: number;
  };
  employeeTaxSettings?: {
    isExempt?: boolean;
    customRate?: number | null;
    customFixedAmount?: number | null;
  };
}): {
  monthlyTax: number;
  annualTax: number;
  applicableSlabNumber: number | null;
  taxModeUsed: 'FBR_SLABS' | 'FLAT_RATE' | 'EXEMPT' | 'CUSTOM_RATE' | 'FIXED' | 'DISABLED';
  marginalRate: number;
  description: string;
  grossTaxableIncome: number;
  preTaxReduction: number;
  netTaxableIncome: number;
} {
  const { monthlyTaxableIncome, companySettings, employeeTaxSettings } = params;
  const taxable = Math.max(0, monthlyTaxableIncome || 0);
  const preTaxReduction = Math.round(taxable * 0.10);
  const netTaxable = Math.max(0, taxable - preTaxReduction);

  // 1. Employee overrides
  if (employeeTaxSettings?.isExempt) {
    return {
      monthlyTax: 0,
      annualTax: 0,
      applicableSlabNumber: null,
      taxModeUsed: 'EXEMPT',
      marginalRate: 0,
      description: 'Employee Tax Exempt (0%)',
      grossTaxableIncome: taxable,
      preTaxReduction,
      netTaxableIncome: netTaxable,
    };
  }

  if (
    typeof employeeTaxSettings?.customFixedAmount === 'number' &&
    employeeTaxSettings.customFixedAmount >= 0
  ) {
    const fixed = Math.round(employeeTaxSettings.customFixedAmount);
    return {
      monthlyTax: fixed,
      annualTax: fixed * 12,
      applicableSlabNumber: null,
      taxModeUsed: 'FIXED',
      marginalRate: taxable > 0 ? fixed / taxable : 0,
      description: `Fixed Monthly Withholding (PKR ${fixed.toLocaleString()})`,
      grossTaxableIncome: taxable,
      preTaxReduction,
      netTaxableIncome: netTaxable,
    };
  }

  if (
    typeof employeeTaxSettings?.customRate === 'number' &&
    employeeTaxSettings.customRate >= 0
  ) {
    const threshold =
      typeof companySettings?.taxExemptionThreshold === 'number'
        ? companySettings.taxExemptionThreshold
        : 50000;
    const taxableOver = Math.max(0, netTaxable - threshold);
    const tax = Math.round((taxableOver * employeeTaxSettings.customRate) / 100);
    return {
      monthlyTax: tax,
      annualTax: tax * 12,
      applicableSlabNumber: null,
      taxModeUsed: 'CUSTOM_RATE',
      marginalRate: employeeTaxSettings.customRate / 100,
      description: `Custom Rate: ${employeeTaxSettings.customRate}% above PKR ${threshold.toLocaleString()} (after 10% pre-tax relief)`,
      grossTaxableIncome: taxable,
      preTaxReduction,
      netTaxableIncome: netTaxable,
    };
  }

  // 2. Company level setting: Only disable if explicitly set to false
  if (companySettings?.taxDeductionEnabled === false) {
    return {
      monthlyTax: 0,
      annualTax: 0,
      applicableSlabNumber: null,
      taxModeUsed: 'DISABLED',
      marginalRate: 0,
      description: 'Company Tax Withholding Disabled',
      grossTaxableIncome: taxable,
      preTaxReduction,
      netTaxableIncome: netTaxable,
    };
  }

  // If company configured FLAT_RATE
  if (companySettings?.taxCalculationMode === 'FLAT_RATE') {
    const threshold =
      typeof companySettings?.taxExemptionThreshold === 'number'
        ? companySettings.taxExemptionThreshold
        : 50000;
    const rate = typeof companySettings?.taxRate === 'number' ? companySettings.taxRate : 2.5;
    const taxableOver = Math.max(0, netTaxable - threshold);
    const tax = Math.round((taxableOver * rate) / 100);
    return {
      monthlyTax: tax,
      annualTax: tax * 12,
      applicableSlabNumber: null,
      taxModeUsed: 'FLAT_RATE',
      marginalRate: rate / 100,
      description: `Flat Rate: ${rate}% above PKR ${threshold.toLocaleString()} (after 10% pre-tax relief)`,
      grossTaxableIncome: taxable,
      preTaxReduction,
      netTaxableIncome: netTaxable,
    };
  }

  // 3. Default: Official FBR Salaried Slabs with 10% Pre-tax Relief
  const fbr = calculateFBRTax(taxable);
  return {
    monthlyTax: fbr.monthlyTax,
    annualTax: fbr.annualTax,
    applicableSlabNumber: fbr.applicableSlabNumber,
    taxModeUsed: 'FBR_SLABS',
    marginalRate: fbr.marginalRate,
    description: `FBR Slab #${fbr.applicableSlabNumber}: ${fbr.slabDescription} (Base after 10% relief: PKR ${netTaxable.toLocaleString()})`,
    grossTaxableIncome: taxable,
    preTaxReduction,
    netTaxableIncome: netTaxable,
  };
}
