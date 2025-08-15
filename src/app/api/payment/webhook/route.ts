import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import crypto from "crypto";

const PLANS = {
  free: { price: 0, planType: "free" },
  basic: { price: 69, planType: "intercollege" },
  premium: { price: 169, planType: "gender" },
} as const;

export async function POST(req: Request) {
  console.log("Webhook received!");
  
  // Log headers for debugging
  const headers = Object.fromEntries(req.headers.entries());
  console.log("Webhook headers:", headers);

  await mongooseConnect();

  try {
    // 1. Get raw body and signature
    const rawBody = await req.text();
    console.log("Webhook payload:", rawBody);
    
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      console.error("Missing webhook headers:", { signature, timestamp });
      return NextResponse.json(
        { error: "Missing required headers" },
        { status: 400 }
      );
    }

    // 2. Verify webhook signature (Updated method)
    const signedPayload = `${timestamp}${rawBody}`;
    const computedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_SECRET_KEY!)
      .update(signedPayload)
      .digest("base64");

    console.log("Signature verification:", {
      received: signature,
      computed: computedSignature,
      match: computedSignature === signature
    });

    if (computedSignature !== signature) {
      console.error("Signature mismatch");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // 3. Parse the payload
    const payload = JSON.parse(rawBody);
    console.log("Parsed payload:", JSON.stringify(payload, null, 2));
    
    // Handle different payload structures
    const data = payload.data || payload;
    const paymentData = data.payment || data;
    const orderData = data.order || data;

    if (!paymentData || !orderData) {
      console.error("Invalid payload structure:", { paymentData, orderData });
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // 4. Check for duplicate processing
    const transactionId = paymentData.cf_payment_id || paymentData.payment_id;
    if (transactionId) {
      const existingUser = await User.findOne({
        "paymentDetails.transactionId": transactionId,
      });
      if (existingUser) {
        console.log("Duplicate transaction detected:", transactionId);
        return NextResponse.json({ success: true, duplicate: true });
      }
    }

    // 5. Process payment
    if (paymentData.payment_status === "SUCCESS") {
      const orderAmount = parseFloat(orderData.order_amount || orderData.amount);
      const customerEmail = 
        data.customer_details?.customer_email || 
        orderData.customer_email ||
        paymentData.customer_email;

      if (!customerEmail) {
        console.error("Customer email not found in payload");
        return NextResponse.json(
          { error: "Customer email not found" },
          { status: 400 }
        );
      }

      // Determine plan from amount
      let planType: "free" | "intercollege" | "gender" = "free";
      if (orderAmount === PLANS.basic.price) {
        planType = "intercollege";
      } else if (orderAmount === PLANS.premium.price) {
        planType = "gender";
      }

      console.log("Updating user:", {
        email: customerEmail,
        planType,
        amount: orderAmount,
        transactionId
      });

      // Update user in database
      const updateResult = await User.findOneAndUpdate(
        { email: customerEmail },
        {
          planType,
          planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
          paymentDetails: {
            transactionId,
            amount: orderAmount,
            paymentDate: new Date(paymentData.payment_time || Date.now()),
            paymentMethod: paymentData.payment_mode,
          },
        },
        { 
          upsert: false, // Don't create new user if not found
          new: true // Return updated document
        }
      );

      if (updateResult) {
        console.log("User updated successfully:", updateResult.email);
      } else {
        console.error("User not found for email:", customerEmail);
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    } else {
      console.log("Payment not successful:", paymentData.payment_status);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// Add GET method for webhook verification during setup
export async function GET(req: Request) {
  return NextResponse.json({ message: "Webhook endpoint is active" });
}