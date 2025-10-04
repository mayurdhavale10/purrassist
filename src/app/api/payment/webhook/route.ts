// src/app/api/payment/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { mongooseConnect } from "@/lib/dbConnect";
import ProductOrder from "@/models/ProductOrder";
import { getUsersCollection } from "@/models/user.model";
import type { PlanTier } from "@/models/user.model";

// Accept number | null | undefined to match order.amount shape
function mapAmountToPlanTier(amount: number | null | undefined): PlanTier {
  if (amount === 69) return "BASIC";     // previously "intercollege"
  if (amount === 169) return "PREMIUM";  // previously "gender"
  return "FREE";
}

/**
 * Cashfree sends headers: x-webhook-timestamp & x-webhook-signature (HMAC-SHA256 base64 over `${timestamp}${rawBody}`)
 * Keep this handler in App Router (route.ts) so we can read the *raw* body via req.text().
 */
function verifySignature(rawBody: string, timestamp: string, signature: string) {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret) return false;
  const signedPayload = `${timestamp}${rawBody}`;
  const computed = crypto.createHmac("sha256", secret).update(signedPayload).digest("base64");

  // timingSafeEqual throws if lengths differ — guard first
  const a = Buffer.from(signature || "", "utf8");
  const b = Buffer.from(computed, "utf8");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    await mongooseConnect();

    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const signature = req.headers.get("x-webhook-signature") || "";

    const rawBody = await req.text();

    if (!timestamp || !signature || !rawBody) {
      return NextResponse.json({ error: "Missing webhook headers or body" }, { status: 400 });
    }

    const valid = verifySignature(rawBody, timestamp, signature);
    if (!valid) {
      console.error("[Webhook] Signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Cashfree PG webhooks generally have `data` with `payment` and `order`
    const data = payload?.data || payload;
    const orderData = data?.order || data;
    const paymentData = data?.payment || data;

    const orderId: string | undefined = orderData?.order_id || orderData?.orderId;
    const cfOrderId: string | undefined =
      orderData?.cf_order_id ? String(orderData.cf_order_id) : undefined;

    const txId: string | undefined =
      paymentData?.cf_payment_id || paymentData?.payment_id || paymentData?.id;

    const paymentStatus: string =
      paymentData?.payment_status || orderData?.order_status || payload?.type || "";

    const paymentAmount: number | undefined =
      Number(paymentData?.payment_amount || orderData?.order_amount || 0) || undefined;

    const paymentTime: Date =
      paymentData?.payment_time ? new Date(paymentData.payment_time) : new Date();

    if (!orderId) {
      console.error("[Webhook] Missing order_id in payload", payload);
      return NextResponse.json({ error: "order_id missing" }, { status: 400 });
    }

    // Idempotent update: only push paymentHistory if this txId not seen before
    const isSuccess = String(paymentStatus).toUpperCase().includes("SUCCESS");

    const order = await ProductOrder.findOneAndUpdate(
      { orderId, ...(txId ? { "paymentHistory.transactionId": { $ne: txId } } : {}) },
      {
        $set: {
          cfOrderId: cfOrderId || undefined,
          status: isSuccess
            ? "PAID"
            : paymentStatus?.toUpperCase().includes("FAIL")
            ? "FAILED"
            : "ACTIVE",
          paymentStatus: isSuccess
            ? "SUCCESS"
            : paymentStatus?.toUpperCase().includes("FAIL")
            ? "FAILED"
            : "PENDING",
        },
        ...(txId && {
          $push: {
            paymentHistory: {
              transactionId: txId,
              amount: paymentAmount,
              paymentTime: paymentTime,

              // Store EXACTLY what Cashfree sent (no sanitizing):
              paymentMethod: paymentData?.payment_method ?? paymentData,
              paymentPayload: paymentData,

              status: paymentStatus,
            },
          },
        }),
      },
      { new: true }
    );

    if (!order) {
      // Might be a duplicate webhook for same txId (filter blocked the update)
      return NextResponse.json({ ok: true, note: "order not updated (duplicate or not found)" });
    }

    // If payment successful, update the User’s plan using Mongo driver (NOT Mongoose)
    if (isSuccess) {
      const email = order.customerEmail; // You sent email in create-order
      if (email) {
        const users = await getUsersCollection();

        await users.updateOne(
          { email: email },
          {
            $set: {
              planTier: mapAmountToPlanTier(order.amount), // ✅ accepts null/undefined
              planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),

              // Store the full raw payment info too
              "paymentDetails.transactionId": txId ?? null,
              "paymentDetails.amount": order.amount ?? null,
              "paymentDetails.paymentDate": paymentTime,
              "paymentDetails.paymentMethod": paymentData ?? null,

              updatedAt: new Date(),
            },
            $setOnInsert: {
              emailLower: email.trim().toLowerCase(),
              createdAt: new Date(),
            },
          },
          { upsert: false } // set true if you want to auto-create the user if missing
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ error: "Internal server error", message: err?.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint is active" });
}
