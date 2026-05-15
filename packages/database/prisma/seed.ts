/* eslint-disable no-console */
import { PrismaClient, Country, Currency, FundType, InsuranceProductCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUnions() {
  const unions = [
    { name: 'OTIT Vietnam Technical Intern Liaison', country: Country.JP },
    { name: 'EPS Vietnam Center', country: Country.KR },
    { name: 'Taiwan CLA Vietnam Office', country: Country.TW },
  ];
  for (const u of unions) {
    await prisma.union.upsert({
      where: { name_country: { name: u.name, country: u.country } },
      update: {},
      create: { ...u, active: true, partnershipStartedAt: new Date('2025-01-01') },
    });
  }
}

async function seedCorridors() {
  const corridors = [
    {
      sourceCountry: Country.JP,
      sourceCurrency: Currency.JPY,
      destCountry: Country.VN,
      destCurrency: Currency.VND,
      partnerCode: 'sbi-remit',
      feeFixed: '200',
      feePercentBps: 30,
      minAmount: '1000',
      maxAmount: '1000000',
    },
    {
      sourceCountry: Country.KR,
      sourceCurrency: Currency.KRW,
      destCountry: Country.VN,
      destCurrency: Currency.VND,
      partnerCode: 'gme-remit',
      feeFixed: '3000',
      feePercentBps: 40,
      minAmount: '10000',
      maxAmount: '10000000',
    },
    {
      sourceCountry: Country.TW,
      sourceCurrency: Currency.TWD,
      destCountry: Country.VN,
      destCurrency: Currency.VND,
      partnerCode: 'ezremit',
      feeFixed: '50',
      feePercentBps: 50,
      minAmount: '500',
      maxAmount: '100000',
    },
  ];
  for (const c of corridors) {
    await prisma.remittanceCorridor.upsert({
      where: {
        sourceCountry_sourceCurrency_destCountry_destCurrency_partnerCode: {
          sourceCountry: c.sourceCountry,
          sourceCurrency: c.sourceCurrency,
          destCountry: c.destCountry,
          destCurrency: c.destCurrency,
          partnerCode: c.partnerCode,
        },
      },
      update: {},
      create: { ...c, active: true },
    });
  }
}

async function seedFunds() {
  const funds = [
    {
      ticker: 'VFMVF1',
      name: 'VFM VF1 Equity Fund',
      manager: 'Dragon Capital',
      type: FundType.EQUITY,
      minBuyAmount: '100000',
      feeEntryBps: 50,
      feeExitBps: 100,
      feeMgmtBps: 175,
      description: 'Long-only VN equity fund, top-30 large-caps.',
    },
    {
      ticker: 'VFMVFB',
      name: 'VFM VFB Bond Fund',
      manager: 'Dragon Capital',
      type: FundType.BOND,
      minBuyAmount: '100000',
      feeEntryBps: 25,
      feeExitBps: 50,
      feeMgmtBps: 100,
      description: 'VN government and corporate bond fund.',
    },
    {
      ticker: 'VCAMBF',
      name: 'VinaCapital Balanced Fund',
      manager: 'VinaCapital',
      type: FundType.BALANCED,
      minBuyAmount: '100000',
      feeEntryBps: 50,
      feeExitBps: 75,
      feeMgmtBps: 150,
      description: '60/40 equity/bond mix.',
    },
  ];
  for (const f of funds) {
    await prisma.fund.upsert({
      where: { ticker: f.ticker },
      update: {},
      create: { ...f, currency: Currency.VND, active: true },
    });
  }
}

async function seedInsuranceProducts() {
  const products = [
    {
      code: 'FH-BASIC-50M',
      name: 'Family Health — Basic 50M VND',
      underwriter: 'Bao Viet Insurance',
      category: InsuranceProductCategory.FAMILY_HEALTH,
      coverageAmount: '50000000',
      monthlyPremium: '150000',
    },
    {
      code: 'FH-PLUS-150M',
      name: 'Family Health — Plus 150M VND',
      underwriter: 'Bao Viet Insurance',
      category: InsuranceProductCategory.FAMILY_HEALTH,
      coverageAmount: '150000000',
      monthlyPremium: '380000',
    },
    {
      code: 'ACC-100M',
      name: 'Accident Cover — 100M VND',
      underwriter: 'PVI Insurance',
      category: InsuranceProductCategory.ACCIDENT,
      coverageAmount: '100000000',
      monthlyPremium: '90000',
    },
  ];
  for (const p of products) {
    await prisma.insuranceProduct.upsert({
      where: { code: p.code },
      update: {},
      create: { ...p, currency: Currency.VND, active: true },
    });
  }
}

async function main() {
  console.log('Seeding unions...');
  await seedUnions();
  console.log('Seeding remittance corridors...');
  await seedCorridors();
  console.log('Seeding funds...');
  await seedFunds();
  console.log('Seeding insurance products...');
  await seedInsuranceProducts();
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
