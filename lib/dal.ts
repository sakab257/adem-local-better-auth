import { cache } from "react";
import { auth } from "./auth";
import { headers } from "next/headers";

export const verifySession = cache(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Pas autorisé");
    return session;
});