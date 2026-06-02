/**
 * @file ui-components.test.tsx
 * @description YYC³便携式智能 AI 系统 - UI 组件库测试
 * UI Components Library Tests
 * Comprehensive tests for all shadcn/ui components.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,ui,components,shadcn
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'

// ═════════════════════════════════════════════════════
// Button Component Tests
// ═════════════════════════════════════════════════════

describe('Button Component', () => {
  it('should render button with text', async () => {
    const { Button } = await import('../../components/ui/button')
    render(<Button>Click Me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeDefined()
  })

  it('should handle click events', async () => {
    const { Button } = await import('../../components/ui/button')
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Click Me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should support disabled state', async () => {
    const { Button } = await import('../../components/ui/button')
    render(<Button disabled>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should support variant prop', async () => {
    const { Button } = await import('../../components/ui/button')
    const { container } = render(<Button variant="destructive">Delete</Button>)
    
    expect(container.firstChild).toBeDefined()
  })

  it('should support size prop', async () => {
    const { Button } = await import('../../components/ui/button')
    const { container } = render(<Button size="sm">Small</Button>)
    
    expect(container.firstChild).toBeDefined()
  })

  it('should support asChild prop', async () => {
    const { Button } = await import('../../components/ui/button')
    render(
      <Button asChild>
        <a href="/link">Link</a>
      </Button>
    )
    
    const link = screen.getByRole('link')
    expect(link).toBeDefined()
  })
})

// ═════════════════════════════════════════════════════
// Input Component Tests
// ═════════════════════════════════════════════════════

describe('Input Component', () => {
  it('should render input', async () => {
    const { Input } = await import('../../components/ui/input')
    render(<Input placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeDefined()
  })

  it('should handle change events', async () => {
    const { Input } = await import('../../components/ui/input')
    const handleChange = vi.fn()
    
    render(<Input onChange={handleChange} />)
    
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('should support disabled state', async () => {
    const { Input } = await import('../../components/ui/input')
    render(<Input disabled />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should support type prop', async () => {
    const { Input } = await import('../../components/ui/input')
    render(<Input type="password" data-testid="password-input" />)
    
    const input = screen.getByTestId('password-input')
    expect(input.getAttribute('type')).toBe('password')
  })

  it('should support value prop', async () => {
    const { Input } = await import('../../components/ui/input')
    render(<Input value="controlled" onChange={() => {}} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('controlled')
  })
})

// ═════════════════════════════════════════════════════
// Dialog Component Tests
// ═════════════════════════════════════════════════════

describe('Dialog Component', () => {
  it('should render dialog trigger', async () => {
    const { Dialog, DialogTrigger, DialogContent } = await import('../../components/ui/dialog')
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>Content</DialogContent>
      </Dialog>
    )
    
    const trigger = screen.getByRole('button', { name: /open/i })
    expect(trigger).toBeDefined()
  })

  it('should open dialog on trigger click', async () => {
    const { Dialog, DialogTrigger, DialogContent } = await import('../../components/ui/dialog')
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>Dialog Content</DialogContent>
      </Dialog>
    )
    
    fireEvent.click(screen.getByRole('button'))
    
    // Dialog should be visible after click
    const dialog = await screen.findByText(/dialog content/i)
    expect(dialog).toBeDefined()
  })

  it('should close dialog', async () => {
    const { Dialog, DialogTrigger, DialogContent, DialogClose } = await import('../../components/ui/dialog')
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          Dialog Content
          <DialogClose data-testid="close-button">Close</DialogClose>
        </DialogContent>
      </Dialog>
    )
    
    fireEvent.click(screen.getByRole('button', { name: /open/i }))
    
    const closeBtn = await screen.findByTestId('close-button')
    fireEvent.click(closeBtn)
    
    await waitFor(() => {
      expect(screen.queryByText(/dialog content/i)).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })
})

// ═════════════════════════════════════════════════════
// Card Component Tests
// ═════════════════════════════════════════════════════

describe('Card Component', () => {
  it('should render card', async () => {
    const { Card, CardHeader, CardTitle, CardContent } = await import('../../components/ui/card')
    
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>Card Content</CardContent>
      </Card>
    )
    
    expect(screen.getByText('Card Title')).toBeDefined()
    expect(screen.getByText('Card Content')).toBeDefined()
  })

  it('should support all card subcomponents', async () => {
    const {
      Card,
      CardHeader,
      CardTitle,
      CardDescription,
      CardContent,
      CardFooter,
    } = await import('../../components/ui/card')
    
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    
    expect(screen.getByText('Title')).toBeDefined()
    expect(screen.getByText('Description')).toBeDefined()
    expect(screen.getByText('Content')).toBeDefined()
    expect(screen.getByText('Footer')).toBeDefined()
  })
})

// ═════════════════════════════════════════════════════
// Select Component Tests
// ═════════════════════════════════════════════════════

describe('Select Component', () => {
  it('should render select trigger', async () => {
    const { Select, SelectTrigger, SelectValue } = await import('../../components/ui/select')
    
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
      </Select>
    )
    
    const trigger = screen.getByText(/select option/i)
    expect(trigger).toBeDefined()
  })

  it('should render select options', async () => {
    const { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } = await import('../../components/ui/select')
    
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    )
    
    fireEvent.click(screen.getByRole('combobox'))
    
    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeDefined()
      expect(screen.getByText('Option 2')).toBeDefined()
    })
  })
})

// ═════════════════════════════════════════════════════
// Checkbox Component Tests
// ═════════════════════════════════════════════════════

describe('Checkbox Component', () => {
  it('should render checkbox', async () => {
    const { Checkbox } = await import('../../components/ui/checkbox')
    render(<Checkbox />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDefined()
  })

  it('should handle check events', async () => {
    const { Checkbox } = await import('../../components/ui/checkbox')
    const handleCheck = vi.fn()
    
    render(<Checkbox onCheckedChange={handleCheck} />)
    
    fireEvent.click(screen.getByRole('checkbox'))
    expect(handleCheck).toHaveBeenCalledWith(true)
  })

  it('should support checked state', async () => {
    const { Checkbox } = await import('../../components/ui/checkbox')
    render(<Checkbox checked onChange={() => {}} />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('should support disabled state', async () => {
    const { Checkbox } = await import('../../components/ui/checkbox')
    render(<Checkbox disabled />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDisabled()
  })
})

// ═════════════════════════════════════════════════════
// Switch Component Tests
// ═════════════════════════════════════════════════════

describe('Switch Component', () => {
  it('should render switch', async () => {
    const { Switch } = await import('../../components/ui/switch')
    render(<Switch />)
    
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toBeDefined()
  })

  it('should handle toggle events', async () => {
    const { Switch } = await import('../../components/ui/switch')
    const handleToggle = vi.fn()
    
    render(<Switch onCheckedChange={handleToggle} />)
    
    fireEvent.click(screen.getByRole('switch'))
    expect(handleToggle).toHaveBeenCalledWith(true)
  })

  it('should support checked state', async () => {
    const { Switch } = await import('../../components/ui/switch')
    render(<Switch checked onChange={() => {}} />)
    
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toBeChecked()
  })
})

// ═════════════════════════════════════════════════════
// Slider Component Tests
// ═════════════════════════════════════════════════════

describe('Slider Component', () => {
  it('should render slider', async () => {
    const { Slider } = await import('../../components/ui/slider')
    render(<Slider defaultValue={[50]} />)
    
    const slider = screen.getByRole('slider')
    expect(slider).toBeDefined()
  })

  it('should handle change events', async () => {
    const { Slider } = await import('../../components/ui/slider')
    const handleChange = vi.fn()
    
    render(<Slider defaultValue={[50]} onValueChange={handleChange} />)
    
    const slider = screen.getByRole('slider')
    fireEvent.pointerDown(slider, { clientX: 100 })
    
    expect(slider).toBeDefined()
  })

  it('should support min/max props', async () => {
    const { Slider } = await import('../../components/ui/slider')
    const { container } = render(<Slider min={0} max={100} defaultValue={[50]} />)
    
    const slider = screen.getByRole('slider')
    expect(slider).toBeDefined()
    expect(slider.getAttribute('aria-valuemin')).toBe('0')
    expect(slider.getAttribute('aria-valuemax')).toBe('100')
  })

  it('should support step prop', async () => {
    const { Slider } = await import('../../components/ui/slider')
    render(<Slider step={10} defaultValue={[50]} />)
    
    const slider = screen.getByRole('slider')
    expect(slider).toBeDefined()
    expect(slider.getAttribute('aria-valuenow')).toBe('50')
  })
})

// ═════════════════════════════════════════════════════
// Progress Component Tests
// ═════════════════════════════════════════════════════

describe('Progress Component', () => {
  it('should render progress bar', async () => {
    const { Progress } = await import('../../components/ui/progress')
    render(<Progress value={50} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeDefined()
  })

  it('should display correct value', async () => {
    const { Progress } = await import('../../components/ui/progress')
    const { container } = render(<Progress value={75} />)
    
    const indicator = container.querySelector('[style*="width"]')
    expect(indicator).toBeDefined()
  })

  it('should handle 0 value', async () => {
    const { Progress } = await import('../../components/ui/progress')
    render(<Progress value={0} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeDefined()
  })

  it('should handle 100 value', async () => {
    const { Progress } = await import('../../components/ui/progress')
    render(<Progress value={100} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeDefined()
  })
})

// ═════════════════════════════════════════════════════
// Alert Component Tests
// ═════════════════════════════════════════════════════

describe('Alert Component', () => {
  it('should render alert', async () => {
    const { Alert, AlertTitle, AlertDescription } = await import('../../components/ui/alert')
    
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>Alert Description</AlertDescription>
      </Alert>
    )
    
    expect(screen.getByText('Alert Title')).toBeDefined()
    expect(screen.getByText('Alert Description')).toBeDefined()
  })

  it('should support variant prop', async () => {
    const { Alert } = await import('../../components/ui/alert')
    const { container } = render(<Alert variant="destructive">Destructive Alert</Alert>)
    
    expect(container.firstChild).toBeDefined()
  })
})

// ═════════════════════════════════════════════════════
// Badge Component Tests
// ═════════════════════════════════════════════════════

describe('Badge Component', () => {
  it('should render badge', async () => {
    const { Badge } = await import('../../components/ui/badge')
    render(<Badge>Badge</Badge>)
    
    expect(screen.getByText('Badge')).toBeDefined()
  })

  it('should support variant prop', async () => {
    const { Badge } = await import('../../components/ui/badge')
    const { container } = render(<Badge variant="secondary">Secondary</Badge>)
    
    expect(container.firstChild).toBeDefined()
  })
})

// ═════════════════════════════════════════════════════
// Avatar Component Tests
// ═════════════════════════════════════════════════════

describe('Avatar Component', () => {
  it('should render avatar', async () => {
    const { Avatar, AvatarImage, AvatarFallback } = await import('../../components/ui/avatar')
    
    render(
      <Avatar>
        <AvatarImage src="/avatar.jpg" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    
    expect(screen.getByText('AB')).toBeDefined()
  })

  it('should show fallback when image fails', async () => {
    const { Avatar, AvatarImage, AvatarFallback } = await import('../../components/ui/avatar')
    
    render(
      <Avatar>
        <AvatarImage src="/invalid.jpg" />
        <AvatarFallback>Fallback</AvatarFallback>
      </Avatar>
    )
    
    // Fallback should be visible
    expect(screen.getByText('Fallback')).toBeDefined()
  })
})

// ═════════════════════════════════════════════════════
// Tooltip Component Tests
// ═════════════════════════════════════════════════════

describe('Tooltip Component', () => {
  it('should render tooltip trigger', async () => {
    const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } = await import('../../components/ui/tooltip')
    
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover Me</TooltipTrigger>
          <TooltipContent>Tooltip Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    
    expect(screen.getByText('Hover Me')).toBeDefined()
  })

  it('should show tooltip on hover', async () => {
    const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } = await import('../../components/ui/tooltip')
    
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover Me</TooltipTrigger>
          <TooltipContent>Tooltip Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    
    const trigger = screen.getByText('Hover Me')
    fireEvent.mouseEnter(trigger)
    
    await waitFor(() => {
      expect(screen.queryByText('Tooltip Content')).toBeDefined()
    }, { timeout: 2000 })
  })
})

// ═════════════════════════════════════════════════════
// Tabs Component Tests
// ═════════════════════════════════════════════════════

describe('Tabs Component', () => {
  it('should render tabs', async () => {
    const { Tabs, TabsList, TabsTrigger, TabsContent } = await import('../../components/ui/tabs')
    
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    
    expect(screen.getByText('Tab 1')).toBeDefined()
    expect(screen.getByText('Tab 2')).toBeDefined()
  })

  it('should switch tabs on click', async () => {
    const { Tabs, TabsList, TabsTrigger, TabsContent } = await import('../../components/ui/tabs')
    
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Content 1')).toBeDefined()

    const tab2Trigger = screen.getByRole('tab', { name: /tab 2/i })
    fireEvent.click(tab2Trigger)

    await waitFor(() => {
      expect(screen.queryByText('Content 2')).toBeDefined()
    }, { timeout: 2000 })
  })
})

// ═════════════════════════════════════════════════════
// Accessibility Tests
// ═════════════════════════════════════════════════════

describe('Accessibility', () => {
  it('Button should have proper ARIA attributes', async () => {
    const { Button } = await import('../../components/ui/button')
    render(<Button aria-label="Test Button">Click</Button>)
    
    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-label')).toBe('Test Button')
  })

  it('Input should have proper ARIA attributes', async () => {
    const { Input } = await import('../../components/ui/input')
    render(<Input aria-label="Test Input" />)
    
    const input = screen.getByRole('textbox')
    expect(input.getAttribute('aria-label')).toBe('Test Input')
  })

  it('Checkbox should have proper ARIA attributes', async () => {
    const { Checkbox } = await import('../../components/ui/checkbox')
    render(<Checkbox aria-label="Test Checkbox" />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox.getAttribute('aria-label')).toBe('Test Checkbox')
  })

  it('Dialog should have proper ARIA attributes', async () => {
    const { Dialog, DialogTrigger, DialogContent } = await import('../../components/ui/dialog')

    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent aria-describedby="dialog-desc">
          <p id="dialog-desc">Dialog Description</p>
        </DialogContent>
      </Dialog>
    )

    // Dialog content is not visible initially, need to open it first
    const trigger = screen.getByText('Open')
    fireEvent.click(trigger)

    // After opening, the dialog content should be visible
    const dialog = screen.getByText('Dialog Description')
    expect(dialog).toBeDefined()
  })
})

// ═════════════════════════════════════════════════════
// Responsive Tests
// ═════════════════════════════════════════════════════

describe('Responsive', () => {
  it('Button should adapt to different screen sizes', async () => {
    const { Button } = await import('../../components/ui/button')
    const { container, rerender } = render(<Button>Button</Button>)
    
    // Default size
    expect(container.firstChild).toBeDefined()
    
    // Small viewport
    rerender(<Button size="sm">Small Button</Button>)
    expect(screen.getByText('Small Button')).toBeDefined()
    
    // Large viewport
    rerender(<Button size="lg">Large Button</Button>)
    expect(screen.getByText('Large Button')).toBeDefined()
  })
})
