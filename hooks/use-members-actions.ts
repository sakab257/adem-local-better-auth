import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserWithRoles } from "@/lib/types";
import { acceptUser, unbanUser } from "@/server/members";

/**
 * Hook personnalisé pour gérer les actions CRUD sur les membres
 * Gère l'état des dialogs et les actions asynchrones (accepter, débannir)
 */
export function useMembersActions() {
  const router = useRouter();

  // États pour les dialogs
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Actions pour ouvrir les dialogs
  const handleViewProfile = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsViewProfileOpen(true);
  };

  const handleChangeRole = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsChangeRoleOpen(true);
  };

  const handleResetPassword = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsResetPasswordOpen(true);
  };

  const handleBan = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsBanDialogOpen(true);
  };

  const handleDelete = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsDeleteDialogOpen(true);
  };

  const handleReject = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsRejectDialogOpen(true);
  };

  // Actions asynchrones directes (sans dialog)
  const handleAccept = async (member: UserWithRoles) => {
    setLoading(member.id);
    const result = await acceptUser(member.id);
    setLoading(null);

    if (result.success) {
      toast.success(`${member.name} a été accepté`);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de l'acceptation");
    }
  };

  const handleUnban = async (member: UserWithRoles) => {
    setLoading(member.id);
    const result = await unbanUser(member.id);
    setLoading(null);

    if (result.success) {
      toast.success(`${member.name} a été débanni`);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors du débannissement");
    }
  };

  // Callbacks pour fermer les dialogs après succès
  const onDialogSuccess = (dialogSetter: (open: boolean) => void) => {
    router.refresh();
    dialogSetter(false);
    setSelectedUser(null);
  };

  return {
    // État
    selectedUser,
    loading,

    // États des dialogs
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

    // Handlers pour ouvrir les dialogs
    handleViewProfile,
    handleChangeRole,
    handleResetPassword,
    handleBan,
    handleDelete,
    handleReject,

    // Actions asynchrones directes
    handleAccept,
    handleUnban,

    // Helper pour success callback
    onDialogSuccess,

    // Setter pour selectedUser
    setSelectedUser,
  };
}
