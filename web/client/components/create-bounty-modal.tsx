"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { formatUnits, parseEther } from "viem"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { useBountyMarketplace } from "@/contractsABI/contractHooks"
import { CreateBountyParams } from "@/contractsABI/contractTypes"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { IconPlus, IconLoader2, IconX } from "@tabler/icons-react"

const createBountySchema = z.object({
  githubIssueUrl: z.string().url("Please enter a valid GitHub issue URL"),
  repositoryUrl: z.string().url("Please enter a valid repository URL"), 
  description: z.string().min(10, "Description must be at least 10 characters"),
  rewardAmount: z.string().min(1, "Reward amount is required"),
  deadline: z.string().min(1, "Deadline is required"),
  requiredSkills: z.array(z.string()).min(1, "At least one skill is required"),
  difficultyLevel: z.string().min(1, "Difficulty level is required"),
})

type CreateBountyFormData = z.infer<typeof createBountySchema>

const skillOptions = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Solidity", 
  "Web3", "Smart Contracts", "Frontend", "Backend", "Full Stack", 
  "UI/UX", "Database", "DevOps", "Testing", "Documentation"
]

const difficultyLevels = [
  { value: "1", label: "Beginner", color: "bg-green-100 text-green-800" },
  { value: "2", label: "Intermediate", color: "bg-yellow-100 text-yellow-800" },
  { value: "3", label: "Advanced", color: "bg-orange-100 text-orange-800" },
  { value: "4", label: "Expert", color: "bg-red-100 text-red-800" },
]

interface CreateBountyModalProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function CreateBountyModal({ children, onSuccess }: CreateBountyModalProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([])
  const [isCreating, setIsCreating] = React.useState(false)
  const { address, isConnected } = useAccount()
  const { createBounty } = useBountyMarketplace()

  const form = useForm<CreateBountyFormData>({
    resolver: zodResolver(createBountySchema),
    defaultValues: {
      githubIssueUrl: "",
      repositoryUrl: "",
      description: "",
      rewardAmount: "",
      deadline: "",
      requiredSkills: [],
      difficultyLevel: "",
    },
  })

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      const newSkills = [...selectedSkills, skill]
      setSelectedSkills(newSkills)
      form.setValue("requiredSkills", newSkills)
    }
  }

  const removeSkill = (skill: string) => {
    const newSkills = selectedSkills.filter(s => s !== skill)
    setSelectedSkills(newSkills)
    form.setValue("requiredSkills", newSkills)
  }

  const onSubmit = async (data: CreateBountyFormData) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsCreating(true)
    try {
      // Calculate deadline timestamp (days from now)
      const deadlineDate = new Date()
      deadlineDate.setDate(deadlineDate.getDate() + parseInt(data.deadline))
      const deadlineTimestamp = BigInt(Math.floor(deadlineDate.getTime() / 1000))

      const createParams: CreateBountyParams = {
        githubIssueUrl: data.githubIssueUrl,
        repositoryUrl: data.repositoryUrl,
        description: data.description,
        deadline: deadlineTimestamp,
        requiredSkills: data.requiredSkills,
        difficultyLevel: BigInt(data.difficultyLevel),
      }

      const rewardAmount = parseEther(data.rewardAmount)

      await createBounty({
        ...createParams,
        reward: rewardAmount,
      })

      toast.success("Bounty created successfully!")
      form.reset()
      setSelectedSkills([])
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error creating bounty:", error)
      toast.error("Failed to create bounty. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconPlus className="w-5 h-5" />
            Create New Bounty
          </DialogTitle>
          <DialogDescription>
            Create a new bounty for developers to work on. Fill in all the details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="githubIssueUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Issue URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/user/repo/issues/123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="repositoryUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repository URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/user/repo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what needs to be done, requirements, and any specific details..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="rewardAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Amount (AVAX)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" placeholder="0.1" {...field} />
                    </FormControl>
                    <FormDescription>Amount in AVAX</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline (Days)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="7" {...field} />
                    </FormControl>
                    <FormDescription>Days from now</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficultyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {difficultyLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={level.color}>{level.label}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requiredSkills"
              render={() => (
                <FormItem>
                  <FormLabel>Required Skills</FormLabel>
                  <div className="space-y-3">
                    <Select onValueChange={addSkill}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add a skill..." />
                      </SelectTrigger>
                      <SelectContent>
                        {skillOptions.map((skill) => (
                          <SelectItem 
                            key={skill} 
                            value={skill}
                            disabled={selectedSkills.includes(skill)}
                          >
                            {skill}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedSkills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            <IconX 
                              className="w-3 h-3 cursor-pointer hover:text-red-500" 
                              onClick={() => removeSkill(skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormDescription>Select all skills required for this bounty</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !isConnected}>
                {isCreating ? (
                  <>
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <IconPlus className="w-4 h-4 mr-2" />
                    Create Bounty
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}