import {
  Building2,
  Check,
  HelpCircle,
  LogIn,
  LogOut,
  Plus,
  Settings,
  Tag,
  User,
  UserPlus,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { CreateOrganizationForm } from '../../organization/createOrganizationForm'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authClient } from '@/lib/auth/auth-client'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { fundAPublicListDefaultSearch } from '@/types/fund-a-project'
import { requestsPublicListDefaultSearch } from '@/sfn/requests'
import { getOptionalCurrentUser } from '@/sfn/users'
import { ModeToggle } from '@/components/mode-toggle'

interface HeaderDropdownProps {
  onCreateOrgClick: () => void
}
const navLinkStyles =
  'uppercase font-bold tracking-tight transition-colors hover:text-primary'
const activeStyles = {
  className: 'text-primary underline underline-offset-8 decoration-4',
}

const TopNavHeader = () => {
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)

  return (
    <div className="bg-sidebar py-1 pb-2 px-4 flex justify-between items-center border-b">
      <span className="font-semibold uppercase text-lg italic">
        Peer Request
      </span>
      <div className="inline-flex gap-4 uppercase">
        <Link
          to="/fund-a-project"
          search={fundAPublicListDefaultSearch}
          className={navLinkStyles}
          activeProps={activeStyles}
        >
          Fund-A-Project
        </Link>
        <Link
          to="/requests"
          search={requestsPublicListDefaultSearch}
          className={navLinkStyles}
          activeProps={activeStyles}
        >
          Requests
        </Link>
        <Link to="/events" className={navLinkStyles} activeProps={activeStyles}>
          Events
        </Link>
        <Link to="/data" className={navLinkStyles} activeProps={activeStyles}>
          Data
        </Link>
      </div>
      <div className="inline-flex gap-2">
        <ModeToggle />
        <HeaderDropdown onCreateOrgClick={() => setIsCreateOrgOpen(true)} />
        <CreateOrganizationForm
          open={isCreateOrgOpen}
          onOpenChange={setIsCreateOrgOpen}
        />
      </div>
    </div>
  )
}

function GuestHeaderDropdown() {
  const navigate = useNavigate()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="outline-none">
        <Avatar size="sm" className="hover:opacity-80 transition-opacity">
          <AvatarFallback>
            <User className="size-4 opacity-70" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => navigate({ to: '/login' })}
        >
          <LogIn className="h-4 w-4" />
          Sign in
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => navigate({ to: '/signup' })}
        >
          <UserPlus className="h-4 w-4" />
          Create account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AuthenticatedHeaderDropdown({
  currentUser,
  onCreateOrgClick,
}: HeaderDropdownProps & {
  currentUser: { id: string; name: string; email: string; image: string | null }
}) {
  const navigate = useNavigate()
  const { data: activeOrganization } = authClient.useActiveOrganization()

  const initials = currentUser.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const logout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: '/login' })
        },
      },
    })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="outline-none">
        <Avatar size="sm" className="hover:opacity-80 transition-opacity">
          {currentUser.image ? (
            <AvatarImage src={currentUser.image} alt={currentUser.name} />
          ) : null}
          <AvatarFallback>{initials || '?'}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <Item>
              <ItemMedia>
                <Avatar>
                  {currentUser.image ? (
                    <AvatarImage
                      src={currentUser.image}
                      alt={currentUser.name}
                    />
                  ) : null}
                  <AvatarFallback>{initials || '?'}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent className="gap-1">
                <ItemTitle>{currentUser.name}</ItemTitle>
                <ItemDescription>{currentUser.email}</ItemDescription>
              </ItemContent>
            </Item>
          </DropdownMenuLabel>
          {activeOrganization && (
            <div className="px-3 py-1.5">
              <Badge
                variant="outline"
                className="w-full justify-between py-3 font-normal"
              >
                <span className="flex items-center gap-3 capitalize">
                  <Building2 className="w-4 h-4 opacity-70" />
                  {activeOrganization.name}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  Current
                </span>
              </Badge>
            </div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <OrganizationSwitcher onCreateOrgClick={onCreateOrgClick} />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate({ to: `/u/${currentUser.id}/profile` })}
        >
          <User className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate({ to: `/u/${currentUser.id}/settings` })}
        >
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            navigate({
              to: '/u/$uId/tags',
              params: { uId: currentUser.id },
            })
          }
        >
          <Tag className="h-4 w-4" />
          Tags
        </DropdownMenuItem>
        {activeOrganization && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                navigate({ to: `/orgs/${activeOrganization.id}/profile` })
              }
            >
              <Building2 className="h-4 w-4" />
              View Organization
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigate({ to: `/orgs/${activeOrganization.id}/members` })
              }
            >
              <Users className="h-4 w-4" />
              View People
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem>
          <HelpCircle className="h-4 w-4" />
          Help
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 text-destructive focus:text-destructive hover:text-destructive stroke-destructive" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const HeaderDropdown = ({ onCreateOrgClick }: HeaderDropdownProps) => {
  const getOptionalUser = useServerFn(getOptionalCurrentUser)

  const { data: authPayload, isPending } = useQuery({
    queryKey: ['optionalCurrentUser'],
    queryFn: () => getOptionalUser(),
  })

  if (isPending) {
    return (
      <div
        className="size-8 shrink-0 rounded-full bg-muted animate-pulse"
        aria-label="Loading account"
      />
    )
  }

  if (!authPayload) {
    return <GuestHeaderDropdown />
  }

  return (
    <AuthenticatedHeaderDropdown
      currentUser={authPayload.currentUser}
      onCreateOrgClick={onCreateOrgClick}
    />
  )
}
interface OrganizationSwitcherProps {
  onCreateOrgClick: () => void
}
const OrganizationSwitcher = ({
  onCreateOrgClick,
}: OrganizationSwitcherProps) => {
  const { data: activeOrganization } = authClient.useActiveOrganization()
  const { data: organizations } = authClient.useListOrganizations()

  const handleChangeOrganization = async (organizationId: string) => {
    try {
      await authClient.organization.setActive({
        organizationId,
      })
      toast.success('Organization switched successfully')
    } catch (error) {
      toast.error('Failed to switch organization')
    }
  }
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Building2 className="h-4 w-4" />
        <span>Switch Organization</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {organizations && organizations.length > 0 ? (
          organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleChangeOrganization(org.id)}
              className="cursor-pointer capitalize"
            >
              {activeOrganization?.id === org.id ? (
                <Check className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4" />
              )}
              {org.name}
            </DropdownMenuItem>
          ))
        ) : (
          <span className="text-muted-foreground text-xs">
            Join a organization
          </span>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onCreateOrgClick()}
          className="cursor-pointer font-medium text-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Organization
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
export { TopNavHeader }
