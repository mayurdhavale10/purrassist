"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function GenderModal({ onSuccess }: { onSuccess: () => void }) {
  const { data: session, update } = useSession();
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedGender) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/gender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gender: selectedGender }),
      });

      if (res.ok) {
        // Trigger session update - this will fetch fresh data from database
        await update();
        
        // Then close the modal
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating gender:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Tell us about yourself</h2>
        <p className="text-gray-600 mb-6">
          Please select your gender to continue using our platform
        </p>
        
        <div className="space-y-3 mb-6">
          {['male', 'female', 'other'].map((gender) => (
            <button
              key={gender}
              onClick={() => setSelectedGender(gender)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedGender === gender
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!selectedGender || isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}