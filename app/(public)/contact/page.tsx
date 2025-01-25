'use client'

import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const ContactPageContent = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-4xl font-bold">Contact Us</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="How can we help you?"
                  className="min-h-[150px]"
                />
              </div>
              
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Other Ways to Reach Us</CardTitle>
            <CardDescription>
              Choose the method that works best for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-muted-foreground">support@autocrm.com</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Phone</h3>
              <p className="text-muted-foreground">+1 (555) 123-4567</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Office Hours</h3>
              <p className="text-muted-foreground">
                Monday - Friday<br />
                9:00 AM - 5:00 PM EST
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Export with SSR disabled to prevent prerendering
export default dynamic(() => Promise.resolve(ContactPageContent), {
  ssr: false
}) 