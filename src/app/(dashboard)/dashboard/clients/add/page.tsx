'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building2, 
  Users, 
  Phone, 
  CreditCard, 
  Calendar, 
  Shield, 
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Save
} from 'lucide-react'

// ThePayBureau Brand Colors
const colors = {
  primary: '#401D6C',
  secondary: '#EC385D',
  accent: '#FF8073',
  lightBg: '#F8F4FF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
}

interface ClientFormData {
  // Step 1: Company Information
  companyName: string
  companyNumber: string
  industry: string
  employeeCount: string
  address: {
    street: string
    city: string
    postcode: string
    country: string
  }
  
  // Step 2: Contacts
  primaryContact: {
    name: string
    role: string
    email: string
    phone: string
  }
  billingContact: {
    name: string
    role: string
    email: string
    phone: string
    sameAsPrimary: boolean
  }
  
  // Step 3: HMRC & Compliance
  payeReference: string
  accountsOfficeReference: string
  corporationTaxUTR: string
  pensionSchemeProvider: string
  autoEnrollmentDate: string
  
  // Step 4: Payroll Setup
  payrollFrequency: string
  payDay: string
  cutOffDate: string
  firstPayDate: string
  servicesRequired: string[]
  currentSoftware: string
  assignedConsultant: string
  
  // Step 5: Pricing & Contract
  contractType: string
  pricing: {
    monthlyRetainer: string
    perPayrollFee: string
    perEmployeeFee: string
  }
  paymentTerms: string
  goLiveDate: string
  notes: string
}

const initialFormData: ClientFormData = {
  companyName: '',
  companyNumber: '',
  industry: '',
  employeeCount: '',
  address: {
    street: '',
    city: '',
    postcode: '',
    country: 'United Kingdom'
  },
  primaryContact: {
    name: '',
    role: '',
    email: '',
    phone: ''
  },
  billingContact: {
    name: '',
    role: '',
    email: '',
    phone: '',
    sameAsPrimary: true
  },
  payeReference: '',
  accountsOfficeReference: '',
  corporationTaxUTR: '',
  pensionSchemeProvider: '',
  autoEnrollmentDate: '',
  payrollFrequency: '',
  payDay: '',
  cutOffDate: '',
  firstPayDate: '',
  servicesRequired: [],
  currentSoftware: '',
  assignedConsultant: '',
  contractType: '',
  pricing: {
    monthlyRetainer: '',
    perPayrollFee: '',
    perEmployeeFee: ''
  },
  paymentTerms: '',
  goLiveDate: '',
  notes: ''
}

const steps = [
  {
    id: 1,
    title: 'Company Information',
    icon: Building2,
    description: 'Basic company details and address'
  },
  {
    id: 2,
    title: 'Contact Details',
    icon: Users,
    description: 'Primary and billing contacts'
  },
  {
    id: 3,
    title: 'HMRC & Compliance',
    icon: Shield,
    description: 'Tax references and pension details'
  },
  {
    id: 4,
    title: 'Payroll Setup',
    icon: Calendar,
    description: 'Payroll frequency and services'
  },
  {
    id: 5,
    title: 'Pricing & Contract',
    icon: CreditCard,
    description: 'Pricing structure and terms'
  }
]

