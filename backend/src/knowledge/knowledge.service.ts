import { Injectable } from '@nestjs/common';

export interface KnowledgeGuide {
  id: string;
  title: string;
  category: string;
  summary: string;
  steps: { number: number; title: string; description: string }[];
  estimatedTime: string;
  estimatedCost: string;
  requiredDocuments: string[];
  suggestedCharges?: string;
  tags: string[];
}

@Injectable()
export class KnowledgeService {
  private readonly guides: KnowledgeGuide[] = [
    {
      id: 'gst-registration',
      title: 'GST Registration',
      category: 'Registration',
      summary: 'Complete process to register a business under GST regime on the GST portal.',
      steps: [
        {
          number: 1,
          title: 'Check eligibility',
          description: 'Turnover above ₹20L (₹10L for NE states) or voluntary registration.',
        },
        {
          number: 2,
          title: 'Collect documents',
          description: 'PAN, Aadhaar, Bank details, Address proof, Business registration proof.',
        },
        {
          number: 3,
          title: 'Apply on GST portal',
          description:
            'Visit gst.gov.in → Services → Registration → New Registration. Fill GST REG-01.',
        },
        {
          number: 4,
          title: 'OTP verification',
          description: 'Verify mobile and email via OTP. Upload required documents.',
        },
        {
          number: 5,
          title: 'ARN generated',
          description: 'Application Reference Number generated. Track status on portal.',
        },
        {
          number: 6,
          title: 'Certificate issued',
          description: 'GST officer verifies and issues certificate within 3-7 working days.',
        },
      ],
      estimatedTime: '3-7 working days',
      estimatedCost: 'Government: Free | CA charges: ₹500-₹2,000',
      requiredDocuments: [
        'PAN Card',
        'Aadhaar Card',
        'Bank Account Details',
        'Address Proof',
        'Business Registration Proof',
        'Photograph',
        'Digital Signature (if Pvt Ltd/LLP)',
      ],
      suggestedCharges: '₹1,000-₹2,500 depending on entity type',
      tags: ['gst', 'registration', 'new business'],
    },
    {
      id: 'gstr1-filing',
      title: 'GSTR-1 Monthly Filing',
      category: 'Compliance',
      summary: 'Monthly outward supply return filing. Due on 11th of the next month.',
      steps: [
        {
          number: 1,
          title: 'Collect sales data',
          description: 'Gather all B2B and B2C invoices for the month.',
        },
        {
          number: 2,
          title: 'Verify invoice details',
          description: 'Check GSTIN, HSN codes, tax amounts, and invoice numbers.',
        },
        {
          number: 3,
          title: 'Login to GST portal',
          description: 'Navigate to Returns → GSTR-1 for the relevant period.',
        },
        {
          number: 4,
          title: 'Upload invoice data',
          description: 'Enter B2B invoices, B2C summary, credit/debit notes, and amendments.',
        },
        {
          number: 5,
          title: 'Review and submit',
          description: 'Verify all entries. Generate summary. File with DSC or EVC.',
        },
      ],
      estimatedTime: '1-3 hours per filing',
      estimatedCost: 'Government: Free | CA charges: ₹500-₹1,500/month',
      requiredDocuments: [
        'Sales Register',
        'All Invoices',
        'Credit/Debit Notes',
        'Previous period GSTR-1',
      ],
      suggestedCharges: '₹1,000-₹2,500/month based on transaction volume',
      tags: ['gst', 'filing', 'monthly', 'gstr1', 'compliance'],
    },
    {
      id: 'msme-registration',
      title: 'MSME / Udyam Registration',
      category: 'Government Schemes',
      summary: 'Register as MSME on Udyam portal for government benefits and subsidies.',
      steps: [
        {
          number: 1,
          title: 'Check eligibility',
          description:
            'Micro: Investment ≤ ₹1Cr, Turnover ≤ ₹5Cr. Small: ≤ ₹10Cr, ≤ ₹50Cr. Medium: ≤ ₹50Cr, ≤ ₹250Cr.',
        },
        {
          number: 2,
          title: 'Visit Udyam portal',
          description: 'Go to udyamregistration.gov.in. Aadhaar-based registration.',
        },
        {
          number: 3,
          title: 'Fill details',
          description:
            'Business name, type, PAN, bank account, NIC code, employees, investment, turnover.',
        },
        {
          number: 4,
          title: 'Submit and verify',
          description: 'OTP verification. Auto-verification with CBDT and GST.',
        },
        {
          number: 5,
          title: 'Certificate generated',
          description: 'Udyam Registration Certificate with permanent number issued.',
        },
      ],
      estimatedTime: '1-2 working days (usually instant)',
      estimatedCost: 'Government: Free | CA charges: ₹500-₹1,000',
      requiredDocuments: ['Aadhaar Card', 'PAN Card', 'Business Address', 'Bank Account Details'],
      suggestedCharges: '₹500-₹1,500',
      tags: ['msme', 'udyam', 'government', 'scheme', 'benefits'],
    },
    {
      id: 'company-incorporation',
      title: 'Private Limited Company Incorporation',
      category: 'Registration',
      summary: 'Step-by-step process to incorporate a Private Limited Company in India.',
      steps: [
        {
          number: 1,
          title: 'Obtain DSC',
          description: 'Digital Signature Certificate for all proposed directors.',
        },
        {
          number: 2,
          title: 'Reserve company name',
          description: 'Apply via SPICe+ Part A on MCA portal. Two name options allowed.',
        },
        {
          number: 3,
          title: 'File SPICe+ Part B',
          description:
            'Submit incorporation form with MOA, AOA, director details, registered office.',
        },
        {
          number: 4,
          title: 'PAN & TAN allotted',
          description: 'PAN and TAN are automatically generated during incorporation.',
        },
        {
          number: 5,
          title: 'Certificate of Incorporation',
          description: 'CIN and Certificate issued by RoC. Company legally exists.',
        },
        {
          number: 6,
          title: 'Post-incorporation',
          description: 'Open bank account, register for GST, obtain Shops & Establishment license.',
        },
      ],
      estimatedTime: '7-15 working days',
      estimatedCost: 'Government: ₹5,000-₹15,000 | CA charges: ₹5,000-₹15,000',
      requiredDocuments: [
        'PAN of directors',
        'Aadhaar of directors',
        'Passport-size photos',
        'Address proof of registered office',
        'Utility bill',
        'NOC from owner',
        'MOA & AOA',
      ],
      suggestedCharges: '₹8,000-₹20,000 including government fees',
      tags: ['company', 'incorporation', 'pvt ltd', 'mca', 'registration'],
    },
    {
      id: 'income-tax-return',
      title: 'Income Tax Return Filing',
      category: 'Compliance',
      summary: 'Annual income tax return filing process for individuals and businesses.',
      steps: [
        {
          number: 1,
          title: 'Collect income documents',
          description: 'Form 16, bank statements, investment proofs, capital gains, other income.',
        },
        {
          number: 2,
          title: 'Choose correct ITR form',
          description: 'ITR-1 (salary), ITR-3 (business), ITR-4 (presumptive), etc.',
        },
        {
          number: 3,
          title: 'Compute total income',
          description: 'Add all income heads, apply deductions (80C, 80D, HRA, etc.).',
        },
        {
          number: 4,
          title: 'File on e-filing portal',
          description: 'Login to incometax.gov.in. Fill and submit the selected ITR form.',
        },
        {
          number: 5,
          title: 'Verify return',
          description:
            'e-Verify via Aadhaar OTP, net banking, or send signed ITR-V to CPC Bangalore.',
        },
      ],
      estimatedTime: '1-5 working days (per client)',
      estimatedCost: 'Government: Free | CA charges: ₹1,000-₹5,000',
      requiredDocuments: [
        'Form 16',
        'Bank Statements',
        'Investment Proofs',
        'Capital Gains Statement',
        'Previous Year Return',
      ],
      suggestedCharges: '₹1,500-₹5,000 based on complexity',
      tags: ['income tax', 'itr', 'filing', 'annual', 'compliance'],
    },
  ];

