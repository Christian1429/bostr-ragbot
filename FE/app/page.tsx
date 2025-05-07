'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import RagComponent from './components/RagComponent';
import Login from './components/Login';
import UserProfileForm from './components/UserProfileForm';
import { hasUserCompletedProfile } from '../utils/userProfileService';

export default function Home() {
  const { user, loading } = useAuth();
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (user) {
        setIsCheckingProfile(true);
        try {
          const hasProfile = await hasUserCompletedProfile(user.uid);
          setProfileCompleted(hasProfile);
        } catch (error) {
          console.error('Error checking profile status:', error);
        } finally {
          setIsCheckingProfile(false);
        }
      } else {
        setProfileCompleted(null);
        setIsCheckingProfile(false);
      }
    };

    if (!loading) {
      checkUserProfile();
    }
  }, [user, loading]);

  // Show loading state
  if (loading || isCheckingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            style={{
              backgroundImage: 'var(--bostr-logo-url)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              width: '160px',
              height: '80px',
              margin: '0 auto',
              marginBottom: '1rem',
            }}
          >
            <span className="sr-only">BOSTR Logo</span>
          </div>
          <div className="mt-4 text-gray-600">Laddar...</div>
        </div>
      </div>
    );
  }

  // User is not logged in, show login
  if (!user) {
    return <Login />;
  }

  // User is logged in but hasn't completed profile
  if (profileCompleted === false) {
    return <UserProfileForm onProfileComplete={() => setProfileCompleted(true)} />;
  }

  // User is logged in and has completed profile
  return <RagComponent />;
}