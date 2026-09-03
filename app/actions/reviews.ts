"use server";

import { prisma as db } from "@/lib/prisma";
import { getCurrentAdmin, requireAuth } from "@/lib/auth";
import { getClientSession } from "@/app/actions/client-auth";

export async function toggleProfessionalLike(adminId: string, orgSlug: string) {
  try {
    const clientId = await getClientSession(orgSlug);
    if (!clientId) {
      return { success: false, message: "Você precisa estar logado para curtir." };
    }

    const existingLike = await db.professionalLike.findUnique({
      where: {
        client_id_admin_id: {
          client_id: clientId,
          admin_id: adminId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await db.professionalLike.delete({
        where: { id: existingLike.id },
      });
      return { success: true, action: "unliked" };
    } else {
      // Like
      await db.professionalLike.create({
        data: {
          client_id: clientId,
          admin_id: adminId,
        },
      });
      return { success: true, action: "liked" };
    }
  } catch (error) {
    console.error("Erro em toggleProfessionalLike:", error);
    return { success: false, message: "Erro ao processar a curtida." };
  }
}

export async function getProfessionalInteractions(adminId: string, orgSlug: string) {
  try {
    const clientId = await getClientSession(orgSlug);
    let isAdmin = false;
    try {
      const admin = await requireAuth();
      if (admin) isAdmin = true;
    } catch (e) {}

    const [likesCount, reviews, userLike] = await Promise.all([
      db.professionalLike.count({ where: { admin_id: adminId } }),
      db.professionalReview.findMany({
        where: { admin_id: adminId },
        include: { client: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      clientId
        ? db.professionalLike.findUnique({
            where: { client_id_admin_id: { client_id: clientId, admin_id: adminId } },
          })
        : Promise.resolve(null),
    ]);

    return {
      success: true,
      data: {
        likesCount,
        reviews,
        userHasLiked: !!userLike,
        currentClientId: clientId,
        isAdmin
      },
    };
  } catch (error) {
    console.error("Erro em getProfessionalInteractions:", error);
    return { success: false, data: null };
  }
}

export async function createProfessionalReview(adminId: string, orgSlug: string, text: string) {
  try {
    const clientId = await getClientSession(orgSlug);
    if (!clientId) {
      return { success: false, message: "Você precisa estar logado para avaliar." };
    }

    if (!text || text.trim().length === 0) {
      return { success: false, message: "O comentário não pode ser vazio." };
    }

    if (text.length > 280) {
      return { success: false, message: "O comentário excede o limite de 280 caracteres." };
    }

    const review = await db.professionalReview.create({
      data: {
        client_id: clientId,
        admin_id: adminId,
        text: text.trim(),
      },
    });

    return { success: true, data: review };
  } catch (error) {
    console.error("Erro em createProfessionalReview:", error);
    return { success: false, message: "Erro ao criar avaliação." };
  }
}

export async function replyProfessionalReview(reviewId: string, reply: string) {
  try {
    // Apenas o dono logado pode responder
    const admin = await requireAuth();

    if (!reply || reply.trim().length === 0) {
      return { success: false, message: "A resposta não pode ser vazia." };
    }

    const updatedReview = await db.professionalReview.update({
      where: { id: reviewId },
      data: { reply: reply.trim() },
    });

    return { success: true, data: updatedReview };
  } catch (error) {
    console.error("Erro em replyProfessionalReview:", error);
    return { success: false, message: "Erro ao responder a avaliação." };
  }
}

export async function deleteProfessionalReview(reviewId: string) {
  try {
    // Apenas o dono logado pode deletar
    const admin = await requireAuth();

    await db.professionalReview.delete({
      where: { id: reviewId },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro em deleteProfessionalReview:", error);
    return { success: false, message: "Erro ao deletar a avaliação." };
  }
}