  async findAll(search?: string, category?: string): Promise<KnowledgeGuide[]> {
    let results = [...this.guides];
    if (category) {
      results = results.filter((g) => g.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (g) =>
          g.title.toLowerCase().includes(searchLower) ||
          g.summary.toLowerCase().includes(searchLower) ||
          g.tags.some((t) => t.includes(searchLower)),
      );
    }
    return results;
  }

  async findById(id: string): Promise<KnowledgeGuide | undefined> {
    return this.guides.find((g) => g.id === id);
  }

  async getCategories(): Promise<string[]> {
    return [...new Set(this.guides.map((g) => g.category))];
  }

  async getSuggestionsForClient(clientData: {
    businessType: string;
    hasGstin: boolean;
    services: string[];
  }): Promise<any[]> {
    const suggestions: any[] = [];

    if (!clientData.hasGstin) {
      suggestions.push({
        guideId: 'gst-registration',
        title: 'GST Registration recommended',
        reason: 'Client does not have GSTIN registered',
        priority: 'high',
      });
    }

    if (!clientData.services.includes('gst_filing') && clientData.hasGstin) {
      suggestions.push({
        guideId: 'gstr1-filing',
        title: 'Set up monthly GST filing',
        reason: 'Client has GSTIN but no filing service assigned',
        priority: 'medium',
      });
    }

    suggestions.push({
      guideId: 'msme-registration',
      title: 'Check MSME eligibility',
      reason: 'Government benefits and subsidies available',
      priority: 'low',
    });

    return suggestions;
  }
}
