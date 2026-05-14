'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Phone,
  Mail,
  Send,
  ArrowLeft,
} from 'lucide-react'
import { AuroraCanvas } from '@/components/aurora-canvas'
import { LandingNav } from '@/components/landing-nav'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    restaurantName: '',
    restaurantType: '',
    message: '',
    inquiryType: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          phone: '',
          restaurantName: '',
          restaurantType: '',
          message: '',
          inquiryType: '',
        })
      } else {
        const error = await response.json()
        setSubmitStatus('error')
        setErrorMessage(error.message || 'Failed to send message')
      }
    } catch {
      setSubmitStatus('error')
      setErrorMessage('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="relative min-h-screen overflow-x-hidden text-black font-sf-pro antialiased selection:bg-black selection:text-white">
        <AuroraCanvas />
        <LandingNav />

        <main className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-5 py-16 sm:px-8">
          <div className="glass-surface reveal relative mx-auto flex w-full max-w-md flex-col items-center overflow-hidden rounded-[28px] px-7 py-12 text-center sm:px-10 sm:py-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-1/3 left-1/2 h-[320px] w-[480px] -translate-x-1/2 rounded-full opacity-80 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, oklch(0.88 0.14 35 / 0.5) 0%, transparent 65%)',
              }}
            />
            <div className="pill-glass relative grid h-16 w-16 place-items-center rounded-full">
              <CheckCircle2 className="h-8 w-8 text-black" strokeWidth={1.75} />
            </div>
            <h2
              className="relative mt-6 font-bold tracking-[-0.025em] leading-[1.1] text-black"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)' }}
            >
              Message sent.
            </h2>
            <p className="relative mt-3 max-w-sm text-balance text-base font-normal leading-[1.5] text-black">
              Thanks for reaching out — we&apos;ll get back to you within 24 hours.
            </p>
            <div className="relative mt-7 flex w-full flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="pill-primary inline-flex h-11 flex-1 items-center justify-center rounded-full px-5 text-[14px] font-medium text-white transition-all duration-200 active:scale-[0.97] sm:text-[15px]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to home
              </Link>
              <button
                type="button"
                onClick={() => setSubmitStatus('idle')}
                className="pill-glass inline-flex h-11 flex-1 items-center justify-center rounded-full px-5 text-[14px] font-medium text-black transition-all duration-200 active:scale-[0.97] sm:text-[15px]"
              >
                Send another
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-black font-sf-pro antialiased selection:bg-black selection:text-white">
      <AuroraCanvas />
      <LandingNav />

      <main className="pb-20 sm:pb-24 md:pb-28">
        {/* Hero */}
        <section className="px-5 pt-10 sm:px-8 sm:pt-14 md:pt-20 lg:pt-24">
          <div className="mx-auto flex max-w-[1100px] flex-col items-center text-center">
            <span className="reveal pill-glass inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black sm:text-[12px]">
              Get in touch
            </span>
            <h1
              className="reveal mt-5 text-balance font-bold tracking-[-0.04em] leading-[1.02] text-black"
              style={{ fontSize: 'clamp(2.125rem, 6.4vw, 4.5rem)' }}
            >
              Let&apos;s build it together.
            </h1>
            <p className="reveal mt-4 max-w-xl text-balance text-base font-normal leading-[1.45] text-black sm:mt-5 sm:text-lg md:text-xl">
              Ready to transform your restaurant? Drop us a line and we&apos;ll help you get started — typically within 24 hours.
            </p>
          </div>
        </section>

        {/* Quick contact options */}
        <section className="px-5 pt-10 sm:px-8 sm:pt-14 md:pt-16">
          <div className="mx-auto grid max-w-[920px] gap-4 sm:grid-cols-2 sm:gap-5">
            <article className="feature-card reveal flex flex-col items-center rounded-[24px] p-6 text-center sm:rounded-[28px] sm:p-7">
              <div className="pill-glass grid h-12 w-12 place-items-center rounded-full">
                <Phone className="h-5 w-5 text-black" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 font-semibold tracking-tight text-black sm:text-lg">
                Call us directly
              </h3>
              <p className="mt-1.5 text-sm font-normal text-black sm:text-[15px]">
                Speak with our team during business hours.
              </p>
              <a
                href="tel:+639052367934"
                className="pill-primary mt-5 inline-flex h-10 items-center justify-center rounded-full px-5 text-[14px] font-medium text-white transition-all duration-200 active:scale-[0.97]"
              >
                <Phone className="mr-2 h-4 w-4" />
                +63 905 236 7934
              </a>
            </article>

            <article className="feature-card reveal flex flex-col items-center rounded-[24px] p-6 text-center sm:rounded-[28px] sm:p-7">
              <div className="pill-glass grid h-12 w-12 place-items-center rounded-full">
                <Mail className="h-5 w-5 text-black" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 font-semibold tracking-tight text-black sm:text-lg">
                Send a message
              </h3>
              <p className="mt-1.5 text-sm font-normal text-black sm:text-[15px]">
                We respond within 24 hours.
              </p>
              <a
                href="mailto:john@nolastudios.net"
                className="pill-glass mt-5 inline-flex h-10 items-center justify-center rounded-full px-5 text-[14px] font-medium text-black transition-all duration-200 active:scale-[0.97]"
              >
                john@nolastudios.net
              </a>
            </article>
          </div>
        </section>

        {/* Contact form */}
        <section className="px-5 pt-10 sm:px-8 sm:pt-14 md:pt-16">
          <div className="mx-auto max-w-[920px]">
            <div className="glass-surface reveal relative overflow-hidden rounded-[24px] p-6 sm:rounded-[28px] sm:p-8 md:p-10">
              <header className="mb-7 sm:mb-8">
                <h2
                  className="font-bold tracking-[-0.025em] leading-[1.1] text-black"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
                >
                  Tell us about your restaurant
                </h2>
                <p className="mt-2 text-sm font-normal text-black sm:text-base">
                  Fill out the form below and we&apos;ll be in touch within 24 hours.
                </p>
              </header>

              {submitStatus === 'error' && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-black">
                      Your name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="John Smith"
                      className="h-11 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-black">
                      Email address *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="john@restaurant.com"
                      className="h-11 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-black">
                      Phone number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="h-11 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inquiryType" className="text-sm font-medium text-black">
                      Inquiry type *
                    </Label>
                    <Select
                      value={formData.inquiryType}
                      onValueChange={handleSelectChange('inquiryType')}
                      required
                    >
                      <SelectTrigger id="inquiryType" className="!h-11 bg-white">
                        <SelectValue placeholder="What brings you here?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free-trial">Start free trial</SelectItem>
                        <SelectItem value="demo">Request demo</SelectItem>
                        <SelectItem value="pricing">Pricing information</SelectItem>
                        <SelectItem value="features">Feature questions</SelectItem>
                        <SelectItem value="support">Technical support</SelectItem>
                        <SelectItem value="partnership">Partnership inquiry</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="restaurantName" className="text-sm font-medium text-black">
                      Restaurant name
                    </Label>
                    <Input
                      id="restaurantName"
                      name="restaurantName"
                      value={formData.restaurantName}
                      onChange={handleInputChange}
                      placeholder="Amazing Bistro"
                      className="h-11 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restaurantType" className="text-sm font-medium text-black">
                      Restaurant type
                    </Label>
                    <Select
                      value={formData.restaurantType}
                      onValueChange={handleSelectChange('restaurantType')}
                    >
                      <SelectTrigger id="restaurantType" className="!h-11 bg-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast-casual">Fast casual</SelectItem>
                        <SelectItem value="fine-dining">Fine dining</SelectItem>
                        <SelectItem value="cafe">Cafe / coffee shop</SelectItem>
                        <SelectItem value="bar">Bar / pub</SelectItem>
                        <SelectItem value="food-truck">Food truck</SelectItem>
                        <SelectItem value="chain">Restaurant chain</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium text-black">
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    placeholder="Tell us about your restaurant, number of tables, current challenges, or any specific questions you have about QRder..."
                    className="bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="pill-primary inline-flex h-12 w-full items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                      Sending…
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="mr-2 h-4 w-4" />
                      Send message
                    </span>
                  )}
                </button>

                <p className="text-center text-xs text-black">
                  We&apos;ll never spam you. Unsubscribe any time.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
