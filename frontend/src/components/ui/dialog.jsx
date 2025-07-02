import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const Dialog = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  >
    {children}
  </div>
))
Dialog.displayName = "Dialog"

const DialogTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
DialogTrigger.displayName = "DialogTrigger"

const DialogContent = React.forwardRef(({ className, children, onClose, ...props }, ref) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Backdrop */}
    <div 
      className="fixed inset-0 bg-black/50 cursor-pointer"
      onClick={onClose}
    />
    
    {/* Dialog */}
    <div
      ref={ref}
      className={cn(
        "relative bg-background border rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto",
        className
      )}
      {...props}
    >
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
      {children}
    </div>
  </div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0", className)}
    {...props}
  />
))
DialogHeader.displayName = "DialogHeader"

const DialogFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0", className)}
    {...props}
  />
))
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
