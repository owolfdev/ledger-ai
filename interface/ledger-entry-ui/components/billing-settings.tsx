"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCard, Download, ExternalLink, Check, Zap, Building2 } from "lucide-react"

interface Invoice {
  id: string
  date: string
  amount: number
  status: "paid" | "pending" | "failed"
  downloadUrl: string
}

const mockInvoices: Invoice[] = [
  {
    id: "INV-2024-001",
    date: "2024-01-01",
    amount: 29.0,
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "INV-2023-012",
    date: "2023-12-01",
    amount: 29.0,
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "INV-2023-011",
    date: "2023-11-01",
    amount: 29.0,
    status: "paid",
    downloadUrl: "#",
  },
]

const plans = [
  {
    name: "Starter",
    price: 9,
    features: ["Up to 100 transactions/month", "Basic reports", "Email support", "1 team member"],
    current: false,
  },
  {
    name: "Pro",
    price: 29,
    features: [
      "Up to 1,000 transactions/month",
      "Advanced reports",
      "Priority support",
      "5 team members",
      "API access",
      "Custom exports",
    ],
    current: true,
  },
  {
    name: "Enterprise",
    price: 99,
    features: [
      "Unlimited transactions",
      "Custom reports",
      "Dedicated support",
      "Unlimited team members",
      "Advanced API",
      "Custom integrations",
      "SSO",
    ],
    current: false,
  },
]

export function BillingSettings() {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const currentPlan = plans.find((plan) => plan.current)
  const currentUsage = 450 // Mock usage
  const usageLimit = 1000

  const handleManageSubscription = () => {
    // In real app, this would redirect to Stripe portal
    window.open("https://billing.stripe.com/session/example", "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Manage your subscription and billing details</p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{currentPlan?.name} Plan</h3>
              <p className="text-muted-foreground">${currentPlan?.price}/month</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleManageSubscription}>
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
              <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
                Cancel Plan
              </Button>
            </div>
          </div>

          {/* Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Transactions this month</span>
              <span>
                {currentUsage.toLocaleString()} / {usageLimit.toLocaleString()}
              </span>
            </div>
            <Progress value={(currentUsage / usageLimit) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {usageLimit - currentUsage} transactions remaining this billing cycle
            </p>
          </div>

          {/* Next Billing */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Next billing date</span>
            <span className="text-sm font-medium">February 1, 2024</span>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <p className="text-sm text-muted-foreground">Upgrade or downgrade your plan anytime</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-lg border p-6 ${
                  plan.current ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {plan.current && (
                  <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">Current Plan</Badge>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      {plan.name === "Starter" && <Zap className="h-5 w-5 text-blue-600" />}
                      {plan.name === "Pro" && <Check className="h-5 w-5 text-green-600" />}
                      {plan.name === "Enterprise" && <Building2 className="h-5 w-5 text-purple-600" />}
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className="w-full" variant={plan.current ? "outline" : "default"} disabled={plan.current}>
                    {plan.current ? "Current Plan" : plan.price > (currentPlan?.price || 0) ? "Upgrade" : "Downgrade"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Billing History</CardTitle>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View All Invoices
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                  <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === "paid"
                          ? "default"
                          : invoice.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Download className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll lose access to Pro features at the end of your
              current billing cycle.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={() => setShowCancelDialog(false)}>
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
