import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { requireAnyRole } from "@/lib/rbac";
import { db } from "@/db/drizzle";
import { roles } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    // Vérifier les permissions
    const session = await verifySession();
    await requireAnyRole(session.user.id, ["Admin", "Moderateur"]);

    // Récupérer tous les rôles triés par priorité
    const allRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
        color: roles.color,
        priority: roles.priority,
      })
      .from(roles)
      .orderBy(desc(roles.priority));

    return NextResponse.json(allRoles);
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les rôles" },
      { status: 500 }
    );
  }
}
