"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, MoreHorizontal, Mail, Crown, Shield, User, Trash2 } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "user"
  status: "active" | "pending" | "suspended"
  joinedAt: string
  lastActive: string
}

const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@acme.com",
    role: "owner",
    status: "active",
    joinedAt: "2024-01-01",
    lastActive: "2 hours ago",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@acme.com",
    role: "admin",
    status: "active",
    joinedAt: "2024-01-15",
    lastActive: "1 day ago",
  },
  {
    id: "3",
    name: "Bob Wilson",
    email: "bob@acme.com",
    role: "user",
    status: "pending",
    joinedAt: "2024-01-20",
    lastActive: "Never",
  },
]

const roleIcons = {
  owner: Crown,
  admin: Shield,
  user: User,
}

const roleColors = {
  owner: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  user: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
}

export function TeamSettings() {
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "user">("user")
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const handleInviteMember = () => {
    if (inviteEmail) {
      const newMember: TeamMember = {
        id: Math.random().toString(36).substr(2, 9),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        status: "pending",
        joinedAt: new Date().toISOString().split("T")[0],
        lastActive: "Never",
      }
      setMembers([...members, newMember])
      setInviteEmail("")
      setInviteRole("user")
      setShowInviteDialog(false)
    }
  }

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((member) => member.id !== memberId))
  }

  const handleRoleChange = (memberId: string, newRole: TeamMember["role"]) => {
    setMembers(members.map((member) => (member.id === memberId ? { ...member, role: newRole } : member)))
  }

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Manage your team members and their access levels</p>
            </div>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>Send an invitation to join your Ledger AI workspace.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select value={inviteRole} onValueChange={(value: "admin" | "user") => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin - Full access except billing</SelectItem>
                        <SelectItem value="user">User - View and create entries</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteMember} disabled={!inviteEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role]
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/diverse-user-avatars.png`} alt={member.name} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[member.role]}>
                        <RoleIcon className="mr-1 h-3 w-3" />
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.lastActive}</TableCell>
                    <TableCell>
                      {member.role !== "owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, "admin")}>
                              Change to Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, "user")}>
                              Change to User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Owner</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full access to all features</li>
                <li>• Manage billing and subscription</li>
                <li>• Add/remove team members</li>
                <li>• Export/import data</li>
                <li>• Manage API keys</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Admin</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create and edit entries</li>
                <li>• View all reports</li>
                <li>• Manage accounts</li>
                <li>• Export data</li>
                <li>• View team members</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="font-medium">User</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create and edit own entries</li>
                <li>• View basic reports</li>
                <li>• Upload receipts</li>
                <li>• Use terminal interface</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
