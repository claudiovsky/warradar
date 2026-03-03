import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request.headers.get("authorization"));
    if (!auth.ok) return auth.response!;

    const { id } = await params;
    await adminDb.collection("conflicts").doc(id).delete();

    return NextResponse.json({ message: `Conflict ${id} deleted` });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
