'use client'

import { useState } from 'react'
import { 
  Building, 
  Calculator, 
  Menu as MenuIcon, 
  UserCheck, 
  Warehouse,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  completed: boolean
  required: boolean
  details: string[]
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'setup-branch',
    title: 'تعریف شعبه/صندوق',
    description: 'تنظیم اطلاعات اصلی رستوران و صندوق‌ها',
    icon: Building,
    completed: false,
    required: true,
    details: [
      'نام و آدرس رستوران',
      'شماره تلفن و ایمیل',
      'تعریف صندوق‌های مختلف',
      'تنظیم ساعت کاری',
      'انتخاب واحد پول'
    ]
  },
  {
    id: 'tax-settings',
    title: 'مالیات/کارمزد',
    description: 'تنظیم نرخ‌های مالیات و کارمزد',
    icon: Calculator,
    completed: false,
    required: true,
    details: [
      'نرخ مالیات بر ارزش افزوده',
      'کارمزد درگاه پرداخت',
      'مالیات بر درآمد',
      'سایر عوارض و مالیات‌ها'
    ]
  },
  {
    id: 'menu-setup',
    title: 'کالا/منو',
    description: 'تعریف آیتم‌های منو و کالاها',
    icon: MenuIcon,
    completed: false,
    required: true,
    details: [
      'دسته‌بندی غذاها',
      'تعریف قیمت‌ها',
      'تنظیم موجودی',
      'افزودن تصاویر',
      'تنظیم دستور پخت'
    ]
  },
  {
    id: 'people-setup',
    title: 'اشخاص',
    description: 'تعریف مشتریان و تامین‌کنندگان',
    icon: UserCheck,
    completed: false,
    required: true,
    details: [
      'اطلاعات مشتریان',
      'تامین‌کنندگان مواد اولیه',
      'کارکنان رستوران',
      'تنظیم سطح دسترسی'
    ]
  },
  {
    id: 'initial-inventory',
    title: 'موجودی اولیه',
    description: 'ثبت موجودی اولیه انبار',
    icon: Warehouse,
    completed: false,
    required: true,
    details: [
      'مواد اولیه موجود',
      'ظروف و تجهیزات',
      'موجودی نقدی',
      'تنظیم حداقل موجودی'
    ]
  }
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState(onboardingSteps)

  const toggleStepCompletion = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: !step.completed } : step
    ))
  }

  const completedSteps = steps.filter(step => step.completed).length
  const requiredSteps = steps.filter(step => step.required).length
  const progress = (completedSteps / requiredSteps) * 100

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const CurrentIcon = steps[currentStep].icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">راه‌اندازی رستوران</h1>
          <p className="text-gray-600 dark:text-gray-300">چک‌لیست گام‌به‌گام برای راه‌اندازی رستوران جدید</p>
        </div>

        {/* Progress Bar */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">پیشرفت راه‌اندازی</h2>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {completedSteps} از {requiredSteps} مرحله تکمیل شده
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Current Step */}
        <div className="premium-card p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl ml-4">
              <CurrentIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {steps[currentStep].title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {steps[currentStep].description}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">جزئیات مورد نیاز:</h4>
            <ul className="space-y-2">
              {steps[currentStep].details.map((detail, index) => (
                <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                  {detail}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleStepCompletion(steps[currentStep].id)}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                steps[currentStep].completed
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {steps[currentStep].completed ? (
                <>
                  <CheckCircle className="w-5 h-5 ml-2" />
                  تکمیل شده
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 ml-2" />
                  شروع کنید
                </>
              )}
            </button>

            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                قبلی
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
                className="flex items-center px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                بعدی
                <ArrowRight className="w-4 h-4 mr-2" />
              </button>
            </div>
          </div>
        </div>

        {/* All Steps Overview */}
        <div className="premium-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">نمای کلی مراحل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                  index === currentStep
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : step.completed
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <div className="flex items-center mb-2">
                  <step.icon className={`w-5 h-5 ml-2 ${
                    step.completed ? 'text-green-600' : index === currentStep ? 'text-primary-600' : 'text-gray-500'
                  }`} />
                  <span className={`font-medium ${
                    step.completed ? 'text-green-800 dark:text-green-300' : 
                    index === currentStep ? 'text-primary-800 dark:text-primary-300' : 
                    'text-gray-700 dark:text-gray-300'
                  }`}>
                    {step.title}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {step.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    step.completed
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {step.completed ? 'تکمیل شده' : 'در انتظار'}
                  </span>
                  {step.required && (
                    <span className="text-xs text-red-600 dark:text-red-400">ضروری</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}