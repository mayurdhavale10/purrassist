import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/dbConnect";
import User from "@/models/User";

const PLANS = {
  intercollege: { price: 69 },
  genderSpecific: { price: 169 },
} as const;

export async function POST(req: Request) {
  try {
    await mongooseConnect();

    const { orderId, orderStatus, orderAmount, customerEmail } = await req.json();

    if (!orderId || !orderStatus || !orderAmount || !customerEmail) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (orderStatus === "PAID") {
      // Figure out plan from amount
      let plan: string | null = null;
      if (orderAmount === PLANS.intercollege.price) {
        plan = "intercollege";
      } else if (orderAmount === PLANS.genderSpecific.price) {
        plan = "genderSpecific";
      }

      if (plan) {
        await User.findOneAndUpdate(
          { email: customerEmail },
          {
            plan,
            planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
          }
        );
      }
    }

    // Respond quickly so Cashfree doesn’t retry unnecessarily
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ message: "Error processing webhook" }, { status: 500 });
  }
}
