'use client';

import React, { useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { db } from '../../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';

type UserProfile = {
  name: string;
  age: string;
  gender: string;
  monthlyIncome: string;
};

type Props = {
  onProfileComplete: () => void;
};

export default function UserProfileForm({ onProfileComplete }: Props) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    age: '',
    gender: '',
    monthlyIncome: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Du måste vara inloggad för att skicka in din profil.');
      return;
    }

    // Validate form data
    if (!formData.name || !formData.age || !formData.gender || !formData.monthlyIncome) {
      setError('Alla fält måste fyllas i.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Save to Firestore - we'll use the user's UID as the document ID
      await setDoc(doc(db, 'userProfiles', user.uid), {
        ...formData,
        createdAt: new Date(),
        userId: user.uid,
        email: user.email
      });
      
      onProfileComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Det uppstod ett fel när profilen sparades. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div
          style={{
            backgroundImage: 'var(--bostr-logo-url)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            width: '160px',
            height: '80px',
            margin: '0 auto',
          }}
        >
          <span className="sr-only">BOSTR Logo</span>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-800">Din Profil</h1>
        <p className="text-center text-gray-600">Fyll i dina uppgifter innan du fortsätter</p>
        
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Namn
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 text-black"
            />
          </div>
          
          {/* Age Field */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">
              Ålder
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min="18"
              max="120"
              required
              value={formData.age}
              onChange={handleChange}
              className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 text-black"
            />
          </div>
          
          {/* Gender Field */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Kön
            </label>
            <select
              id="gender"
              name="gender"
              required
              value={formData.gender}
              onChange={handleChange}
              className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 text-black"
            >
              <option value="">Välj kön</option>
              <option value="male">Man</option>
              <option value="female">Kvinna</option>
              <option value="other">Annat</option>
              <option value="prefer_not_to_say">Vill inte ange</option>
            </select>
          </div>
          
          {/* Monthly Income Field */}
          <div>
            <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700">
              Månadsinkomst (brutto i SEK)
            </label>
            <input
              id="monthlyIncome"
              name="monthlyIncome"
              type="number"
              min="0"
              step="1000"
              required
              value={formData.monthlyIncome}
              onChange={handleChange}
              className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 text-black"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-[#4C2040] hover:bg-[#3a1830] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Sparar...' : 'Spara och fortsätt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}