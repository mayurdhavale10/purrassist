import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/models/User'; // Adjust the import path to your User model
import { mongooseConnect } from '@/lib/dbConnect';
import { auth } from '../../../../../auth';

// Define interfaces for better type safety
interface UserData {
  email: string;
  name?: string;
  image?: string;
  gender?: string;
  planType: 'free' | 'gender' | 'intercollege';
  planExpiry?: Date | string;
}

interface MatchingOption {
  type: string;
  label: string;
  description: string;
  icon: string;
  requiresGender?: 'male' | 'female';
}

interface PlanStatus {
  isActive: boolean;
  planName: string;
  expiresAt?: Date | string;
  daysRemaining: number | null;
}

interface ApiResponse {
  user: {
    email: string;
    name?: string;
    image?: string;
    gender?: string;
    college: string;
    planType: string;
    hasActivePlan: boolean;
    planExpiry?: Date | string;
    daysRemaining: number | null;
  };
  matchingOptions: MatchingOption[];
  planStatus: PlanStatus;
}

// For App Router (Next.js 13+)
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Get session from NextAuth
    const session = await auth();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const email: string = session.user.email as string;

    // Connect to MongoDB
    await mongooseConnect();

    // Find user directly from MongoDB
    const userData: UserData | null = await User.findOne({ email });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Extract college from email with proper typing
    const extractCollege = (email: string): string => {
      const domain = email.split('@')[1];
      if (!domain) return 'unknown';
      
      const commonProviders: string[] = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      if (commonProviders.includes(domain.toLowerCase())) {
        return 'general';
      }
      
      return domain.replace(/\.(edu|ac\.in|edu\.in|org|com)$/i, '').toLowerCase();
    };

    // Check if plan is active with proper typing
    const isPlanActive = (planType: string, planExpiry?: Date | string): boolean => {
      if (planType === 'free') return true;
      if (!planExpiry) return false;
      return new Date() < new Date(planExpiry);
    };

    const college: string = extractCollege(userData.email);
    const hasActivePlan: boolean = isPlanActive(userData.planType, userData.planExpiry);
    
    // Calculate days remaining
    let daysRemaining: number | null = null;
    if (userData.planExpiry && new Date(userData.planExpiry) > new Date()) {
      daysRemaining = Math.ceil((new Date(userData.planExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    }

    // Determine matching options based on plan
    let matchingOptions: MatchingOption[] = [];
    
    if (hasActivePlan) {
      switch (userData.planType) {
        case 'gender':
          matchingOptions = [
            {
              type: 'same_college_any',
              label: 'Same College - Any Gender',
              description: `Match with anyone from ${college}`,
              icon: '🏫'
            },
            {
              type: 'same_college_male',
              label: 'Same College - Male Only',
              description: `Match with males from ${college}`,
              icon: '👨‍🎓',
              requiresGender: 'male'
            },
            {
              type: 'same_college_female',
              label: 'Same College - Female Only', 
              description: `Match with females from ${college}`,
              icon: '👩‍🎓',
              requiresGender: 'female'
            }
          ];
          break;
          
        case 'intercollege':
          matchingOptions = [
            {
              type: 'any_college_any',
              label: 'Any College - Any Gender',
              description: 'Match with anyone from any college',
              icon: '🌍'
            },
            {
              type: 'any_college_male',
              label: 'Any College - Male Only',
              description: 'Match with males from any college',
              icon: '👨‍🎓',
              requiresGender: 'male'
            },
            {
              type: 'any_college_female',
              label: 'Any College - Female Only',
              description: 'Match with females from any college',
              icon: '👩‍🎓',
              requiresGender: 'female'
            },
            {
              type: 'same_college_any',
              label: 'Same College - Any Gender',
              description: `Match with anyone from ${college}`,
              icon: '🏫'
            }
          ];
          break;
          
        default: // free
          matchingOptions = [
            {
              type: 'same_college_any',
              label: 'Same College Only',
              description: `Match with anyone from ${college} (Free Plan)`,
              icon: '🏫'
            }
          ];
      }
    } else {
      matchingOptions = [
        {
          type: 'same_college_any',
          label: 'Same College Only',
          description: `Match with anyone from ${college} (Free Plan)`,
          icon: '🏫'
        }
      ];
    }

    const response: ApiResponse = {
      user: {
        email: userData.email,
        name: userData.name,
        image: userData.image,
        gender: userData.gender,
        college,
        planType: userData.planType,
        hasActivePlan,
        planExpiry: userData.planExpiry,
        daysRemaining
      },
      matchingOptions,
      planStatus: {
        isActive: hasActivePlan,
        planName: userData.planType === 'gender' ? 'Gender Plan' : 
                 userData.planType === 'intercollege' ? 'Inter-College Plan' : 
                 'Free Plan',
        expiresAt: userData.planExpiry,
        daysRemaining
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}