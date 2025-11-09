"use client";

import { UserWithRoles, UserStatus } from "@/lib/types";
import { UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMembersFilter } from "@/hooks/use-members-filter";
import { useMembersActions } from "@/hooks/use-members-actions";
import { useMembersHierarchy } from "@/hooks/use-members-hierarchy";
import { MembersSearchBar } from "@/components/members/members-search-bar";
import { MemberCard } from "@/components/members/member-card";
import { ChangeRoleDialog } from "@/components/members/change-role-dialog";
import { BanUserDialog } from "@/components/members/ban-user-dialog";
import { ViewProfileDialog } from "@/components/members/view-profile-dialog";
import { ResetPasswordDialog } from "@/components/members/reset-password-dialog";
import { DeleteUserDialog } from "@/components/members/delete-user-dialog";
import { RejectUserDialog } from "@/components/members/reject-user-dialog";

type AvailableRole = {
  id: string;
  name: string;
  color: string | null;
  priority: number;
};

interface MembersGridProps {
  members: UserWithRoles[];
  status: UserStatus;
  currentUserId?: string;
  canChangeRoles?: boolean;
  availableRoles: AvailableRole[];
}

/**
 * Composant principal pour afficher la grille des membres
 * Orchestre les hooks et composants enfants
 */
export function MembersGrid({
  members,
  status,
  currentUserId,
  canChangeRoles = false,
  availableRoles,
}: MembersGridProps) {
  const router = useRouter();

  // Hooks personnalisés
  const { searchQuery, setSearchQuery, filteredMembers } =
    useMembersFilter(members);
  const { canManageMap } = useMembersHierarchy(members, currentUserId);
  const {
    selectedUser,
    loading,
    isViewProfileOpen,
    setIsViewProfileOpen,
    isChangeRoleOpen,
    setIsChangeRoleOpen,
    isBanDialogOpen,
    setIsBanDialogOpen,
    isResetPasswordOpen,
    setIsResetPasswordOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isRejectDialogOpen,
    setIsRejectDialogOpen,
    handleViewProfile,
    handleChangeRole,
    handleResetPassword,
    handleBan,
    handleDelete,
    handleReject,
    handleAccept,
    handleUnban,
    setSelectedUser,
  } = useMembersActions();

  // État vide (aucun membre)
  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun membre dans cette catégorie</p>
      </div>
    );
  }

  return (
    <>
      {/* Barre de recherche */}
      <MembersSearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Liste des membres */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UserCircle className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {searchQuery
              ? "Aucun membre ne correspond à votre recherche"
              : "Aucun membre dans cette catégorie"}
          </p>
        </div>
      ) : (
        <div className="divide-y flex flex-col gap-2">
          {filteredMembers.map((member) => {
            const isLoading = loading === member.id;
            const isCurrentUser = member.id === currentUserId;
            const canManage = canManageMap[member.id] ?? false;

            return (
              <MemberCard
                key={member.id}
                member={member}
                status={status}
                isCurrentUser={isCurrentUser}
                isLoading={isLoading}
                canManage={canManage}
                canChangeRoles={canChangeRoles}
                onViewProfile={handleViewProfile}
                onChangeRole={handleChangeRole}
                onResetPassword={handleResetPassword}
                onBan={handleBan}
                onDelete={handleDelete}
                onAccept={handleAccept}
                onReject={handleReject}
                onUnban={handleUnban}
              />
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      {selectedUser && (
        <>
          <ViewProfileDialog
            user={selectedUser}
            open={isViewProfileOpen}
            onOpenChange={setIsViewProfileOpen}
            onSuccess={() => {
              router.refresh();
              setIsViewProfileOpen(false);
            }}
          />
          <ChangeRoleDialog
            user={selectedUser}
            open={isChangeRoleOpen}
            onOpenChange={setIsChangeRoleOpen}
            availableRoles={availableRoles}
            onSuccess={() => {
              router.refresh();
              setIsChangeRoleOpen(false);
              setSelectedUser(null);
            }}
          />
          <BanUserDialog
            user={selectedUser}
            open={isBanDialogOpen}
            onOpenChange={setIsBanDialogOpen}
            onSuccess={() => {
              router.refresh();
              setIsBanDialogOpen(false);
              setSelectedUser(null);
            }}
          />
          <ResetPasswordDialog
            user={selectedUser}
            open={isResetPasswordOpen}
            onOpenChange={setIsResetPasswordOpen}
            onSuccess={() => {
              setIsResetPasswordOpen(false);
              setSelectedUser(null);
            }}
          />
          <DeleteUserDialog
            user={selectedUser}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSuccess={() => {
              router.refresh();
              setIsDeleteDialogOpen(false);
              setSelectedUser(null);
            }}
          />
          <RejectUserDialog
            user={selectedUser}
            open={isRejectDialogOpen}
            onOpenChange={setIsRejectDialogOpen}
            onSuccess={() => {
              router.refresh();
              setIsRejectDialogOpen(false);
              setSelectedUser(null);
            }}
          />
        </>
      )}
    </>
  );
}