export default function AddClientWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ClientFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const progress = (currentStep / steps.length) * 100

  const updateFormData = (updates: Partial<ClientFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const updateNestedFormData = (section: keyof ClientFormData, updates: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Here you would submit to your API
      console.log('Submitting client data:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Client added successfully!')
      router.push('/dashboard/clients')
    } catch (error) {
      console.error('Error creating client:', error)
      alert('Error creating client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => updateFormData({ companyName: e.target.value })}
                  placeholder="ABC Company Ltd"
                  required
                />
              </div>
              <div>
                <Label htmlFor="companyNumber">Company Registration Number</Label>
                <Input
                  id="companyNumber"
                  value={formData.companyNumber}
                  onChange={(e) => updateFormData({ companyNumber: e.target.value })}
                  placeholder="12345678"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => updateFormData({ industry: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employeeCount">Number of Employees</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  value={formData.employeeCount}
                  onChange={(e) => updateFormData({ employeeCount: e.target.value })}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Address</h3>
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => updateNestedFormData('address', { street: e.target.value })}
                  placeholder="123 Business Street"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => updateNestedFormData('address', { city: e.target.value })}
                    placeholder="London"
                  />
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={formData.address.postcode}
                    onChange={(e) => updateNestedFormData('address', { postcode: e.target.value })}
                    placeholder="SW1A 1AA"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.address.country}
                    onChange={(e) => updateNestedFormData('address', { country: e.target.value })}
                    placeholder="United Kingdom"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Primary Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryName">Full Name *</Label>
                  <Input
                    id="primaryName"
                    value={formData.primaryContact.name}
                    onChange={(e) => updateNestedFormData('primaryContact', { name: e.target.value })}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="primaryRole">Job Title</Label>
                  <Input
                    id="primaryRole"
                    value={formData.primaryContact.role}
                    onChange={(e) => updateNestedFormData('primaryContact', { role: e.target.value })}
                    placeholder="Managing Director"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryEmail">Email Address *</Label>
                  <Input
                    id="primaryEmail"
                    type="email"
                    value={formData.primaryContact.email}
                    onChange={(e) => updateNestedFormData('primaryContact', { email: e.target.value })}
                    placeholder="john@company.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="primaryPhone">Phone Number</Label>
                  <Input
                    id="primaryPhone"
                    value={formData.primaryContact.phone}
                    onChange={(e) => updateNestedFormData('primaryContact', { phone: e.target.value })}
                    placeholder="+44 20 1234 5678"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sameAsPrimary"
                  checked={formData.billingContact.sameAsPrimary}
                  onChange={(e) => updateNestedFormData('billingContact', { sameAsPrimary: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="sameAsPrimary">Billing contact same as primary contact</Label>
              </div>

              {!formData.billingContact.sameAsPrimary && (
                <>
                  <h3 className="text-lg font-semibold">Billing Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingName">Full Name</Label>
                      <Input
                        id="billingName"
                        value={formData.billingContact.name}
                        onChange={(e) => updateNestedFormData('billingContact', { name: e.target.value })}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingRole">Job Title</Label>
                      <Input
                        id="billingRole"
                        value={formData.billingContact.role}
                        onChange={(e) => updateNestedFormData('billingContact', { role: e.target.value })}
                        placeholder="Finance Director"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingEmail">Email Address</Label>
                      <Input
                        id="billingEmail"
                        type="email"
                        value={formData.billingContact.email}
                        onChange={(e) => updateNestedFormData('billingContact', { email: e.target.value })}
                        placeholder="finance@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingPhone">Phone Number</Label>
                      <Input
                        id="billingPhone"
                        value={formData.billingContact.phone}
                        onChange={(e) => updateNestedFormData('billingContact', { phone: e.target.value })}
                        placeholder="+44 20 1234 5679"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payeReference">PAYE Reference *</Label>
                <Input
                  id="payeReference"
                  value={formData.payeReference}
                  onChange={(e) => updateFormData({ payeReference: e.target.value })}
                  placeholder="123/AB12345"
                  required
                />
              </div>
              <div>
                <Label htmlFor="accountsOfficeReference">Accounts Office Reference</Label>
                <Input
                  id="accountsOfficeReference"
                  value={formData.accountsOfficeReference}
                  onChange={(e) => updateFormData({ accountsOfficeReference: e.target.value })}
                  placeholder="123PA00012345"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="corporationTaxUTR">Corporation Tax UTR</Label>
              <Input
                id="corporationTaxUTR"
                value={formData.corporationTaxUTR}
                onChange={(e) => updateFormData({ corporationTaxUTR: e.target.value })}
                placeholder="1234567890"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pension Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pensionSchemeProvider">Pension Scheme Provider</Label>
                  <Select value={formData.pensionSchemeProvider} onValueChange={(value) => updateFormData({ pensionSchemeProvider: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nest">NEST</SelectItem>
                      <SelectItem value="now">NOW: Pensions</SelectItem>
                      <SelectItem value="peoples">The People's Pension</SelectItem>
                      <SelectItem value="aviva">Aviva</SelectItem>
                      <SelectItem value="aegon">Aegon</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="autoEnrollmentDate">Auto-enrollment Staging Date</Label>
                  <Input
                    id="autoEnrollmentDate"
                    type="date"
                    value={formData.autoEnrollmentDate}
                    onChange={(e) => updateFormData({ autoEnrollmentDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="payrollFrequency">Payroll Frequency *</Label>
                <Select value={formData.payrollFrequency} onValueChange={(value) => updateFormData({ payrollFrequency: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                    <SelectItem value="4-weekly">4-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payDay">Pay Day</Label>
                <Input
                  id="payDay"
                  value={formData.payDay}
                  onChange={(e) => updateFormData({ payDay: e.target.value })}
                  placeholder="Last working day"
                />
              </div>
              <div>
                <Label htmlFor="cutOffDate">Cut-off Date</Label>
                <Input
                  id="cutOffDate"
                  value={formData.cutOffDate}
                  onChange={(e) => updateFormData({ cutOffDate: e.target.value })}
                  placeholder="25th of month"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="firstPayDate">First Pay Date *</Label>
              <Input
                id="firstPayDate"
                type="date"
                value={formData.firstPayDate}
                onChange={(e) => updateFormData({ firstPayDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Services Required</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Payroll Processing',
                  'Auto Enrollment',
                  'Year End Returns',
                  'CIS Returns',
                  'RTI Submissions',
                  'P60/P45 Generation'
                ].map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={service}
                      checked={formData.servicesRequired.includes(service)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFormData({ servicesRequired: [...formData.servicesRequired, service] })
                        } else {
                          updateFormData({ servicesRequired: formData.servicesRequired.filter(s => s !== service) })
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={service} className="text-sm">{service}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentSoftware">Current Payroll Software</Label>
                <Input
                  id="currentSoftware"
                  value={formData.currentSoftware}
                  onChange={(e) => updateFormData({ currentSoftware: e.target.value })}
                  placeholder="SAGE, QuickBooks, etc."
                />
              </div>
              <div>
                <Label htmlFor="assignedConsultant">Assigned Consultant</Label>
                <Select value={formData.assignedConsultant} onValueChange={(value) => updateFormData({ assignedConsultant: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select consultant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarah">Sarah Johnson</SelectItem>
                    <SelectItem value="michael">Michael Chen</SelectItem>
                    <SelectItem value="david">David Wilson</SelectItem>
                    <SelectItem value="emma">Emma Thompson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="contractType">Contract Type *</Label>
              <Select value={formData.contractType} onValueChange={(value) => updateFormData({ contractType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly-retainer">Monthly Retainer</SelectItem>
                  <SelectItem value="per-payroll">Per Payroll</SelectItem>
                  <SelectItem value="per-employee">Per Employee</SelectItem>
                  <SelectItem value="hybrid">Hybrid Model</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="monthlyRetainer">Monthly Retainer (£)</Label>
                  <Input
                    id="monthlyRetainer"
                    type="number"
                    value={formData.pricing.monthlyRetainer}
                    onChange={(e) => updateNestedFormData('pricing', { monthlyRetainer: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label htmlFor="perPayrollFee">Per Payroll Fee (£)</Label>
                  <Input
                    id="perPayrollFee"
                    type="number"
                    value={formData.pricing.perPayrollFee}
                    onChange={(e) => updateNestedFormData('pricing', { perPayrollFee: e.target.value })}
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label htmlFor="perEmployeeFee">Per Employee Fee (£)</Label>
                  <Input
                    id="perEmployeeFee"
                    type="number"
                    value={formData.pricing.perEmployeeFee}
                    onChange={(e) => updateNestedFormData('pricing', { perEmployeeFee: e.target.value })}
                    placeholder="5.50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={formData.paymentTerms} onValueChange={(value) => updateFormData({ paymentTerms: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net-7">Net 7 days</SelectItem>
                    <SelectItem value="net-14">Net 14 days</SelectItem>
                    <SelectItem value="net-30">Net 30 days</SelectItem>
                    <SelectItem value="direct-debit">Direct Debit</SelectItem>
                    <SelectItem value="advance">Payment in Advance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="goLiveDate">Go-Live Date</Label>
                <Input
                  id="goLiveDate"
                  type="date"
                  value={formData.goLiveDate}
                  onChange={(e) => updateFormData({ goLiveDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                placeholder="Any additional information or special requirements..."
                rows={4}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.lightBg }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b-2" style={{ borderColor: colors.primary }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
              >
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
                <p className="text-gray-600">Complete all steps to onboard your new client</p>
              </div>
            </div>
            
            <Button 
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: colors.primary }}
            />
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="flex justify-between mb-8 overflow-x-auto">
          {steps.map((step) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep
            
            return (
              <div key={step.id} className="flex flex-col items-center min-w-0 flex-1">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                    isActive 
                      ? 'text-white shadow-lg' 
                      : isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  style={{
                    backgroundColor: isActive ? colors.primary : undefined
                  }}
                >
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <div className="text-center">
                  <div className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 hidden md:block">
                    {step.description}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5 mr-2", style: { color: colors.primary } })}
              {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button 
              onClick={nextStep}
              className="text-white"
              style={{ backgroundColor: colors.primary }}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="text-white"
              style={{ backgroundColor: colors.success }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Client...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Client
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}